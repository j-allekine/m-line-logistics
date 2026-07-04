# Current Balance

## Definition

Current Balance is the running cash balance as of the end of the selected
dashboard period. It starts from the dashboard opening balance and applies all
recognized cash inflows and cash outflows up to the period end date.

## Formula

```text
Current Balance =
  Opening Balance
  + Historical Cash In
  - Historical Cash Out
```

## Components

| Component | Source | Period Rule | Amount |
| --- | --- | --- | --- |
| Opening Balance | Named range `cashOpeningBalance` | Always included | Opening balance value |
| Customer Collections | `TripsDB` | `Payment Date` is on or before the selected period end date | `Alaska Rate + Fuel Subsidy` |
| Other Income | `Other Income` | `Date` is on or before the selected period end date | `Amount` |
| Manual Cash In | `Cashflow` | `Date` is on or before the selected period end date | `Cash In` |
| Paid Subcon Deduction Cash In | `Subcon Deductions` | `Date` is on or before the selected period end date | `Charge Amount` |
| Paid Subcon Payments | `TripsDB` | `Subcon Payment Date` is on or before the selected period end date | `Total Subcon Earnings` |
| Expenses | `Expenses` | `Date` is on or before the selected period end date | `Amount` |
| Manual Cash Out | `Cashflow` | `Date` is on or before the selected period end date | `Cash Out` |
| Paid Subcon Deduction Cash Out | `Subcon Deductions` | `Date` is on or before the selected period end date | `Actual Cost` |

## Rules

- For an all-time dashboard period, include all dated cash inflows and cash outflows.
- For a month or year dashboard period, include transactions on or before the selected period end date.
- Count customer collections only when `Billing Status` is `PAID`.
- Use `Payment Date` to place customer collections into the running balance.
- Count subcon payments only when `Subcon?` is `TRUE` and `Subcon Payable Status` is `PAID`.
- Use `Subcon Payment Date` to place paid subcon payments into the running balance.
- Count subcon deduction cash in and cash out only when `Paid?` is `TRUE`.
- Do not use receivables or unpaid payables in Current Balance.

## Relationship To Net Cash Flow

Net Cash Flow is period-only movement. Current Balance is cumulative movement
through the selected period end date.

```text
Current Balance =
  Opening Balance
  + all historical Cash In through period end
  - all historical Cash Out through period end
```

## Example

```text
Opening Balance = 1,000
Historical Cash In = 22,150
Historical Cash Out = 7,425

Current Balance =
  1,000 + 22,150 - 7,425
  = 15,725
```
