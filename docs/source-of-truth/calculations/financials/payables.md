# Payables

## Definition

Payables is the current amount the company still owes subcontractors. It is a
present-only balance metric and is not filtered by the selected dashboard
period.

## Formula

```text
Payables =
  Unpaid Subcon Amount
```

## Components

| Component | Source | Condition | Amount |
| --- | --- | --- | --- |
| Unpaid Subcon Amount | `TripsDB` | `Subcon?` is `TRUE` and `Subcon Payable Status` is `UNPAID` | `Total Subcon Earnings` |

## Rules

- Calculate payables from all current `TripsDB` rows, not from the selected dashboard period.
- Include only rows where `Subcon?` is `TRUE`.
- Include only rows where `Subcon Payable Status` is `UNPAID`.
- Use `Total Subcon Earnings` as the payable amount.
- Do not include `PAID` subcon payables in Payables.
- Do not include unpaid payables in Total Cost.
- Do not include unpaid payables in Current Balance.

## Relationship To Total Cost

Payables are unpaid subcon amounts. Total Cost counts only paid subcon trip cost
by `Subcon Payment Date`.

```text
Payables =
  unpaid subcon amounts

Total Cost =
  paid subcon amounts
```

## Example

```text
Subcon? = TRUE
Subcon Payable Status = UNPAID
Total Subcon Earnings = 3,000

Payables impact = 3,000
Total Cost impact = 0
```
