# Google Apps Script Best Practices

Based on official Google Apps Script / Google Workspace documentation.

---

## 1. Minimize service calls

Apps Script runs faster when you do work in JavaScript instead of repeatedly calling Google services like Sheets, Docs, Drive, Gmail, or external APIs. Service calls are slower because they require communication with Google servers or external servers.

### Bad pattern

```js
for (let i = 1; i <= 100; i++) {
  const value = sheet.getRange(i, 1).getValue();
  sheet.getRange(i, 2).setValue(value * 2);
}
```

### Better pattern

```js
const values = sheet.getRange(1, 1, 100, 1).getValues();

const output = values.map(row => [row[0] * 2]);

sheet.getRange(1, 2, output.length, 1).setValues(output);
```

### Rule

> Read once. Process in memory. Write once.

---

## 2. Batch reads and writes

Google recommends batching read and write operations because it significantly improves script speed. For spreadsheet systems, this means using `getValues()` and `setValues()` instead of looping through cells one by one.

### Best practice

```js
const data = sheet.getDataRange().getValues();

// Process data in JavaScript

sheet.getRange(2, 1, output.length, output[0].length).setValues(output);
```

### Avoid

```js
sheet.getRange(row, col).setValue(value);
```

inside loops.

---

## 3. Respect Apps Script quotas

Apps Script services have daily quotas and limits. If your script exceeds a quota, Apps Script throws an exception and execution stops. Google also notes that quotas are subject to change, so systems should not be designed as if limits are permanent or unlimited.

### Best practices

- Avoid unnecessary reads/writes.
- Avoid excessive trigger executions.
- Avoid sending too many emails through `MailApp` or `GmailApp`.
- Design bulk operations to run in controlled batches.
- Use logging to detect quota-related failures.

---

## 4. Use Cache Service for repeated data

Google recommends using Cache Service to store data between script executions and reduce repeated fetching time. This is useful for data that does not need to be recalculated every run.

### Example use cases

- Dropdown source lists
- Settings/configuration
- Dashboard summary values
- API responses
- User permissions

### Example

```js
function getCachedSettings_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('settings');

  if (cached) {
    return JSON.parse(cached);
  }

  const settings = loadSettingsFromSheet_();

  cache.put('settings', JSON.stringify(settings), 600);

  return settings;
}
```

Cache values have limits, including a maximum value size per key and expiration behavior, so it should not be used as a permanent database.

---

## 5. Use Properties Service for configuration

Properties Service stores simple key-value data scoped to the script, user, or document. It is useful for developer configuration or user preferences.

### Good uses

- License key
- Original spreadsheet ID
- Version number
- Admin email
- Feature flags
- API configuration

### Example

```js
function getOriginalSpreadsheetId_() {
  return PropertiesService
    .getScriptProperties()
    .getProperty('ORIGINAL_SPREADSHEET_ID');
}
```

### For spreadsheet systems

Use this for license/protection logic:

```js
function validateOriginalFile_() {
  const originalId = PropertiesService
    .getScriptProperties()
    .getProperty('ORIGINAL_SPREADSHEET_ID');

  const currentId = SpreadsheetApp.getActive().getId();

  if (currentId !== originalId) {
    throw new Error('This system is not authorized to run in this copied file.');
  }
}
```

---

## 6. Use narrow authorization scopes

Use the least permissive OAuth scopes possible. Published apps and add-ons should not request more permissions than they need.

### Better

Use read-only scope when you only need to read spreadsheets.

### Worse

Request full Drive or Gmail access when your script only needs the active spreadsheet.

### Useful option

For spreadsheet-bound scripts, use:

```js
/**
 * @OnlyCurrentDoc
 */
```

`@OnlyCurrentDoc` limits authorization for scripts that only need the current document.

---

## 7. Be careful with triggers

Apps Script triggers can run functions automatically when events happen, and trigger functions receive an event object such as `e`. Use the event object to determine what changed instead of scanning the entire sheet unnecessarily.

### Good pattern

```js
function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();

  if (sheet.getName() !== 'Sales Form') return;
  if (range.getColumn() !== 3) return;

  // Only process the edited cell/row
}
```

### Avoid

```js
function onEdit(e) {
  const data = SpreadsheetApp.getActive()
    .getSheetByName('Sales Form')
    .getDataRange()
    .getValues();

  // Reprocesses everything on every edit
}
```

### Rule

> In triggers, react only to the changed range whenever possible.

---

## 8. Use logging and the Apps Script dashboard

Use execution logs for development and debugging. Apps Script supports both `Logger` and `console` logging.

The Apps Script dashboard also shows previous and running executions, including execution status such as completed, failed, or running.

### Example

```js
function processSales_() {
  console.time('processSales');

  try {
    // Main logic here
    console.log('Sales processed successfully.');
  } catch (err) {
    console.error({
      message: err.message,
      stack: err.stack
    });

    throw err;
  } finally {
    console.timeEnd('processSales');
  }
}
```

---

## 9. Use structured project organization

For serious systems, split code by purpose.

### Recommended file structure

```txt
Code.gs
Config.gs
Menu.gs
Validation.gs
SalesService.gs
InventoryService.gs
ReportService.gs
SheetRepository.gs
Utils.gs
```

### Example pattern

```js
function submitSalesForm() {
  validateOriginalFile_();

  const payload = getSalesFormPayload_();

  validateSalesPayload_(payload);

  saveSalesTransaction_(payload);

  clearSalesForm_();
}
```

Keep the public function simple. Move the actual work into smaller private functions.

---

## 10. Use private helper functions

Functions ending with an underscore are commonly used as private-style helper functions.

### Example

```js
function submitOrder() {
  const order = getOrderFromForm_();
  saveOrder_(order);
}

function getOrderFromForm_() {
  // Private helper
}

function saveOrder_(order) {
  // Private helper
}
```

### Rule

> User-facing functions should be clean. Internal helper functions should end with `_`.

---

## 11. Avoid excessive libraries in UI-heavy scripts

Libraries can increase delay in scripts that make many short-running `google.script.run` calls, especially HTML Service user interfaces.

### For web apps and sidebars

Avoid this pattern:

```js
google.script.run.getItem();
google.script.run.getCustomer();
google.script.run.getSettings();
google.script.run.getInventory();
```

Use one bundled call instead:

```js
google.script.run
  .withSuccessHandler(renderPage)
  .getInitialAppData();
```

---

## 12. Follow HTML Service security restrictions

Apps Script HTML Service uses iframe sandboxing to protect users from malicious HTML or JavaScript. Active content like scripts and external stylesheets in iframe mode should load over HTTPS.

### Best practices

- Load external scripts only from trusted HTTPS sources.
- Do not expose sensitive data directly in frontend JavaScript.
- Validate all user inputs on the server side.
- Use `google.script.run` for controlled server calls.
- Do not trust client-side validation only.

---

## 13. For web apps, separate frontend and backend logic

Apps Script can serve HTML pages that interact with server-side Apps Script functions.

### Recommended pattern

```txt
Index.html
Styles.html
JavaScript.html
WebApp.gs
ApiService.gs
SheetRepository.gs
```

### Example backend

```js
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Inventory System');
}

function getInitialAppData() {
  return {
    items: getActiveItems_(),
    settings: getAppSettings_()
  };
}
```

---

## 14. Use deployments and versions properly

Apps Script versions are snapshots of a script project. When creating deployments, a version must be specified.

### Best practice

Use versions for stable releases:

```txt
v1.0.0 - Initial release
v1.1.0 - Added inventory report
v1.1.1 - Fixed sales form validation
```

### Avoid

Editing production code directly without keeping track of what changed.

---

## 15. Design for failure

Apps Script executions can fail because of:

- quota limits
- authorization issues
- deleted sheets
- renamed headers
- invalid user input
- network/API errors
- concurrent edits

### Example

```js
function safeRun_(callback) {
  try {
    return callback();
  } catch (err) {
    console.error({
      message: err.message,
      stack: err.stack
    });

    SpreadsheetApp.getUi().alert(
      'Something went wrong: ' + err.message
    );

    throw err;
  }
}
```

---

## 16. Use locks for critical write operations

For spreadsheet systems, use `LockService` when two users might submit at the same time.

### Example

```js
function submitTransaction() {
  const lock = LockService.getDocumentLock();

  lock.waitLock(30000);

  try {
    // Read latest ID
    // Write transaction
    // Update ledger
  } finally {
    lock.releaseLock();
  }
}
```

### When to use

- Sales submission
- Stock-in submission
- Payment posting
- ID generation
- Ledger writing
- Any multi-row database write

---

## 17. Validate headers before writing

Spreadsheet systems break easily when users rename, remove, or reorder columns.

### Best practice

Check required headers before writing.

```js
function assertHeaders_(sheet, requiredHeaders) {
  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0];

  const missing = requiredHeaders.filter(h => !headers.includes(h));

  if (missing.length > 0) {
    throw new Error('Missing required headers: ' + missing.join(', '));
  }
}
```

---

## 18. Use header-based column mapping

Avoid hardcoding column numbers.

### Bad

```js
sheet.getRange(row, 7).setValue(status);
```

### Better

```js
const col = getColumnMap_(sheet);
sheet.getRange(row, col['Status']).setValue(status);
```

### Example

```js
function getColumnMap_(sheet) {
  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0];

  return headers.reduce((map, header, index) => {
    map[header] = index + 1;
    return map;
  }, {});
}
```

---

## 19. Keep formulas in sheets, business logic in Apps Script

For spreadsheet systems:

### Good formula use

- Dashboard calculations
- Helper reports
- Live lookups
- Filtering views
- Simple validations

### Good Apps Script use

- Submitting forms
- Writing database rows
- Generating IDs
- Validating transactions
- Protecting sheets
- Exporting PDFs
- Clearing forms
- Posting finalized records

### Rule

> Formulas are for live calculation. Apps Script is for controlled actions.

---

## 20. Avoid editing protected or formula-heavy areas directly

For user-facing spreadsheet systems:

- Keep input cells separate from formula cells.
- Protect database sheets.
- Protect report sheets.
- Use Apps Script buttons for controlled writes.
- Never let users manually edit ledger/database sheets unless necessary.

---

## 21. Use consistent naming conventions

### Recommended

```txt
Sheets:
Items
Sales_Form
Sales_DB
Stock_Ledger
Settings
Dashboard

Functions:
submitSalesForm()
clearSalesForm()
postStockIn()
generateSalesId_()
validateSalesForm_()

Constants:
SHEET_NAMES
CONFIG
HEADERS
```

### Example

```js
const SHEET_NAMES = {
  SALES_FORM: 'Sales_Form',
  SALES_DB: 'Sales_DB',
  STOCK_LEDGER: 'Stock_Ledger',
  SETTINGS: 'Settings'
};
```

---

## 22. Centralize constants

Do not scatter sheet names, ranges, and headers everywhere.

### Bad

```js
SpreadsheetApp.getActive().getSheetByName('Sales_DB');
SpreadsheetApp.getActive().getSheetByName('Sales DB');
SpreadsheetApp.getActive().getSheetByName('sales_db');
```

### Better

```js
const SHEETS = {
  SALES_DB: 'Sales_DB'
};

function getSalesDbSheet_() {
  return SpreadsheetApp
    .getActive()
    .getSheetByName(SHEETS.SALES_DB);
}
```

---

## 23. Use one source of truth for IDs

For transaction systems, IDs should be generated in one controlled function.

```js
function generateStockInId_() {
  const datePart = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyyMMdd'
  );

  const uniquePart = Utilities.getUuid().slice(0, 8).toUpperCase();

  return `SI-${datePart}-${uniquePart}`;
}
```

For stock-in systems, one Stock ID should belong to one submission, not one item row.

---

## 24. Use bulk append carefully

Apps Script has `appendRow()`, but for multiple rows, it is better to write the entire block using `setValues()`.

### Better

```js
const startRow = dbSheet.getLastRow() + 1;

dbSheet
  .getRange(startRow, 1, rows.length, rows[0].length)
  .setValues(rows);
```

---

## 25. Build systems around tables/DB sheets

For spreadsheet apps, use a database-style structure:

```txt
Sales_DB
Stock_In_DB
Stock_Out_DB
Stock_Ledger
Items
Customers
Suppliers
Payments_DB
```

Each row should represent a clean record. Avoid merged cells in database sheets.

---

# Practical Checklist

## Performance

- Batch `getValues()` and `setValues()`.
- Avoid cell-by-cell loops.
- Minimize calls to Google services.
- Cache repeated data.
- Avoid unnecessary trigger runs.

## Security

- Use least-permissive OAuth scopes.
- Use `@OnlyCurrentDoc` when possible.
- Protect database/report sheets.
- Validate file ID for licensed templates.
- Do not expose sensitive logic only on the frontend.

## Reliability

- Use locks for submissions.
- Validate headers.
- Use try/catch logging.
- Use dashboard execution history.
- Handle quota errors.
- Avoid hardcoded column numbers.

## Maintainability

- Split files by responsibility.
- Use constants.
- Use private helper functions with `_`.
- Keep public functions clean.
- Version deployments.
- Use clear naming conventions.

## Spreadsheet System Design

- Keep forms separate from databases.
- Keep formulas out of database sheets.
- Use Apps Script for posting/finalizing records.
- Use formulas for reporting and dashboards.
- Store settings in a dedicated Settings sheet or Properties Service.

---

# Official Reference Links

- Apps Script Best Practices: https://developers.google.com/apps-script/guides/support/best-practices
- Apps Script Quotas: https://developers.google.com/apps-script/guides/services/quotas
- Cache Service: https://developers.google.com/apps-script/reference/cache/cache
- Properties Service: https://developers.google.com/apps-script/guides/properties
- Authorization Scopes: https://developers.google.com/apps-script/concepts/scopes
- Authorization and `@OnlyCurrentDoc`: https://developers.google.com/apps-script/guides/services/authorization
- Triggers and Event Objects: https://developers.google.com/apps-script/guides/triggers/events
- Logging: https://developers.google.com/apps-script/guides/logging
- Apps Script Dashboard: https://developers.google.com/apps-script/guides/dashboard
- HTML Service: https://developers.google.com/apps-script/guides/html
- HTML Service Restrictions: https://developers.google.com/apps-script/guides/html/restrictions
- Apps Script Versions: https://developers.google.com/apps-script/api/reference/rest/v1/projects.versions
- Troubleshooting: https://developers.google.com/apps-script/guides/support/troubleshooting
