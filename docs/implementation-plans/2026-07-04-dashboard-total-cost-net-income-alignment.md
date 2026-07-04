# Dashboard Total Cost And Net Income Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align dashboard Total Revenue, Total Cost, and Net Income with the source-of-truth financial docs.

**Architecture:** Keep the current dashboard server and helper structure. Update only server-side calculation helpers and focused Node tests; do not change dashboard UI files. Revenue should use gross paid deduction charge amount, cost should use paid subcon trip costs plus paid deduction actual costs, and net income remains `totalRevenue - totalCost`.

**Tech Stack:** Google Apps Script JavaScript, local Node VM tests.

---

## Source Of Truth

Read these docs before editing:

- `docs/source-of-truth/calculations/financials/total-revenue.md`
- `docs/source-of-truth/calculations/financials/total-cost.md`
- `docs/source-of-truth/calculations/financials/net-income.md`

Required behavior:

```text
Total Revenue =
  Paid Trip Billing Amount
  + Other Income
  + Paid Subcon Deduction Charge Amount

Total Cost =
  Paid Subcon Trip Cost
  + Expenses
  + Paid Subcon Deduction Actual Cost

Net Income =
  Total Revenue - Total Cost
```

## File Map

- Modify `dashboard/Helpers.js`: calculation behavior only.
- Modify `tests/dashboard_calculations.test.js`: prove the new source-of-truth behavior.
- Do not modify `dashboard/Dialog.html`, `dashboard/Scripts.html`, or `dashboard/Styles.html`.

---

### Task 1: Update Dashboard Calculation Test Expectations

**Files:**
- Modify: `tests/dashboard_calculations.test.js`

- [ ] **Step 1: Update the July dashboard KPI assertions**

Replace:

```js
  assert.strictEqual(result.kpi.totalRevenue, 19100);
  assert.strictEqual(result.kpi.totalCost, 3200);
  assert.strictEqual(result.kpi.netIncome, 15900);
```

With:

```js
  assert.strictEqual(result.kpi.totalRevenue, 22100);
  assert.strictEqual(result.kpi.totalCost, 6200);
  assert.strictEqual(result.kpi.netIncome, 15900);
```

Reason:

```text
Trip revenue = 8000 + 5500 + 2100 = 15600
Other income = 500
Paid deduction charge amount = 6000
Total revenue = 22100

Paid subcon trip cost = 3000
Expenses = 200
Paid deduction actual cost = 3000
Total cost = 6200

Net income = 22100 - 6200 = 15900
```

- [ ] **Step 2: Update the July monthly financial performance assertions**

Replace:

```js
  assert.strictEqual(result.monthlyFinancialPerformance.totalRevenue[6], 19100);
  assert.strictEqual(result.monthlyFinancialPerformance.totalCost[6], 3200);
  assert.strictEqual(result.monthlyFinancialPerformance.netIncome[6], 15900);
```

With:

```js
  assert.strictEqual(result.monthlyFinancialPerformance.totalRevenue[6], 22100);
  assert.strictEqual(result.monthlyFinancialPerformance.totalCost[6], 6200);
  assert.strictEqual(result.monthlyFinancialPerformance.netIncome[6], 15900);
```

- [ ] **Step 3: Update the August monthly financial performance assertions**

Replace:

```js
  assert.strictEqual(result.monthlyFinancialPerformance.totalRevenue[7], 7400);
  assert.strictEqual(result.monthlyFinancialPerformance.totalCost[7], 0);
  assert.strictEqual(result.monthlyFinancialPerformance.netIncome[7], 7400);
```

With:

```js
  assert.strictEqual(result.monthlyFinancialPerformance.totalRevenue[7], 11400);
  assert.strictEqual(result.monthlyFinancialPerformance.totalCost[7], 4000);
  assert.strictEqual(result.monthlyFinancialPerformance.netIncome[7], 7400);
```

Reason:

```text
August paid trip revenue = 4400
August paid deduction charge amount = 7000
August total revenue = 11400
August paid deduction actual cost = 4000
August net income = 11400 - 4000 = 7400
```

- [ ] **Step 4: Add a paid subcon trip period-date regression record**

Add this object after the existing paid subcon trip in `tripsDb`:

```js
    {
      date: d(2026, 6, 29),
      isSubcon: true,
      grossEarnings: 0,
      alaskaRate: 0,
      fuelSubsidy: 0,
      totalSubconEarnings: 1200,
      billingStatus: "UNBILLED",
      paymentDate: "",
      subconPayableStatus: "PAID",
      subconPaymentDate: d(2026, 7, 12)
    },
```

This proves paid subcon trip cost is placed by `Subcon Payment Date`, not trip `Date`.

- [ ] **Step 5: Add an unpaid subcon payable exclusion record**

Add this object after the record from Step 4:

```js
    {
      date: d(2026, 7, 13),
      isSubcon: true,
      grossEarnings: 0,
      alaskaRate: 0,
      fuelSubsidy: 0,
      totalSubconEarnings: 900,
      billingStatus: "UNBILLED",
      paymentDate: "",
      subconPayableStatus: "UNPAID",
      subconPaymentDate: ""
    },
```

This proves unpaid subcon payables stay out of Total Cost.

- [ ] **Step 6: Update the July cost assertions again for the new paid subcon cost**

After adding the Step 4 paid subcon record, the final July assertions must be:

```js
  assert.strictEqual(result.kpi.totalRevenue, 22100);
  assert.strictEqual(result.kpi.totalCost, 7400);
  assert.strictEqual(result.kpi.netIncome, 14700);
```

And:

```js
  assert.strictEqual(result.monthlyFinancialPerformance.totalRevenue[6], 22100);
  assert.strictEqual(result.monthlyFinancialPerformance.totalCost[6], 7400);
  assert.strictEqual(result.monthlyFinancialPerformance.netIncome[6], 14700);
```

Reason:

```text
Total cost = 3000 + 1200 + 200 + 3000 = 7400
Net income = 22100 - 7400 = 14700
```

- [ ] **Step 7: Update the payables assertion**

Replace:

```js
  assert.strictEqual(result.kpi.payables, 0);
```

With:

```js
  assert.strictEqual(result.kpi.payables, 900);
```

Reason: the unpaid subcon payable exclusion record remains a payable.

- [ ] **Step 8: Run the test and verify it fails**

Run:

```powershell
node tests\dashboard_calculations.test.js
```

Expected: FAIL before implementation. The first failure should show the dashboard still calculates revenue, cost, or net income using the old behavior.

---

### Task 2: Update Paid Subcon Deduction Revenue

**Files:**
- Modify: `dashboard/Helpers.js`
- Test: `tests/dashboard_calculations.test.js`

- [ ] **Step 1: Update `buildRevenueKpis_` to use charge amount**

In `dashboard/Helpers.js`, replace:

```js
  const subconDeductionRevenue = sumPaidSubconDeductionMargins_(
    subconDeductionsRecords,
    range
  );
```

With:

```js
  const subconDeductionRevenue = sumPaidSubconDeductionCharges_(
    subconDeductionsRecords,
    range
  );
```

- [ ] **Step 2: Update monthly revenue to use charge amount**

In `buildMonthlyFinancialPerformanceChart_`, replace:

```js
        subconDeductionRevenue[monthIndex] += getPaidSubconDeductionMargin_(
          record
        );
```

With:

```js
        subconDeductionRevenue[monthIndex] += toNumber_(
          record.chargeAmount
        );
```

- [ ] **Step 3: Run the test**

Run:

```powershell
node tests\dashboard_calculations.test.js
```

Expected: still FAIL, because cost has not been aligned yet.

---

### Task 3: Update Total Cost KPI

**Files:**
- Modify: `dashboard/Helpers.js`
- Test: `tests/dashboard_calculations.test.js`

- [ ] **Step 1: Update `buildCostKpis_` subcon cost**

In `dashboard/Helpers.js`, replace:

```js
  const subconCost = sumRecords_(tripsDb, record =>
    isInRange_(record.date, range) && isSubcon_(record)
      ? toNumber_(record.totalSubconEarnings)
      : 0
  );
```

With:

```js
  const subconCost = sumSubconPayments_(
    tripsDb,
    range
  );
```

- [ ] **Step 2: Add paid deduction actual cost to `buildCostKpis_`**

After the `expenses` constant, add:

```js
  const subconDeductionCost = sumPaidSubconDeductionActualCosts_(
    subconDeductionsRecords,
    range
  );
```

Then replace:

```js
  return {
    subconCost: subconCost,
    expenses: expenses,
    totalCost: subconCost + expenses
  };
```

With:

```js
  return {
    subconCost: subconCost,
    expenses: expenses,
    subconDeductionCost: subconDeductionCost,
    totalCost: subconCost + expenses + subconDeductionCost
  };
```

- [ ] **Step 3: Run the test**

Run:

```powershell
node tests\dashboard_calculations.test.js
```

Expected: KPI assertions should pass; monthly financial performance should still fail until Task 4.

---

### Task 4: Update Monthly Financial Performance Cost

**Files:**
- Modify: `dashboard/Helpers.js`
- Test: `tests/dashboard_calculations.test.js`

- [ ] **Step 1: Add monthly deduction cost storage**

In `buildMonthlyFinancialPerformanceChart_`, after:

```js
  const subconDeductionRevenue = emptyMonthlyArray_();
```

Add:

```js
  const subconDeductionCost = emptyMonthlyArray_();
```

- [ ] **Step 2: Change monthly subcon cost to use paid subcon payment date**

Replace the current first `tripsDb` loop:

```js
  tripsDb
    .filter(record => isInRange_(record.date, range))
    .forEach(record => {
      const monthIndex = getMonthIndex_(record.date);

      if (monthIndex < 0) return;

      if (isSubcon_(record)) {
        chart.subconCost[monthIndex] += toNumber_(
          record.totalSubconEarnings
        );
      }
    });
```

With:

```js
  tripsDb
    .filter(record =>
      hasSubconPaymentDate_(record) &&
      isInRange_(record.subconPaymentDate, range) &&
      isSubcon_(record) &&
      normalizeStatus_(record.subconPayableStatus) === "PAID"
    )
    .forEach(record => {
      const monthIndex = getMonthIndex_(record.subconPaymentDate);

      if (monthIndex >= 0) {
        chart.subconCost[monthIndex] += toNumber_(
          record.totalSubconEarnings
        );
      }
    });
```

- [ ] **Step 3: Add monthly deduction actual cost**

In the existing paid subcon deductions loop, after:

```js
        subconDeductionRevenue[monthIndex] += toNumber_(
          record.chargeAmount
        );
```

Add:

```js
        subconDeductionCost[monthIndex] += toNumber_(
          record.actualCost
        );
```

- [ ] **Step 4: Include deduction actual cost in monthly total cost**

Replace:

```js
    chart.totalCost[monthIndex] =
      chart.subconCost[monthIndex] +
      chart.expenses[monthIndex];
```

With:

```js
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

Expected:

```text
dashboard_calculations.test.js passed
```

---

### Task 5: Final Verification And Scope Check

**Files:**
- Verify: `dashboard/Helpers.js`
- Verify: `tests/dashboard_calculations.test.js`
- Verify: `dashboard/Dialog.html`
- Verify: `dashboard/Scripts.html`
- Verify: `dashboard/Styles.html`

- [ ] **Step 1: Run dashboard calculation test**

Run:

```powershell
node tests\dashboard_calculations.test.js
```

Expected:

```text
dashboard_calculations.test.js passed
```

- [ ] **Step 2: Run email/dashboard alignment test**

Run:

```powershell
node tests\email_summary_alignment.test.js
```

Expected:

```text
email_summary_alignment.test.js passed
```

- [ ] **Step 3: Confirm no UI files changed**

Run:

```powershell
git diff -- dashboard\Dialog.html dashboard\Scripts.html dashboard\Styles.html
```

Expected: no diff output.

- [ ] **Step 4: Confirm implementation diff scope**

Run:

```powershell
git status --short
```

Expected implementation files:

```text
M dashboard/Helpers.js
M tests/dashboard_calculations.test.js
```

Source-of-truth docs may already be modified or untracked from the planning session:

```text
M docs/source-of-truth/calculations/financials/total-revenue.md
?? docs/source-of-truth/calculations/financials/total-cost.md
?? docs/source-of-truth/calculations/financials/net-income.md
```


---

## Self-Review

- Spec coverage: Total Revenue, Total Cost, and Net Income source-of-truth rules are covered.
- Test coverage: paid deduction charge revenue, paid deduction actual cost, paid subcon payable cost, unpaid subcon payable exclusion, payment-date period placement, and net income derivation are covered.
- Scope: dashboard UI files are intentionally unchanged.