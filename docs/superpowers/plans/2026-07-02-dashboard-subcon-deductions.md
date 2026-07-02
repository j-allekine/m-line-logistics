# Dashboard Subcon Deductions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update dashboard server-side calculations so paid Subcon Deductions affect revenue, cost, net income, cash flow, current balance, and monthly financial performance without changing the dashboard UI.

**Architecture:** Keep the existing Apps Script module shape. Load `subconDeductions` in the dashboard source-data path, thread those records through the existing dashboard calculation functions, and add small helper functions in `dashboard/Helpers.js` for paid-deduction filtering and summing. Do not change `dashboard/Dialog.html`, `dashboard/Scripts.html`, or `dashboard/Styles.html`.

**Tech Stack:** Google Apps Script JavaScript, local Node.js test harness using built-in `assert` and `vm`.

---

## File Structure

- Create: `tests/dashboard_calculations.test.js`
  - Local test harness for dashboard calculations. It loads Apps Script source files into a Node VM and asserts the agreed deduction behavior.
- Modify: `dashboard/Server.js`
  - Load `subconDeductions` records.
  - Include paid deduction dates in available dashboard periods.
  - Pass deduction records into `calculateDashboard_`.
- Modify: `dashboard/Calculate.js`
  - Accept `subconDeductionsRecords`.
  - Pass deductions into KPI, cashflow, current balance, and monthly financial chart builders.
- Modify: `dashboard/Helpers.js`
  - Add paid-deduction helper functions.
  - Update revenue, cost, cashflow, current balance, available periods, and monthly financial performance calculations.

Do not modify UI files in this pass.

---

### Task 1: Add Failing Dashboard Calculation Tests

**Files:**
- Create: `tests/dashboard_calculations.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/dashboard_calculations.test.js` with this content:

```js
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");

function loadAppsScriptContext() {
  const context = {
    console
  };

  vm.createContext(context);

  [
    "tables/Utils.js",
    "dashboard/Helpers.js",
    "dashboard/Calculate.js"
  ].forEach(relativePath => {
    const absolutePath = path.join(ROOT, relativePath);
    const source = fs.readFileSync(absolutePath, "utf8");
    vm.runInContext(source, context, { filename: relativePath });
  });

  return context;
}

function d(year, month, day) {
  return new Date(year, month - 1, day);
}

function run() {
  const ctx = loadAppsScriptContext();
  const selectedPeriod = ctx.buildDashboardPeriodMonth_(2026, 7);

  const tripsDb = [
    {
      date: d(2026, 7, 5),
      isSubcon: false,
      grossEarnings: 10000,
      billingStatus: "PAID",
      paymentDate: d(2026, 7, 5)
    },
    {
      date: d(2026, 7, 6),
      isSubcon: true,
      grossEarnings: 8000,
      totalSubconEarnings: 3000,
      billingStatus: "PAID",
      paymentDate: d(2026, 7, 6),
      subconPayableStatus: "PAID",
      subconPaymentDate: d(2026, 7, 6)
    }
  ];

  const otherIncomeRecords = [
    { date: d(2026, 7, 7), amount: 500 }
  ];

  const expensesRecords = [
    { date: d(2026, 7, 8), amount: 200 }
  ];

  const cashFlowRecords = [
    { date: d(2026, 7, 9), cashIn: 50, cashOut: 25 }
  ];

  const subconDeductionsRecords = [
    {
      date: d(2026, 7, 10),
      subconName: "MARSHALL T. CORGOS",
      chargeAmount: 6000,
      actualCost: 3000,
      isPaid: true,
      paymentRef: "PAY-001"
    },
    {
      date: d(2026, 7, 11),
      subconName: "MARSHALL T. CORGOS",
      chargeAmount: 9999,
      actualCost: 9999,
      isPaid: false,
      paymentRef: ""
    },
    {
      date: d(2026, 8, 1),
      subconName: "MARSHALL T. CORGOS",
      chargeAmount: 7000,
      actualCost: 4000,
      isPaid: true,
      paymentRef: "PAY-002"
    }
  ];

  const result = ctx.calculateDashboard_(
    selectedPeriod,
    tripsDb,
    otherIncomeRecords,
    expensesRecords,
    cashFlowRecords,
    subconDeductionsRecords,
    1000,
    {
      years: ["ALL", 2026],
      monthsByYear: {
        ALL: [{ month: "ALL", label: "All" }],
        2026: [{ month: "ALL", label: "All" }, { month: 7, label: "Jul" }]
      }
    }
  );

  assert.strictEqual(result.kpi.totalRevenue, 24500);
  assert.strictEqual(result.kpi.totalCost, 6200);
  assert.strictEqual(result.kpi.netIncome, 18300);
  assert.strictEqual(result.kpi.netCashFlow, 18325);
  assert.strictEqual(result.kpi.currentBalance, 19325);

  assert.strictEqual(result.monthlyFinancialPerformance.totalRevenue[6], 24500);
  assert.strictEqual(result.monthlyFinancialPerformance.totalCost[6], 6200);
  assert.strictEqual(result.monthlyFinancialPerformance.netIncome[6], 18300);

  assert.strictEqual(result.monthlyFinancialPerformance.totalRevenue[7], 7000);
  assert.strictEqual(result.monthlyFinancialPerformance.totalCost[7], 4000);
  assert.strictEqual(result.monthlyFinancialPerformance.netIncome[7], 3000);

  assert.strictEqual(result.kpi.payables, 0);

  console.log("dashboard_calculations.test.js passed");
}

run();
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
node tests\dashboard_calculations.test.js
```

Expected result:

```text
AssertionError
```

The failure should show current dashboard code did not include paid Subcon Deductions in revenue, cost, net cash flow, current balance, or monthly financial performance.

- [ ] **Step 3: Commit the failing test**

```powershell
git add tests\dashboard_calculations.test.js
git commit -m "test: cover dashboard paid subcon deductions"
```

---

### Task 2: Load Subcon Deductions In Dashboard Source Data

**Files:**
- Modify: `dashboard/Server.js`
- Modify: `dashboard/Helpers.js`

- [ ] **Step 1: Update `loadDashboardSourceData_`**

In `dashboard/Server.js`, change `loadDashboardSourceData_` from:

```js
function loadDashboardSourceData_() {
  const tripsDbTable = getTableInfo_("tripsDb");
  const expensesTable = getTableInfo_("expenses");
  const otherIncomeTable = getTableInfo_("otherIncome");
  const cashFlowTable = getTableInfo_("cashFlow");

  return {
    tripsDb: getTableRecords_(tripsDbTable),
    expensesRecords: getTableRecords_(expensesTable),
    otherIncomeRecords: getTableRecords_(otherIncomeTable),
    cashFlowRecords: getTableRecords_(cashFlowTable),
    openingBalance: toNumber_(
      getNamedRangeValue_(APP_SETTINGS.dashboardOpeningBalanceRange)
    )
  };
}
```

to:

```js
function loadDashboardSourceData_() {
  const tripsDbTable = getTableInfo_("tripsDb");
  const expensesTable = getTableInfo_("expenses");
  const otherIncomeTable = getTableInfo_("otherIncome");
  const cashFlowTable = getTableInfo_("cashFlow");
  const subconDeductionsTable = getTableInfo_("subconDeductions");

  return {
    tripsDb: getTableRecords_(tripsDbTable),
    expensesRecords: getTableRecords_(expensesTable),
    otherIncomeRecords: getTableRecords_(otherIncomeTable),
    cashFlowRecords: getTableRecords_(cashFlowTable),
    subconDeductionsRecords: getTableRecords_(subconDeductionsTable),
    openingBalance: toNumber_(
      getNamedRangeValue_(APP_SETTINGS.dashboardOpeningBalanceRange)
    )
  };
}
```

- [ ] **Step 2: Thread deductions through available periods**

In `dashboard/Server.js`, change:

```js
const availablePeriods = buildAvailablePeriods_(
  sourceData.tripsDb,
  sourceData.otherIncomeRecords,
  sourceData.expensesRecords,
  sourceData.cashFlowRecords
);
```

to:

```js
const availablePeriods = buildAvailablePeriods_(
  sourceData.tripsDb,
  sourceData.otherIncomeRecords,
  sourceData.expensesRecords,
  sourceData.cashFlowRecords,
  sourceData.subconDeductionsRecords
);
```

- [ ] **Step 3: Update `buildAvailablePeriods_` signature**

In `dashboard/Helpers.js`, change:

```js
function buildAvailablePeriods_(
  tripsDb,
  otherIncomeRecords,
  expensesRecords,
  cashFlowRecords
) {
```

to:

```js
function buildAvailablePeriods_(
  tripsDb,
  otherIncomeRecords,
  expensesRecords,
  cashFlowRecords,
  subconDeductionsRecords
) {
```

Then after:

```js
addRecordPeriods_(periodMap, cashFlowRecords);
```

add:

```js
addPaidSubconDeductionPeriods_(periodMap, subconDeductionsRecords || []);
```

- [ ] **Step 4: Add the paid deduction period helper**

In `dashboard/Helpers.js`, after `addRecordPeriodsByField_`, add:

```js
function addPaidSubconDeductionPeriods_(periodMap, records) {
  records
    .filter(record => isPaidSubconDeduction_(record))
    .forEach(record => {
      const date = toDateOnly_(record.date);

      if (!date) return;

      addPeriod_(periodMap, date.getFullYear(), date.getMonth() + 1);
    });
}
```

- [ ] **Step 5: Run the test**

Run:

```powershell
node tests\dashboard_calculations.test.js
```

Expected result:

```text
ReferenceError: isPaidSubconDeduction_ is not defined
```

This is acceptable at this task boundary because the helper is declared in the next task.

- [ ] **Step 6: Commit source-data loading changes**

```powershell
git add dashboard\Server.js dashboard\Helpers.js
git commit -m "feat: load dashboard subcon deductions"
```

---

### Task 3: Add Paid Deduction Sum Helpers

**Files:**
- Modify: `dashboard/Helpers.js`

- [ ] **Step 1: Add helpers near existing dashboard predicate helpers**

In `dashboard/Helpers.js`, after `hasSubconPaymentDate_`, add:

```js
function isPaidSubconDeduction_(record) {
  return toBoolean_(record.isPaid) === true;
}


function sumPaidSubconDeductionCharges_(records, range) {
  return sumRecords_(records || [], record =>
    isPaidSubconDeduction_(record) && isInRange_(record.date, range)
      ? toNumber_(record.chargeAmount)
      : 0
  );
}


function sumPaidSubconDeductionActualCosts_(records, range) {
  return sumRecords_(records || [], record =>
    isPaidSubconDeduction_(record) && isInRange_(record.date, range)
      ? toNumber_(record.actualCost)
      : 0
  );
}


function sumPaidSubconDeductionChargesUntil_(records, cutoffDate) {
  return sumRecords_(records || [], record =>
    isPaidSubconDeduction_(record) &&
    isBeforeOrOnDate_(record.date, cutoffDate)
      ? toNumber_(record.chargeAmount)
      : 0
  );
}


function sumPaidSubconDeductionActualCostsUntil_(records, cutoffDate) {
  return sumRecords_(records || [], record =>
    isPaidSubconDeduction_(record) &&
    isBeforeOrOnDate_(record.date, cutoffDate)
      ? toNumber_(record.actualCost)
      : 0
  );
}
```

- [ ] **Step 2: Run the test**

Run:

```powershell
node tests\dashboard_calculations.test.js
```

Expected result:

```text
AssertionError
```

The helpers exist, but the dashboard still does not use them.

- [ ] **Step 3: Commit helper functions**

```powershell
git add dashboard\Helpers.js
git commit -m "feat: add paid deduction dashboard helpers"
```

---

### Task 4: Thread Deductions Through Dashboard Calculation

**Files:**
- Modify: `dashboard/Server.js`
- Modify: `dashboard/Calculate.js`

- [ ] **Step 1: Pass deductions from `getDashboardData`**

In `dashboard/Server.js`, change:

```js
return calculateDashboard_(
  selectedPeriod,
  sourceData.tripsDb,
  sourceData.otherIncomeRecords,
  sourceData.expensesRecords,
  sourceData.cashFlowRecords,
  sourceData.openingBalance,
  availablePeriods
);
```

to:

```js
return calculateDashboard_(
  selectedPeriod,
  sourceData.tripsDb,
  sourceData.otherIncomeRecords,
  sourceData.expensesRecords,
  sourceData.cashFlowRecords,
  sourceData.subconDeductionsRecords,
  sourceData.openingBalance,
  availablePeriods
);
```

- [ ] **Step 2: Update `calculateDashboard_` signature**

In `dashboard/Calculate.js`, change:

```js
function calculateDashboard_(
  selectedPeriod,
  tripsDb,
  otherIncomeRecords,
  expensesRecords,
  cashFlowRecords,
  openingBalance,
  availablePeriods
) {
```

to:

```js
function calculateDashboard_(
  selectedPeriod,
  tripsDb,
  otherIncomeRecords,
  expensesRecords,
  cashFlowRecords,
  subconDeductionsRecords,
  openingBalance,
  availablePeriods
) {
```

- [ ] **Step 3: Pass deductions into calculation helpers**

In `dashboard/Calculate.js`, change the helper calls to:

```js
const revenueKpis = buildRevenueKpis_(
  tripsDb,
  otherIncomeRecords,
  subconDeductionsRecords,
  range
);

const costKpis = buildCostKpis_(
  tripsDb,
  expensesRecords,
  subconDeductionsRecords,
  range
);
```

Change:

```js
const cashFlowKpi = buildCashFlowKpi_(
  tripsDb,
  otherIncomeRecords,
  expensesRecords,
  cashFlowRecords,
  range
);
```

to:

```js
const cashFlowKpi = buildCashFlowKpi_(
  tripsDb,
  otherIncomeRecords,
  expensesRecords,
  cashFlowRecords,
  subconDeductionsRecords,
  range
);
```

Change:

```js
const currentBalance = buildCurrentBalanceKpi_(
  tripsDb,
  otherIncomeRecords,
  expensesRecords,
  cashFlowRecords,
  openingBalance,
  range
);
```

to:

```js
const currentBalance = buildCurrentBalanceKpi_(
  tripsDb,
  otherIncomeRecords,
  expensesRecords,
  cashFlowRecords,
  subconDeductionsRecords,
  openingBalance,
  range
);
```

Change:

```js
monthlyFinancialPerformance: buildMonthlyFinancialPerformanceChart_(
  tripsDb,
  otherIncomeRecords,
  expensesRecords,
  selectedPeriod
),
```

to:

```js
monthlyFinancialPerformance: buildMonthlyFinancialPerformanceChart_(
  tripsDb,
  otherIncomeRecords,
  expensesRecords,
  subconDeductionsRecords,
  selectedPeriod
),
```

- [ ] **Step 4: Run the test**

Run:

```powershell
node tests\dashboard_calculations.test.js
```

Expected result:

```text
AssertionError
```

The deductions are threaded through, but the helper signatures and formulas still need updating.

- [ ] **Step 5: Commit calculation threading**

```powershell
git add dashboard\Server.js dashboard\Calculate.js
git commit -m "feat: thread deductions through dashboard calculations"
```

---

### Task 5: Update Revenue, Cost, Cash Flow, And Current Balance Formulas

**Files:**
- Modify: `dashboard/Helpers.js`

- [ ] **Step 1: Update `buildRevenueKpis_`**

Replace the function signature and return with:

```js
function buildRevenueKpis_(
  tripsDb,
  otherIncomeRecords,
  subconDeductionsRecords,
  range
) {
  const tripRevenue = sumRecords_(tripsDb, record =>
    isInRange_(record.date, range)
      ? toNumber_(record.grossEarnings)
      : 0
  );

  const otherIncome = sumRecords_(otherIncomeRecords, record =>
    isInRange_(record.date, range)
      ? toNumber_(record.amount)
      : 0
  );

  const subconDeductionRevenue = sumPaidSubconDeductionCharges_(
    subconDeductionsRecords,
    range
  );

  return {
    tripRevenue: tripRevenue,
    otherIncome: otherIncome,
    subconDeductionRevenue: subconDeductionRevenue,
    totalRevenue: tripRevenue + otherIncome + subconDeductionRevenue
  };
}
```

- [ ] **Step 2: Update `buildCostKpis_`**

Replace the function signature and return with:

```js
function buildCostKpis_(
  tripsDb,
  expensesRecords,
  subconDeductionsRecords,
  range
) {
  const subconCost = sumRecords_(tripsDb, record =>
    isInRange_(record.date, range) && isSubcon_(record)
      ? toNumber_(record.totalSubconEarnings)
      : 0
  );

  const expenses = sumRecords_(expensesRecords, record =>
    isInRange_(record.date, range)
      ? toNumber_(record.amount)
      : 0
  );

  const subconDeductionCost = sumPaidSubconDeductionActualCosts_(
    subconDeductionsRecords,
    range
  );

  return {
    subconCost: subconCost,
    expenses: expenses,
    subconDeductionCost: subconDeductionCost,
    totalCost: subconCost + expenses + subconDeductionCost
  };
}
```

- [ ] **Step 3: Update `buildCashFlowKpi_`**

Change the signature to:

```js
function buildCashFlowKpi_(
  tripsDb,
  otherIncomeRecords,
  expensesRecords,
  cashFlowRecords,
  subconDeductionsRecords,
  range
) {
```

After `manualCashIn`, add:

```js
const subconDeductionCashIn = sumPaidSubconDeductionCharges_(
  subconDeductionsRecords,
  range
);
```

After `manualCashOut`, add:

```js
const subconDeductionCashOut = sumPaidSubconDeductionActualCosts_(
  subconDeductionsRecords,
  range
);
```

Change:

```js
const cashIn = customerCollections + otherIncome + manualCashIn;
const cashOut = subconPayments + expenses + manualCashOut;
```

to:

```js
const cashIn =
  customerCollections +
  otherIncome +
  manualCashIn +
  subconDeductionCashIn;

const cashOut =
  subconPayments +
  expenses +
  manualCashOut +
  subconDeductionCashOut;
```

- [ ] **Step 4: Update `buildCurrentBalanceKpi_`**

Change the signature to:

```js
function buildCurrentBalanceKpi_(
  tripsDb,
  otherIncomeRecords,
  expensesRecords,
  cashFlowRecords,
  subconDeductionsRecords,
  openingBalance,
  range
) {
```

In `historicalCashIn`, after the cashflow records sum, add:

```js
+
sumPaidSubconDeductionChargesUntil_(
  subconDeductionsRecords,
  cutoffDate
)
```

The complete `historicalCashIn` should be:

```js
const historicalCashIn =
  sumCustomerCollectionsUntil_(tripsDb, cutoffDate) +
  sumRecords_(otherIncomeRecords, record =>
    isBeforeOrOnDate_(record.date, cutoffDate) ? toNumber_(record.amount) : 0
  ) +
  sumRecords_(cashFlowRecords, record =>
    isBeforeOrOnDate_(record.date, cutoffDate) ? toNumber_(record.cashIn) : 0
  ) +
  sumPaidSubconDeductionChargesUntil_(
    subconDeductionsRecords,
    cutoffDate
  );
```

In `historicalCashOut`, after the cashflow records sum, add:

```js
+
sumPaidSubconDeductionActualCostsUntil_(
  subconDeductionsRecords,
  cutoffDate
)
```

The complete `historicalCashOut` should be:

```js
const historicalCashOut =
  sumSubconPaymentsUntil_(tripsDb, cutoffDate) +
  sumRecords_(expensesRecords, record =>
    isBeforeOrOnDate_(record.date, cutoffDate) ? toNumber_(record.amount) : 0
  ) +
  sumRecords_(cashFlowRecords, record =>
    isBeforeOrOnDate_(record.date, cutoffDate) ? toNumber_(record.cashOut) : 0
  ) +
  sumPaidSubconDeductionActualCostsUntil_(
    subconDeductionsRecords,
    cutoffDate
  );
```

- [ ] **Step 5: Run the test**

Run:

```powershell
node tests\dashboard_calculations.test.js
```

Expected result:

```text
AssertionError
```

The KPI/cash formulas should now pass, but monthly chart assertions should still fail until the next task.

- [ ] **Step 6: Commit KPI and cashflow formula changes**

```powershell
git add dashboard\Helpers.js
git commit -m "feat: include paid deductions in dashboard kpis"
```

---

### Task 6: Update Monthly Financial Performance Chart Formulas

**Files:**
- Modify: `dashboard/Helpers.js`

- [ ] **Step 1: Update `buildMonthlyFinancialPerformanceChart_` signature**

Change:

```js
function buildMonthlyFinancialPerformanceChart_(
  tripsDb,
  otherIncomeRecords,
  expensesRecords,
  selectedPeriod
) {
```

to:

```js
function buildMonthlyFinancialPerformanceChart_(
  tripsDb,
  otherIncomeRecords,
  expensesRecords,
  subconDeductionsRecords,
  selectedPeriod
) {
```

- [ ] **Step 2: Add local monthly deduction arrays**

After the `chart` object, add:

```js
const subconDeductionRevenue = emptyMonthlyArray_();
const subconDeductionCost = emptyMonthlyArray_();
```

- [ ] **Step 3: Add paid deduction monthly accumulation**

After the `expensesRecords` loop, add:

```js
(subconDeductionsRecords || [])
  .filter(record =>
    isPaidSubconDeduction_(record) &&
    isInRange_(record.date, range)
  )
  .forEach(record => {
    const monthIndex = getMonthIndex_(record.date);

    if (monthIndex >= 0) {
      subconDeductionRevenue[monthIndex] += toNumber_(record.chargeAmount);
      subconDeductionCost[monthIndex] += toNumber_(record.actualCost);
    }
  });
```

- [ ] **Step 4: Update monthly totals**

Change:

```js
chart.totalRevenue[monthIndex] =
  chart.tripRevenue[monthIndex] + chart.otherIncome[monthIndex];

chart.totalCost[monthIndex] =
  chart.subconCost[monthIndex] + chart.expenses[monthIndex];
```

to:

```js
chart.totalRevenue[monthIndex] =
  chart.tripRevenue[monthIndex] +
  chart.otherIncome[monthIndex] +
  subconDeductionRevenue[monthIndex];

chart.totalCost[monthIndex] =
  chart.subconCost[monthIndex] +
  chart.expenses[monthIndex] +
  subconDeductionCost[monthIndex];
```

- [ ] **Step 5: Run the test**

Run:

```powershell
node tests\dashboard_calculations.test.js
```

Expected result:

```text
dashboard_calculations.test.js passed
```

- [ ] **Step 6: Commit monthly chart changes**

```powershell
git add dashboard\Helpers.js
git commit -m "feat: include paid deductions in monthly dashboard chart"
```

---

### Task 7: Verify No UI Files Changed And Run Final Checks

**Files:**
- Verify: `dashboard/Dialog.html`
- Verify: `dashboard/Scripts.html`
- Verify: `dashboard/Styles.html`

- [ ] **Step 1: Run the local calculation test**

Run:

```powershell
node tests\dashboard_calculations.test.js
```

Expected result:

```text
dashboard_calculations.test.js passed
```

- [ ] **Step 2: Check changed files**

Run:

```powershell
git status --short
```

Expected dashboard implementation files:

```text
M dashboard/Server.js
M dashboard/Calculate.js
M dashboard/Helpers.js
```

Expected test file:

```text
A tests/dashboard_calculations.test.js
```

No `dashboard/Dialog.html`, `dashboard/Scripts.html`, or `dashboard/Styles.html` changes should appear.

- [ ] **Step 3: Search for accidental UI changes in diff**

Run:

```powershell
git diff -- dashboard/Dialog.html dashboard/Scripts.html dashboard/Styles.html
```

Expected result: no output.

- [ ] **Step 4: Inspect calculation diff**

Run:

```powershell
git diff -- dashboard/Server.js dashboard/Calculate.js dashboard/Helpers.js tests/dashboard_calculations.test.js
```

Expected result:

- `dashboard/Server.js` loads `subconDeductionsRecords`.
- `dashboard/Calculate.js` passes `subconDeductionsRecords`.
- `dashboard/Helpers.js` includes only paid deductions in revenue, cost, net cashflow, current balance, and monthly financial performance.
- `tests/dashboard_calculations.test.js` covers paid, unpaid, and out-of-month deduction behavior.

- [ ] **Step 5: Commit final verification if needed**

If Task 7 produced any cleanup edits, commit them:

```powershell
git add dashboard\Server.js dashboard\Calculate.js dashboard\Helpers.js tests\dashboard_calculations.test.js
git commit -m "test: verify dashboard deduction calculations"
```

If no cleanup edits were needed, do not create an empty commit.

---

## Self-Review

- Spec coverage:
  - Paid-only deductions: covered by `isPaidSubconDeduction_` and test unpaid deduction record.
  - Date-filtered dashboard records: covered by July and August deduction records.
  - Revenue adds charge amount: covered by `totalRevenue` assertions.
  - Cost adds actual cost: covered by `totalCost` assertions.
  - Net income remains revenue minus cost: covered by `netIncome` assertions.
  - Cashflow/current balance include paid deductions: covered by `netCashFlow` and `currentBalance` assertions.
  - Monthly financial chart aligns with KPI formulas: covered by July and August monthly chart assertions.
  - UI unchanged: covered by Task 7 diff checks.
- Placeholder scan: no `TBD`, `TODO`, or vague implementation steps remain.
- Type consistency:
  - The plan consistently uses `subconDeductionsRecords`.
  - The plan consistently uses config field names `chargeAmount`, `actualCost`, `isPaid`, and `paymentRef`.
  - The plan does not use the sheet `margin` field for dashboard calculation.
