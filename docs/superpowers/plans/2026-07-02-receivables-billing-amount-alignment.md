# Receivables Billing Amount Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make dashboard and email receivables use billing amount (`Alaska Rate + Fuel Subsidy`) instead of `Gross Earnings`.

**Architecture:** Keep the existing Apps Script module shape. Add one shared helper in `dashboard/Helpers.js`, then use it from dashboard receivables and email receivables because the local Node email test loads both files into the same VM context. Leave SubconDeductions cashflow and dashboard financial logic unchanged except for verification.

**Tech Stack:** Google Apps Script JavaScript files, Node-only regression tests using `assert` and `vm`.

---

## File Structure

- Modify: `dashboard/Helpers.js`
  - Add `getBillingAmount_(record)`.
  - Update `buildReceivablesKpi_(tripsDb)` to use `getBillingAmount_`.
- Modify: `notifications/Helper.js`
  - Update `buildEmailReceivablesTotals_(tripsDb)` to use `getBillingAmount_`.
- Verify: `tests/dashboard_calculations.test.js`
  - Existing assertions already expect billing amount totals: `8000`, `5500`, `3500`, `13500`.
- Verify: `tests/email_summary_alignment.test.js`
  - Existing assertions already expect dashboard and email receivables to match billing amount totals.
- Verify: `.claspignore`
  - Already excludes `tests/**`; do not push local Node tests to Apps Script.

## Current Finding

`dashboard/Helpers.js` currently calculates dashboard receivables with:

```javascript
const amount = toNumber_(record.grossEarnings);
```

`notifications/Helper.js` currently calculates email receivables with:

```javascript
const amount = toNumber_(record.grossEarnings);
```

Both must use:

```javascript
function getBillingAmount_(record) {
  return toNumber_(record.alaskaRate) + toNumber_(record.fuelSubsidy);
}
```

## Task 1: Prove The Dashboard Receivables Bug

**Files:**
- Verify: `tests/dashboard_calculations.test.js`
- Read-only source during this task: `dashboard/Helpers.js`

- [ ] **Step 1: Run the dashboard calculation test before editing**

Run:

```powershell
node tests\dashboard_calculations.test.js
```

Expected current failure:

```text
AssertionError
10000 !== 8000
```

The failure should come from:

```javascript
assert.strictEqual(receivablesKpi.unbilled, 8000);
```

Reason: `buildReceivablesKpi_()` is still using `grossEarnings` instead of `alaskaRate + fuelSubsidy`.

## Task 2: Add The Shared Billing Amount Helper

**Files:**
- Modify: `dashboard/Helpers.js`

- [ ] **Step 1: Add `getBillingAmount_(record)` near the other small amount/status helpers**

Add this function after `hasSubconPaymentDate_(record)` and before `isPaidSubconDeduction_(record)`:

```javascript
function getBillingAmount_(record) {
  return toNumber_(record.alaskaRate) + toNumber_(record.fuelSubsidy);
}
```

- [ ] **Step 2: Run the dashboard calculation test**

Run:

```powershell
node tests\dashboard_calculations.test.js
```

Expected current failure remains:

```text
AssertionError
10000 !== 8000
```

Reason: the helper exists, but `buildReceivablesKpi_()` has not been switched to it yet.

## Task 3: Update Dashboard Receivables

**Files:**
- Modify: `dashboard/Helpers.js`
- Verify: `tests/dashboard_calculations.test.js`

- [ ] **Step 1: Replace dashboard receivables amount source**

In `buildReceivablesKpi_(tripsDb)`, replace:

```javascript
const amount = toNumber_(record.grossEarnings);
```

with:

```javascript
const amount = getBillingAmount_(record);
```

- [ ] **Step 2: Run the dashboard calculation test**

Run:

```powershell
node tests\dashboard_calculations.test.js
```

Expected:

```text
dashboard_calculations.test.js passed
```

This verifies:

```javascript
receivablesKpi.unbilled === 8000
receivablesKpi.billed === 5500
receivablesKpi.paid === 3500
receivablesKpi.receivables === 13500
```

It also re-verifies the existing SubconDeductions financial behavior:

```javascript
result.kpi.totalRevenue === 24500
result.kpi.totalCost === 6200
result.kpi.netIncome === 18300
result.kpi.netCashFlow === 18325
result.kpi.currentBalance === 19325
```

## Task 4: Prove The Email Receivables Bug

**Files:**
- Verify: `tests/email_summary_alignment.test.js`
- Read-only source during this task: `notifications/Helper.js`

- [ ] **Step 1: Run the email alignment test before editing email helper**

Run:

```powershell
node tests\email_summary_alignment.test.js
```

Expected current failure after Task 3:

```text
AssertionError
10000 !== 8000
```

The failure should come from:

```javascript
assert.strictEqual(emailReceivables.unbilledAmount, 8000);
```

Reason: dashboard receivables now use billing amount, but `buildEmailReceivablesTotals_()` still uses `grossEarnings`.

## Task 5: Update Email Receivables

**Files:**
- Modify: `notifications/Helper.js`
- Verify: `tests/email_summary_alignment.test.js`

- [ ] **Step 1: Replace email receivables amount source**

In `buildEmailReceivablesTotals_(tripsDb)`, replace:

```javascript
const amount = toNumber_(record.grossEarnings);
```

with:

```javascript
const amount = getBillingAmount_(record);
```

- [ ] **Step 2: Run the email alignment test**

Run:

```powershell
node tests\email_summary_alignment.test.js
```

Expected:

```text
email_summary_alignment.test.js passed
```

This verifies email receivables match dashboard receivables:

```javascript
emailReceivables.unbilledAmount === dashboardReceivables.unbilled
emailReceivables.billedButUnpaidAmount === dashboardReceivables.billed
emailReceivables.totalReceivables === dashboardReceivables.receivables
```

## Task 6: Final Verification

**Files:**
- Verify: `tests/dashboard_calculations.test.js`
- Verify: `tests/email_summary_alignment.test.js`
- Verify: `.claspignore`

- [ ] **Step 1: Run all local Node tests**

Run:

```powershell
node tests\dashboard_calculations.test.js
node tests\email_summary_alignment.test.js
```

Expected:

```text
dashboard_calculations.test.js passed
email_summary_alignment.test.js passed
```

- [ ] **Step 2: Confirm tests stay local-only**

Run:

```powershell
Get-Content -LiteralPath ".claspignore"
```

Expected output includes:

```text
tests/**
```

- [ ] **Step 3: Inspect the source diff**

Run:

```powershell
git diff -- dashboard/Helpers.js notifications/Helper.js tests/dashboard_calculations.test.js tests/email_summary_alignment.test.js .claspignore
```

Expected source diff only:

```diff
+function getBillingAmount_(record) {
+  return toNumber_(record.alaskaRate) + toNumber_(record.fuelSubsidy);
+}
...
-    const amount = toNumber_(record.grossEarnings);
+    const amount = getBillingAmount_(record);
...
-    const amount = toNumber_(record.grossEarnings);
+    const amount = getBillingAmount_(record);
```

Expected no test changes and no `.claspignore` changes.

## Out Of Scope For This Plan

- Do not change SubconDeductions financial formulas unless a verification test fails.
- Do not subtract deduction charge amounts from gross subcon payments.
- Do not change the dashboard payables KPI; it remains gross unpaid `TripsDB[Total Subcon Earnings]`.
- Do not expose `Actual Cost` or `Margin` in client-facing statements.
- Do not push `tests/**` to Apps Script.

## Self-Review

- Spec coverage: dashboard receivables, email receivables, shared billing helper, local-only tests, and SubconDeductions non-regression verification are covered.
- Placeholder scan: no placeholder tasks remain.
- Type consistency: the plan consistently uses `getBillingAmount_(record)`, `alaskaRate`, and `fuelSubsidy`, matching the loaded Apps Script record keys.
