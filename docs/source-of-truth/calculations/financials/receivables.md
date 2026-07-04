# Receivables

## Definition

Receivables is the current amount customers still owe the company. It is a
present-only balance metric and is not filtered by the selected dashboard
period.

## Formula

```text
Receivables =
  Unbilled Amount
  + Billed But Unpaid Amount
```

## Components

| Component | Source | Condition | Amount |
| --- | --- | --- | --- |
| Unbilled Amount | `TripsDB` | `Billing Status` is `UNBILLED` | `Alaska Rate + Fuel Subsidy` |
| Billed But Unpaid Amount | `TripsDB` | `Billing Status` is `BILLED` | `Alaska Rate + Fuel Subsidy` |

## Rules

- Calculate receivables from all current `TripsDB` rows, not from the selected dashboard period.
- Calculate each billing amount as `Alaska Rate + Fuel Subsidy`.
- Include `UNBILLED` rows in receivables.
- Include `BILLED` rows in receivables.
- Do not include `PAID` rows in receivables.
- Do not use `Gross Earnings` for receivables.
- Do not include receivables in Total Revenue until the billing is paid.
- Do not include receivables in Current Balance.

## Relationship To Total Revenue

Receivables are unpaid customer amounts. Total Revenue counts only paid trip
billing by `Payment Date`.

```text
Receivables =
  unpaid customer billing amounts

Total Revenue =
  paid customer billing amounts
```

## Example

```text
Alaska Rate = 5,000
Fuel Subsidy = 500
Billing Status = BILLED

Billed But Unpaid Amount = 5,500
Receivables impact = 5,500
Total Revenue impact = 0
```
