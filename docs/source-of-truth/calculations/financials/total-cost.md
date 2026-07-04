# Total Cost

## Definition

Total Cost is realized company cost for the selected period. It represents costs
that have been paid or recorded as expenses, not every unpaid payable.

## Formula

```text
Total Cost =
  Paid Subcon Trip Cost
  + Expenses
  + Paid Subcon Deduction Actual Cost
```

## Components

| Component | Source | Period Date | Amount |
| --- | --- | --- | --- |
| Paid Subcon Trip Cost | `TripsDB` | `Subcon Payment Date` | `Total Subcon Earnings` |
| Expenses | `Expenses` | `Date` | `Amount` |
| Paid Subcon Deduction Actual Cost | `Subcon Deductions` | `Date` | `Actual Cost` |

## Rules

- Count subcon trip cost only when `Subcon?` is `TRUE`.
- Count subcon trip cost only when `Subcon Payable Status` is `PAID`.
- Use `Subcon Payment Date` to place paid subcon trip cost into a dashboard period.
- Count `Expenses` by its row `Date`.
- Count subcon deduction actual cost only when `Paid?` is `TRUE`.
- Use `Actual Cost` as paid subcon deduction cost.
- Do not include unpaid subcon payables in Total Cost.
- Do not include manual `Cashflow[Cash Out]`.

## Relationship To Cash Out

Total Cost is included in cash-out reporting, but cash-out is not automatically
included in Total Cost.

```text
Cash Out =
  Total Cost
  + non-cost cash outflows
```

Manual cash-out entries are cash movements unless they are recorded through a
recognized cost source such as `Expenses`.

## Example

For a paid subcon trip:

```text
Subcon? = TRUE
Subcon Payable Status = PAID
Subcon Payment Date = inside selected period
Total Subcon Earnings = 3,000

Paid Subcon Trip Cost = 3,000
```

For a paid subcon deduction:

```text
Charge Amount = 1,500
Actual Cost = 1,000
Paid? = TRUE

Paid Subcon Deduction Actual Cost = 1,000
```
