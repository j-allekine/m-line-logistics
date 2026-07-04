## Git workflow
- Never run `git add` or `git commit` automatically.
- Always stop after verification steps and let me review the diff first.

## Google Apps Script best practices
- Minimize calls to Apps Script services and external services. Prefer JavaScript work in memory over repeated calls to `SpreadsheetApp`, `DriveApp`, `GmailApp`, `UrlFetchApp`, or other services.
- Batch spreadsheet reads and writes. Read ranges into arrays with `getValues()`, calculate in memory, then write back with one `setValues()` or another bulk setter where possible.
- Avoid alternating read/write calls inside loops. This is one of the main causes of slow Sheets scripts and timeout risk.
- Keep runtime limits in mind. Apps Script executions are commonly limited to about 6 minutes, so split long jobs into smaller chunks and use installable time-driven triggers plus stored progress when a process can exceed that.
- Use `CacheService` only for data that is expensive to fetch or compute and safe to reuse briefly. Do not cache values that must always reflect the latest sheet state.
- Avoid unnecessary libraries in UI-heavy code, especially flows that make repeated short `google.script.run` calls, because libraries add startup latency.
- Keep code compatible with the Apps Script V8 runtime. Modern JavaScript is mostly available, but ES modules are not; do not use `import` or `export` unless a bundling/deployment flow is explicitly added.
- Avoid top-level side effects. Apps Script files share a global scope, so define functions and constants predictably and keep execution inside explicit entry points, triggers, or menu handlers.
- Watch quotas when sending email, using triggers, fetching URLs, or writing many properties. Check remaining email quota before bulk sends and design write-heavy flows to be retryable.
- For Sheets-backed workflows, prefer stable table IDs, named headers, and shared helpers over hard-coded column positions.
