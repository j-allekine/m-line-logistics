# Subcon Trips

## Definition

Subcon Trips is the count of delivered trips handled by subcontracted trucks
within the selected period.

## Formula

```text
Subcon Trips =
count TripsDB rows
where Delivery Date is inside the selected period
and Subcon? is TRUE
```

## Source Fields

| Source | Field |
| --- | --- |
| `TripsDB` | `Delivery Date` |
| `TripsDB` | `Subcon?` |

## Rules

- Use `Delivery Date` for period filtering.
- A trip is treated as subcon only when `Subcon?` is boolean true.
- Do not filter by billing status, payment status, customer, route, or payable status.

## Relationship To Other Metrics

```text
Total Trips = Own Truck Trips + Subcon Trips
```

