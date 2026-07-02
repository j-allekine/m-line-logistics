function calculateDashboard_(
  selectedPeriod,
  tripsDb,
  otherIncomeRecords,
  expensesRecords,
  cashFlowRecords,
  subconDeductionsRecords,
  openingBalance,
  availablePeriods
) {
  const range = buildDashboardRange_(selectedPeriod);

  const tripKpis = buildTripKpis_(tripsDb, range);

  const revenueKpis = buildRevenueKpis_(
    tripsDb,
    otherIncomeRecords,
    subconDeductionsRecords,
    range
  );

  const costKpis = buildCostKpis_(
    tripsDb,
    expensesRecords,
    subconDeductionsRecords,
    range
  );

  // Present-only values. These intentionally ignore the filter.
  const receivablesKpi = buildReceivablesKpi_(tripsDb);
  const payablesKpi = buildPayablesKpi_(tripsDb);

  const cashFlowKpi = buildCashFlowKpi_(
    tripsDb,
    otherIncomeRecords,
    expensesRecords,
    cashFlowRecords,
    subconDeductionsRecords,
    range
  );

  const currentBalance = buildCurrentBalanceKpi_(
    tripsDb,
    otherIncomeRecords,
    expensesRecords,
    cashFlowRecords,
    subconDeductionsRecords,
    openingBalance,
    range
  );

  return {
    controls: {
      year: selectedPeriod.year,
      month: selectedPeriod.month,
      monthName: selectedPeriod.monthName,
      periodMode: selectedPeriod.mode,
      periodLabel: selectedPeriod.label,
      monthStart: range.startDate ? formatDateKey_(range.startDate) : "",
      monthEnd: range.endDate ? formatDateKey_(range.endDate) : ""
    },

    availablePeriods: availablePeriods,

    kpi: {
      totalTrips: tripKpis.totalTrips,
      ownTruckTrips: tripKpis.ownTruckTrips,
      subconTrips: tripKpis.subconTrips,
      totalRevenue: revenueKpis.totalRevenue,
      totalCost: costKpis.totalCost,
      netIncome: revenueKpis.totalRevenue - costKpis.totalCost,
      receivables: receivablesKpi.receivables,
      payables: payablesKpi.payables,
      netCashFlow: cashFlowKpi.netCashFlow,
      currentBalance: currentBalance
    },

    tripsByMonth: buildTripsByMonthChart_(tripsDb, selectedPeriod),

    monthlyFinancialPerformance: buildMonthlyFinancialPerformanceChart_(
      tripsDb,
      otherIncomeRecords,
      expensesRecords,
      subconDeductionsRecords,
      selectedPeriod
    ),

    receivablesStatus: buildReceivablesStatusChart_(receivablesKpi),
    payablesStatus: buildPayablesStatusChart_(payablesKpi),

    opexBreakdown: buildOpexBreakdownChart_(
      expensesRecords,
      range
    ),

    otherIncomeBreakdown: buildOtherIncomeBreakdownChart_(
      otherIncomeRecords,
      range
    )
  };
}