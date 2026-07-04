# Total Revenue

## Definition

Total Revenue is realized company revenue for the selected period. It represents
money the company has earned as revenue, not every cash movement and not every
unpaid receivable.

## Formula

```text
Total Revenue =
  Paid Trip Billing Amount
  + Other Income
  + Paid Subcon Deduction Margin
```

## Components

| Component | Source | Period Date | Amount |
| --- | --- | --- | --- |
| Paid Trip Billing Amount | `TripsDB` | `Payment Date` | `Alaska Rate + Fuel Subsidy` |
| Other Income | `Other Income` | `Date` | `Amount` |
| Paid Subcon Deduction Margin | `Subcon Deductions` | `Date` | `Charge Amount - Actual Cost` |

## Rules

- Count trip billing only when `Billing Status` is `PAID`.
- Use `Payment Date` to place paid trip billing into a dashboard period.
- Calculate trip billing amount as `Alaska Rate + Fuel Subsidy`.
- Count `Other Income` by its row `Date`.
- Count subcon deduction margin only when `Paid?` is `TRUE`.
- Calculate subcon deduction margin server-side as `Charge Amount - Actual Cost`.
- Do not use the sheet `Margin` field for dashboard calculation.
- Do not use `Gross Earnings` for Total Revenue.
- Do not include `UNBILLED` or `BILLED` receivables.
- Do not include manual `Cashflow[Cash In]`.

## Relationship To Cash In

Total Revenue is included in cash-in reporting, but cash-in is not automatically
included in Total Revenue.

```text
Cash In =
  Total Revenue
  + non-revenue cash inflows
```

Manual cash-in entries are cash movements unless they are recorded through a
recognized revenue source such as `Other Income`.

## Example

```text
Alaska Rate = 6,500
Fuel Subsidy = 780
Billing Status = PAID
Payment Date = inside selected period

Paid Trip Billing Amount = 7,280
```

For a paid subcon deduction:

```text
Charge Amount = 1,500
Actual Cost = 1,000
Paid? = TRUE

Paid Subcon Deduction Margin = 500
```

