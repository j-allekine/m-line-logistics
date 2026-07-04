# Net Income

## Definition

Net Income is realized company profit for the selected period. It is the
difference between Total Revenue and Total Cost.

## Formula

```text
Net Income =
  Total Revenue
  - Total Cost
```

## Components

| Component | Source | Amount |
| --- | --- | --- |
| Total Revenue | `financials/total-revenue.md` | Realized revenue for the selected period |
| Total Cost | `financials/total-cost.md` | Realized cost for the selected period |

## Rules

- Calculate Net Income from the source-of-truth Total Revenue and Total Cost values.
- Do not add `Margin` fields directly into Net Income.
- For paid subcon deductions, margin is produced naturally because Total Revenue includes `Charge Amount` and Total Cost includes `Actual Cost`.

## Example

For a paid subcon deduction:

```text
Charge Amount = 1,500
Actual Cost = 1,000

Total Revenue impact = 1,500
Total Cost impact = 1,000

Net Income impact =
  1,500 - 1,000
  = 500
```
