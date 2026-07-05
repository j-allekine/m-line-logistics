# Receivables Tax Treatment

## Status

Needs decision

## Problem

Dashboard Receivables currently use the base trip billing amount:

```text
Alaska Rate + Fuel Subsidy
```

The printable Billing Statement calculates invoice-level tax amounts:

```text
Net Amount = sum of billing line amounts
VAT = Net Amount * 12%
Total Billing Amount = Net Amount + VAT
Withholding = Total Billing Amount * 2%
Grand Total = Total Billing Amount - Withholding
```

Because dashboard receivables are trip-level and Billing Statement totals are
invoice-level, the dashboard Receivables KPI may not match the customer-facing
invoice collectible amount.

## Current Behavior

Dashboard Receivables include:

- `UNBILLED` trips
- `BILLED` trips
- amount: `Alaska Rate + Fuel Subsidy`

Dashboard Receivables exclude:

- `PAID` trips
- 12% VAT
- 2% withholding
- Billing Statement `Grand Total`

## Evidence

Dashboard receivables are calculated from `TripsDB` rows in:

```text
dashboard/Helpers.js
```

The current source-of-truth definition is documented in:

```text
docs/source-of-truth/calculations/financials/receivables.md
```

The live Billing Statement calculates invoice-level tax totals using:

```text
billingNetAmount
billingVATAmount
billingTotalBillingAmount
billingWHT
billingGrandTotal
```

## Example

If a billing line has:

```text
Base billing amount = 10,000
VAT 12% = 1,200
Total billing amount = 11,200
Withholding 2% = 224
Grand total = 10,976
```

Dashboard Receivables currently count:

```text
10,000
```

If the business expects receivables to represent the invoice collectible amount,
the dashboard would be short by:

```text
976
```

## Decision Needed

Should dashboard Receivables represent:

1. Base trip billing amount: `Alaska Rate + Fuel Subsidy`
2. Billing amount including VAT
3. Collectible invoice grand total after withholding

## Current Recommendation

Keep dashboard Receivables as base trip billing amount for now.

Reason: VAT and withholding are currently calculated at the Billing Statement
level, while dashboard receivables are calculated from trip-level `TripsDB`
rows. Changing this safely requires an invoice-level receivables model or a
clear rule for allocating invoice-level tax amounts back to trips.

## If This Changes Later

Update:

- dashboard receivables calculation
- email summary receivables calculation
- dashboard calculation guide
- receivables source-of-truth documentation
- tests for VAT and withholding behavior
