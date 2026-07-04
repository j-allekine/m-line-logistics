# Calculation Source Of Truth

This folder documents the canonical business definitions for system calculations.
These docs define what each metric means before any dashboard, report, email, or
automation implements it.

## Structure

- `financials/` - money, revenue, cost, receivables, payables, cash flow, and balance calculations.
- `trips/` - trip count and trip classification calculations.

## Usage

When implementation and documentation disagree, treat these files as the source
of truth and update the code or tests to match the documented rule. If the
business rule changes, update the relevant source-of-truth doc first, then update
tests and implementation.

