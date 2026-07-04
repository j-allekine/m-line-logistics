# Total Trips

## Definition

Total Trips is the count of trip records delivered within the selected period.

## Formula

```text
Total Trips =
count TripsDB rows
where Delivery Date is inside the selected period
```

## Source Fields

| Source | Field |
| --- | --- |
| `TripsDB` | `Delivery Date` |

## Rules

- Use `Delivery Date` for period filtering.
- Count both own-truck and subcon trips.
- Do not filter by billing status, payment status, customer, route, or payable status.
- Blank or invalid delivery dates do not count for month/year periods.

## Relationship To Other Metrics

```text
Total Trips = Own Truck Trips + Subcon Trips
```

