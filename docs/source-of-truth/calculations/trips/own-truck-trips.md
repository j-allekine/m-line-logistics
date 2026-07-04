# Own Truck Trips

## Definition

Own Truck Trips is the count of delivered trips handled by company-owned or
company-operated trucks within the selected period.

## Formula

```text
Own Truck Trips =
count TripsDB rows
where Delivery Date is inside the selected period
and Subcon? is not TRUE
```

## Source Fields

| Source | Field |
| --- | --- |
| `TripsDB` | `Delivery Date` |
| `TripsDB` | `Subcon?` |

## Rules

- Use `Delivery Date` for period filtering.
- A trip is treated as own-truck when `Subcon?` is not boolean true.
- Do not filter by billing status, payment status, customer, route, or payable status.

## Relationship To Other Metrics

```text
Own Truck Trips = Total Trips - Subcon Trips
```

