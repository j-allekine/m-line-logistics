# Dashboard Calculation Guide Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lightweight in-dashboard calculation guide modal that explains dashboard financial formulas in plain language.

**Architecture:** Keep this entirely client-side inside the existing Apps Script dashboard dialog. Add a header icon button, static modal markup, plain CSS styles, and small event handlers. Do not add server calls, external dependencies, new files, or changes to calculation logic.

**Tech Stack:** Google Apps Script HTMLService, plain JavaScript, plain CSS, existing dashboard HTML.

---

## Source Content

Use concise plain-language summaries from these docs. Do not load markdown dynamically at runtime.

- `docs/source-of-truth/calculations/financials/total-revenue.md`
- `docs/source-of-truth/calculations/financials/total-cost.md`
- `docs/source-of-truth/calculations/financials/net-income.md`
- `docs/source-of-truth/calculations/financials/current-balance.md`
- `docs/source-of-truth/calculations/financials/receivables.md`
- `docs/source-of-truth/calculations/financials/payables.md`

## File Map

- Modify `dashboard/Dialog.html`: add header button and hidden centered modal markup.
- Modify `dashboard/Scripts.html`: add open/close behavior.
- Modify `dashboard/Styles.html`: add plain CSS modal styles.
- Do not modify `dashboard/Helpers.js`, `dashboard/Calculate.js`, or `dashboard/Server.js`.
- Do not create new runtime files.

---

### Task 1: Add Header Button And Modal Markup

**Files:**
- Modify: `dashboard/Dialog.html`

- [ ] **Step 1: Add calculation guide button**

Place this button between `clearFiltersBtn` and `refreshBtn` in the dashboard header controls:

```html
<button id="calculationGuideBtn" type="button" class="calc-guide-trigger" title="View calculation guide" aria-label="View calculation guide" aria-haspopup="dialog" aria-controls="calculationGuideModal">
  <svg class="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <path d="M7 12h10"></path>
    <path d="M7 15h6"></path>
  </svg>
  <span class="sr-only">View calculation guide</span>
</button>
```

- [ ] **Step 2: Add hidden modal markup**

Add the modal immediately after the closing `</header>` and before the KPI rows. Use this exact content unless source-of-truth docs changed:

```html
<div id="calculationGuideModal" class="calc-guide-modal hidden" role="dialog" aria-modal="true" aria-labelledby="calculationGuideTitle">
  <div class="calc-guide-backdrop" data-calc-guide-close="true"></div>
  <section class="calc-guide-panel" tabindex="-1">
    <div class="calc-guide-header">
      <div>
        <p class="calc-guide-eyebrow">Dashboard reference</p>
        <h2 id="calculationGuideTitle" class="calc-guide-title">Calculation Guide</h2>
      </div>
      <button id="calculationGuideCloseBtn" type="button" class="calc-guide-close" aria-label="Close calculation guide">
        <svg class="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>
      </button>
    </div>

    <div class="calc-guide-body">
      <article class="calc-guide-section">
        <h3>Total Revenue</h3>
        <p>Money earned for the selected period.</p>
        <pre>Total Revenue =
  Paid Trip Billing Amount
  + Other Income
  + Paid Subcon Deduction Charge Amount</pre>
        <p>Paid trip billing uses Alaska Rate plus Fuel Subsidy when Billing Status is PAID. Unbilled and billed receivables are not included.</p>
      </article>

      <article class="calc-guide-section">
        <h3>Total Cost</h3>
        <p>Costs paid or recorded for the selected period.</p>
        <pre>Total Cost =
  Paid Subcon Trip Cost
  + Expenses
  + Paid Subcon Deduction Actual Cost</pre>
        <p>Unpaid subcon payables are not included in Total Cost.</p>
      </article>

      <article class="calc-guide-section">
        <h3>Net Income</h3>
        <p>Profit for the selected period.</p>
        <pre>Net Income =
  Total Revenue
  - Total Cost</pre>
      </article>

      <article class="calc-guide-section">
        <h3>Current Balance</h3>
        <p>Running cash balance through the selected period end date.</p>
        <pre>Current Balance =
  Opening Balance
  + Historical Cash In
  - Historical Cash Out</pre>
        <p>Receivables and unpaid payables are not included in Current Balance.</p>
      </article>

      <article class="calc-guide-section">
        <h3>Receivables</h3>
        <p>Current unpaid customer amounts.</p>
        <pre>Receivables =
  Unbilled Amount
  + Billed But Unpaid Amount</pre>
        <p>Amounts use Alaska Rate plus Fuel Subsidy.</p>
      </article>

      <article class="calc-guide-section">
        <h3>Payables</h3>
        <p>Current unpaid subcon amounts.</p>
        <pre>Payables =
  Unpaid Subcon Amount</pre>
        <p>Includes subcon rows where Subcon Payable Status is UNPAID.</p>
      </article>
    </div>
  </section>
</div>
```

- [ ] **Step 3: Verify markup diff**

Run:

```powershell
git diff -- dashboard\Dialog.html
```

Expected: only one header button and one hidden modal block are added.

---

### Task 2: Add Plain CSS Styles

**Files:**
- Modify: `dashboard/Styles.html`

- [ ] **Step 1: Add modal styles before the existing mobile media query**

Add plain CSS only. Use these selectors:

```css
.calc-guide-trigger { }
.calc-guide-trigger:hover,
.calc-guide-trigger:focus { }
.calc-guide-modal { }
.calc-guide-modal.hidden { }
.calc-guide-backdrop { }
.calc-guide-panel { }
.calc-guide-header { }
.calc-guide-eyebrow { }
.calc-guide-title { }
.calc-guide-close { }
.calc-guide-close:hover,
.calc-guide-close:focus { }
.calc-guide-body { }
.calc-guide-section { }
.calc-guide-section h3 { }
.calc-guide-section p { }
.calc-guide-section pre { }
```

Implementation requirements:

- Center the modal with `position: fixed`, `inset: 0`, `display: flex`, `align-items: center`, and `justify-content: center`.
- Use a dark translucent backdrop.
- Use a panel width around `760px`, max width `100%`, border radius no more than `8px`, and max height based on viewport.
- Keep the modal body scrollable with `overflow-y: auto`.
- Use plain colors consistent with the existing navy dashboard.
- Do not add `@import`, external URLs, fonts, or libraries.

- [ ] **Step 2: Add mobile styles inside the existing media query**

Inside `@media (max-width: 767px)`, add rules so the modal uses smaller padding and remains scrollable:

```css
.calc-guide-modal { padding: 14px; }
.calc-guide-panel { max-height: calc(100vh - 28px); }
.calc-guide-header { padding: 14px 16px; }
.calc-guide-body { max-height: calc(100vh - 104px); padding: 14px 16px 16px; }
```

- [ ] **Step 3: Verify no imports were added**

Run:

```powershell
rg -n "@import|url\(|https://" dashboard\Styles.html
```

Expected: no new external styling references.

---

### Task 3: Add Modal Behavior

**Files:**
- Modify: `dashboard/Scripts.html`

- [ ] **Step 1: Initialize guide controls**

In `initializeControls()`, after the existing button variables are read, call:

```js
initializeCalculationGuide_();
```

- [ ] **Step 2: Add behavior helpers after `initializeControls()`**

Add:

```js
function initializeCalculationGuide_() {
  var openBtn = document.getElementById("calculationGuideBtn");
  var closeBtn = document.getElementById("calculationGuideCloseBtn");
  var modal = document.getElementById("calculationGuideModal");

  if (!openBtn || !closeBtn || !modal || modal.dataset.initialized === "true") {
    return;
  }

  modal.dataset.initialized = "true";
  openBtn.addEventListener("click", openCalculationGuide_);
  closeBtn.addEventListener("click", closeCalculationGuide_);

  modal.addEventListener("click", function (event) {
    if (event.target && event.target.getAttribute("data-calc-guide-close") === "true") {
      closeCalculationGuide_();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      closeCalculationGuide_();
    }
  });
}

function openCalculationGuide_() {
  var modal = document.getElementById("calculationGuideModal");
  var panel = modal && modal.querySelector(".calc-guide-panel");
  if (!modal) return;
  modal.classList.remove("hidden");
  if (panel) panel.focus();
}

function closeCalculationGuide_() {
  var modal = document.getElementById("calculationGuideModal");
  var openBtn = document.getElementById("calculationGuideBtn");
  if (!modal) return;
  modal.classList.add("hidden");
  if (openBtn) openBtn.focus();
}
```

- [ ] **Step 3: Keep the guide available during refresh**

Do not add `calculationGuideBtn` to `setControlsDisabled_()`. It is static help and should remain usable.

- [ ] **Step 4: Verify script diff**

Run:

```powershell
git diff -- dashboard\Scripts.html
```

Expected: one initialization call and three helper functions. No server calls and no dependencies.

---

### Task 4: Manual And Static Verification

**Files:**
- Verify: `dashboard/Dialog.html`
- Verify: `dashboard/Scripts.html`
- Verify: `dashboard/Styles.html`

- [ ] **Step 1: Confirm only intended feature files changed**

Run:

```powershell
git status --short
```

Expected feature files:

```text
M dashboard/Dialog.html
M dashboard/Scripts.html
M dashboard/Styles.html
```

There may be unrelated existing docs or dashboard calculation changes in the working tree. Do not revert them.

- [ ] **Step 2: Confirm no calculation files changed**

Run:

```powershell
git diff -- dashboard\Helpers.js dashboard\Calculate.js dashboard\Server.js
```

Expected: no diff from this feature. If existing unrelated diffs appear, do not modify them.

- [ ] **Step 3: Confirm no external dependency was added**

Run:

```powershell
rg -n "@import|cdn|script src" dashboard\Dialog.html dashboard\Styles.html dashboard\Scripts.html
```

Expected: no new matches beyond the existing Chart.js script already present in `dashboard/Dialog.html`.

- [ ] **Step 4: Open the dashboard in Google Sheets and test behavior**

Expected behavior:

```text
Click calculation guide button -> centered overlay appears.
Click X -> overlay closes.
Click backdrop -> overlay closes.
Press Escape -> overlay closes.
Click Refresh -> guide button still works while dashboard is available.
Resize to mobile width -> modal remains readable and scrollable.
```

- [ ] **Step 5: Verify modal copy against source-of-truth docs**

Expected: all modal formulas match the six financial source-of-truth docs in plain language.

---

## Self-Review

- Scope: client-side help modal only.
- Dependencies: no new imports, libraries, server calls, or runtime files.
- Accessibility: button has labels, modal has `role="dialog"`, close button, focus target, and Escape close.
- Source alignment: modal formulas are copied from source-of-truth docs and simplified for users.