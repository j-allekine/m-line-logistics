const DASHBOARD_ALL_VALUE = "ALL";

const DASHBOARD_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const DASHBOARD_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];


function isInMonth_(dateValue, monthStart, monthEnd) {
  const date = toDateOnly_(dateValue);

  if (!date) return false;

  return (
    date.getTime() >= monthStart.getTime() &&
    date.getTime() <= monthEnd.getTime()
  );
}


function isInRange_(dateValue, range) {
  const date = toDateOnly_(dateValue);

  if (!date) return false;

  if (!range || range.mode === DASHBOARD_ALL_VALUE) {
    return true;
  }

  return (
    date.getTime() >= range.startDate.getTime() &&
    date.getTime() <= range.endDate.getTime()
  );
}


function isBeforeOrOnDate_(dateValue, cutoffDate) {
  const date = toDateOnly_(dateValue);

  if (!date) return false;

  if (!cutoffDate) return true;

  return date.getTime() <= cutoffDate.getTime();
}


function isInYear_(dateValue, year) {
  const date = toDateOnly_(dateValue);

  if (!date) return false;

  return date.getFullYear() === year;
}


function getMonthIndex_(dateValue) {
  const date = toDateOnly_(dateValue);

  if (!date) return -1;

  return date.getMonth();
}


function isSubcon_(record) {
  return toBoolean_(record.isSubcon) === true;
}


function hasPaymentDate_(record) {
  return (
    normalizeText_(record.paymentDate) !== "" &&
    toDateOnly_(record.paymentDate) !== null
  );
}


function hasSubconPaymentDate_(record) {
  return (
    normalizeText_(record.subconPaymentDate) !== "" &&
    toDateOnly_(record.subconPaymentDate) !== null
  );
}


function getBillingAmount_(record) {
  return toNumber_(record.alaskaRate) + toNumber_(record.fuelSubsidy);
}


function isPaidSubconDeduction_(record) {
  return toBoolean_(record.isPaid) === true;
}


function getPaidSubconDeductionMargin_(record) {
  return toNumber_(record.chargeAmount) - toNumber_(record.actualCost);
}


function sumPaidSubconDeductionMargins_(records, range) {
  return sumRecords_(records || [], record =>
    isPaidSubconDeduction_(record) && isInRange_(record.date, range)
      ? getPaidSubconDeductionMargin_(record)
      : 0
  );
}


function sumPaidSubconDeductionCharges_(records, range) {
  return sumRecords_(records || [], record =>
    isPaidSubconDeduction_(record) && isInRange_(record.date, range)
      ? toNumber_(record.chargeAmount)
      : 0
  );
}


function sumPaidSubconDeductionActualCosts_(records, range) {
  return sumRecords_(records || [], record =>
    isPaidSubconDeduction_(record) && isInRange_(record.date, range)
      ? toNumber_(record.actualCost)
      : 0
  );
}


function sumPaidSubconDeductionChargesUntil_(records, cutoffDate) {
  return sumRecords_(records || [], record =>
    isPaidSubconDeduction_(record) &&
    isBeforeOrOnDate_(record.date, cutoffDate)
      ? toNumber_(record.chargeAmount)
      : 0
  );
}


function sumPaidSubconDeductionActualCostsUntil_(records, cutoffDate) {
  return sumRecords_(records || [], record =>
    isPaidSubconDeduction_(record) &&
    isBeforeOrOnDate_(record.date, cutoffDate)
      ? toNumber_(record.actualCost)
      : 0
  );
}


function buildAvailablePeriods_(
  tripsDb,
  otherIncomeRecords,
  expensesRecords,
  cashFlowRecords,
  subconDeductionsRecords
) {
  const periodMap = {};

  addRecordPeriods_(periodMap, tripsDb);
  addRecordPeriods_(periodMap, expensesRecords);
  addRecordPeriods_(periodMap, otherIncomeRecords);
  addRecordPeriods_(periodMap, cashFlowRecords);
  addPaidSubconDeductionPeriods_(periodMap, subconDeductionsRecords || []);

  addRecordPeriodsByField_(periodMap, tripsDb, "paymentDate");
  addRecordPeriodsByField_(periodMap, tripsDb, "subconPaymentDate");

  const periodKeys = getPeriodKeys_(periodMap);
  const hasRecordPeriods = periodKeys.length > 0;

  if (!hasRecordPeriods) {
    const now = new Date();
    addPeriod_(periodMap, now.getFullYear(), now.getMonth() + 1);
    periodKeys.push(buildPeriodKey_(now.getFullYear(), now.getMonth() + 1));
  }

  const numericYears = Object.keys(periodMap)
    .map(year => Number(year))
    .sort((a, b) => a - b);

  const years = [DASHBOARD_ALL_VALUE].concat(numericYears);
  const monthsByYear = {};

  monthsByYear[DASHBOARD_ALL_VALUE] = [
    {
      month: DASHBOARD_ALL_VALUE,
      label: "All"
    }
  ];

  numericYears.forEach(year => {
    const yearMonths = Object.keys(periodMap[String(year)])
      .map(month => Number(month))
      .sort((a, b) => a - b)
      .map(month => ({
        month: month,
        label: DASHBOARD_MONTH_LABELS[month - 1]
      }));

    monthsByYear[String(year)] = [
      {
        month: DASHBOARD_ALL_VALUE,
        label: "All"
      }
    ].concat(yearMonths);
  });

  const latestPeriod = periodKeys
    .map(key => parsePeriodKey_(key))
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    })[0];

  return {
    years: years,
    monthsByYear: monthsByYear,
    latest: latestPeriod,
    hasRecordPeriods: hasRecordPeriods,
    allValue: DASHBOARD_ALL_VALUE,
    allLabel: "All"
  };
}


function getPeriodKeys_(periodMap) {
  return Object.keys(periodMap).reduce((periodKeys, year) => {
    Object.keys(periodMap[year]).forEach(month => {
      periodKeys.push(buildPeriodKey_(Number(year), Number(month)));
    });

    return periodKeys;
  }, []).sort();
}


function resolveDashboardPeriod_(requestedYear, requestedMonth, availablePeriods) {
  if (requestedYear === DASHBOARD_ALL_VALUE || !requestedYear) {
    return buildDashboardPeriodAll_();
  }

  if (requestedMonth === DASHBOARD_ALL_VALUE || !requestedMonth) {
    return buildDashboardPeriodYear_(requestedYear);
  }

  if (hasAvailablePeriod_(availablePeriods, requestedYear, requestedMonth)) {
    return buildDashboardPeriodMonth_(requestedYear, requestedMonth);
  }

  return buildDashboardPeriodYear_(requestedYear);
}


function buildDashboardPeriodAll_() {
  return {
    mode: DASHBOARD_ALL_VALUE,
    year: DASHBOARD_ALL_VALUE,
    month: DASHBOARD_ALL_VALUE,
    monthName: "All",
    label: "All Time"
  };
}


function buildDashboardPeriodYear_(year) {
  return {
    mode: "YEAR",
    year: year,
    month: DASHBOARD_ALL_VALUE,
    monthName: "All",
    label: String(year)
  };
}


function buildDashboardPeriodMonth_(year, month) {
  return {
    mode: "MONTH",
    year: year,
    month: month,
    monthName: DASHBOARD_MONTH_NAMES[month - 1],
    label: `${DASHBOARD_MONTH_NAMES[month - 1]} ${year}`
  };
}


function buildDashboardRange_(selectedPeriod) {
  if (!selectedPeriod || selectedPeriod.mode === DASHBOARD_ALL_VALUE) {
    return {
      mode: DASHBOARD_ALL_VALUE,
      startDate: null,
      endDate: null
    };
  }

  if (selectedPeriod.mode === "YEAR") {
    return {
      mode: "YEAR",
      startDate: new Date(selectedPeriod.year, 0, 1),
      endDate: new Date(selectedPeriod.year, 11, 31)
    };
  }

  return {
    mode: "MONTH",
    startDate: new Date(selectedPeriod.year, selectedPeriod.month - 1, 1),
    endDate: new Date(selectedPeriod.year, selectedPeriod.month, 0)
  };
}


function addRecordPeriods_(periodMap, records) {
  records.forEach(record => {
    const date = toDateOnly_(record.date);

    if (!date) return;

    addPeriod_(periodMap, date.getFullYear(), date.getMonth() + 1);
  });
}


function addRecordPeriodsByField_(periodMap, records, fieldName) {
  records.forEach(record => {
    const date = toDateOnly_(record[fieldName]);

    if (!date) return;

    addPeriod_(periodMap, date.getFullYear(), date.getMonth() + 1);
  });
}


function addPaidSubconDeductionPeriods_(periodMap, records) {
  records
    .filter(record => isPaidSubconDeduction_(record))
    .forEach(record => {
      const date = toDateOnly_(record.date);

      if (!date) return;

      addPeriod_(periodMap, date.getFullYear(), date.getMonth() + 1);
    });
}


function addPeriod_(periodMap, year, month) {
  const yearKey = String(year);
  const monthKey = String(month);

  if (!periodMap[yearKey]) {
    periodMap[yearKey] = {};
  }

  periodMap[yearKey][monthKey] = true;
}


function hasAvailablePeriod_(availablePeriods, year, month) {
  const months = availablePeriods.monthsByYear[String(year)] || [];

  return months.some(period => Number(period.month) === Number(month));
}


function buildPeriodKey_(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}


function parsePeriodKey_(periodKey) {
  const parts = periodKey.split("-");

  return {
    year: Number(parts[0]),
    month: Number(parts[1])
  };
}


function buildTripKpis_(tripsDb, range) {
  const filteredTrips = tripsDb.filter(record =>
    isInRange_(record.date, range)
  );

  const subconTrips = filteredTrips.filter(record => isSubcon_(record)).length;

  return {
    totalTrips: filteredTrips.length,
    ownTruckTrips: filteredTrips.length - subconTrips,
    subconTrips: subconTrips
  };
}


function buildRevenueKpis_(
  tripsDb,
  otherIncomeRecords,
  subconDeductionsRecords,
  range
) {
  const tripRevenue = sumRecords_(tripsDb, record =>
    hasPaymentDate_(record) &&
    isInRange_(record.paymentDate, range) &&
    normalizeStatus_(record.billingStatus) === "PAID"
      ? getBillingAmount_(record)
      : 0
  );

  const otherIncome = sumRecords_(otherIncomeRecords, record =>
    isInRange_(record.date, range)
      ? toNumber_(record.amount)
      : 0
  );

  const subconDeductionRevenue = sumPaidSubconDeductionCharges_(
    subconDeductionsRecords,
    range
  );

  return {
    tripRevenue: tripRevenue,
    otherIncome: otherIncome,
    subconDeductionRevenue: subconDeductionRevenue,
    totalRevenue: tripRevenue + otherIncome + subconDeductionRevenue
  };
}


function buildCostKpis_(
  tripsDb,
  expensesRecords,
  subconDeductionsRecords,
  range
) {
  const subconCost = sumSubconPayments_(
    tripsDb,
    range
  );

  const expenses = sumRecords_(expensesRecords, record =>
    isInRange_(record.date, range)
      ? toNumber_(record.amount)
      : 0
  );

  const subconDeductionCost = sumPaidSubconDeductionActualCosts_(
    subconDeductionsRecords,
    range
  );

  return {
    subconCost: subconCost,
    expenses: expenses,
    subconDeductionCost: subconDeductionCost,
    totalCost: subconCost + expenses + subconDeductionCost
  };
}


function buildReceivablesKpi_(tripsDb) {
  const result = {
    unbilled: 0,
    billed: 0,
    paid: 0,
    receivables: 0
  };

  tripsDb.forEach(record => {
    const amount = getBillingAmount_(record);
    const status = normalizeStatus_(record.billingStatus);

    if (status === "UNBILLED") result.unbilled += amount;
    if (status === "BILLED") result.billed += amount;
    if (status === "PAID") result.paid += amount;
  });

  result.receivables = result.unbilled + result.billed;

  return result;
}


function buildPayablesKpi_(tripsDb) {
  const result = {
    unpaid: 0,
    paid: 0,
    payables: 0
  };

  tripsDb
    .filter(record => isSubcon_(record))
    .forEach(record => {
      const amount = toNumber_(record.totalSubconEarnings);
      const status = normalizeStatus_(record.subconPayableStatus);

      if (status === "UNPAID") result.unpaid += amount;
      if (status === "PAID") result.paid += amount;
    });

  result.payables = result.unpaid;

  return result;
}


function buildCashFlowKpi_(
  tripsDb,
  otherIncomeRecords,
  expensesRecords,
  cashFlowRecords,
  subconDeductionsRecords,
  range
) {
  const customerCollections = sumCustomerCollections_(
    tripsDb,
    range
  );

  const otherIncome = sumRecords_(otherIncomeRecords, record =>
    isInRange_(record.date, range)
      ? toNumber_(record.amount)
      : 0
  );

  const manualCashIn = sumRecords_(cashFlowRecords, record =>
    isInRange_(record.date, range)
      ? toNumber_(record.cashIn)
      : 0
  );

  const subconDeductionCashIn = sumPaidSubconDeductionCharges_(
    subconDeductionsRecords,
    range
  );

  const subconPayments = sumSubconPayments_(
    tripsDb,
    range
  );

  const expenses = sumRecords_(expensesRecords, record =>
    isInRange_(record.date, range)
      ? toNumber_(record.amount)
      : 0
  );

  const manualCashOut = sumRecords_(cashFlowRecords, record =>
    isInRange_(record.date, range)
      ? toNumber_(record.cashOut)
      : 0
  );

  const subconDeductionCashOut = sumPaidSubconDeductionActualCosts_(
    subconDeductionsRecords,
    range
  );

  const cashIn =
    customerCollections +
    otherIncome +
    manualCashIn +
    subconDeductionCashIn;

  const cashOut =
    subconPayments +
    expenses +
    manualCashOut +
    subconDeductionCashOut;

  return {
    cashIn: cashIn,
    cashOut: cashOut,
    netCashFlow: cashIn - cashOut
  };
}


function buildCurrentBalanceKpi_(
  tripsDb,
  otherIncomeRecords,
  expensesRecords,
  cashFlowRecords,
  subconDeductionsRecords,
  openingBalance,
  range
) {
  const cutoffDate = range ? range.endDate : null;

  const historicalCashIn =
    sumCustomerCollectionsUntil_(tripsDb, cutoffDate) +
    sumRecords_(otherIncomeRecords, record =>
      isBeforeOrOnDate_(record.date, cutoffDate) ? toNumber_(record.amount) : 0
    ) +
    sumRecords_(cashFlowRecords, record =>
      isBeforeOrOnDate_(record.date, cutoffDate) ? toNumber_(record.cashIn) : 0
    ) +
    sumPaidSubconDeductionChargesUntil_(
      subconDeductionsRecords,
      cutoffDate
    );

  const historicalCashOut =
    sumSubconPaymentsUntil_(tripsDb, cutoffDate) +
    sumRecords_(expensesRecords, record =>
      isBeforeOrOnDate_(record.date, cutoffDate) ? toNumber_(record.amount) : 0
    ) +
    sumRecords_(cashFlowRecords, record =>
      isBeforeOrOnDate_(record.date, cutoffDate) ? toNumber_(record.cashOut) : 0
    ) +
    sumPaidSubconDeductionActualCostsUntil_(
      subconDeductionsRecords,
      cutoffDate
    );

  return toNumber_(openingBalance) + historicalCashIn - historicalCashOut;
}


function buildTripsByMonthChart_(tripsDb, selectedPeriod) {
  const ownTruckTrips = emptyMonthlyArray_();
  const subconTrips = emptyMonthlyArray_();
  const totalTrips = emptyMonthlyArray_();
  const range = buildYearChartRange_(selectedPeriod);

  tripsDb
    .filter(record => isInRange_(record.date, range))
    .forEach(record => {
      const monthIndex = getMonthIndex_(record.date);

      if (monthIndex < 0) return;

      if (isSubcon_(record)) {
        subconTrips[monthIndex]++;
      } else {
        ownTruckTrips[monthIndex]++;
      }

      totalTrips[monthIndex]++;
    });

  return {
    months: DASHBOARD_MONTH_LABELS.slice(),
    ownTruckTrips: ownTruckTrips,
    subconTrips: subconTrips,
    totalTrips: totalTrips
  };
}


function buildMonthlyFinancialPerformanceChart_(
  tripsDb,
  otherIncomeRecords,
  expensesRecords,
  subconDeductionsRecords,
  selectedPeriod
) {
  const chart = {
    months: DASHBOARD_MONTH_LABELS.slice(),
    totalRevenue: emptyMonthlyArray_(),
    totalCost: emptyMonthlyArray_(),
    netIncome: emptyMonthlyArray_(),
    tripRevenue: emptyMonthlyArray_(),
    otherIncome: emptyMonthlyArray_(),
    subconCost: emptyMonthlyArray_(),
    expenses: emptyMonthlyArray_()
  };
  const range = buildYearChartRange_(selectedPeriod);
  const subconDeductionRevenue = emptyMonthlyArray_();
  const subconDeductionCost = emptyMonthlyArray_();

  tripsDb
    .filter(record =>
      hasSubconPaymentDate_(record) &&
      isInRange_(record.subconPaymentDate, range) &&
      isSubcon_(record) &&
      normalizeStatus_(record.subconPayableStatus) === "PAID"
    )
    .forEach(record => {
      const monthIndex = getMonthIndex_(record.subconPaymentDate);

      if (monthIndex >= 0) {
        chart.subconCost[monthIndex] += toNumber_(
          record.totalSubconEarnings
        );
      }
    });

  tripsDb
    .filter(record =>
      hasPaymentDate_(record) &&
      isInRange_(record.paymentDate, range) &&
      normalizeStatus_(record.billingStatus) === "PAID"
    )
    .forEach(record => {
      const monthIndex = getMonthIndex_(record.paymentDate);

      if (monthIndex >= 0) {
        chart.tripRevenue[monthIndex] += getBillingAmount_(record);
      }
    });

  otherIncomeRecords
    .filter(record => isInRange_(record.date, range))
    .forEach(record => {
      const monthIndex = getMonthIndex_(record.date);

      if (monthIndex >= 0) {
        chart.otherIncome[monthIndex] += toNumber_(record.amount);
      }
    });

  expensesRecords
    .filter(record => isInRange_(record.date, range))
    .forEach(record => {
      const monthIndex = getMonthIndex_(record.date);

      if (monthIndex >= 0) {
        chart.expenses[monthIndex] += toNumber_(record.amount);
      }
    });

  (subconDeductionsRecords || [])
    .filter(record =>
      isPaidSubconDeduction_(record) &&
      isInRange_(record.date, range)
    )
    .forEach(record => {
      const monthIndex = getMonthIndex_(record.date);

      if (monthIndex >= 0) {
        subconDeductionRevenue[monthIndex] += toNumber_(
          record.chargeAmount
        );
        subconDeductionCost[monthIndex] += toNumber_(
          record.actualCost
        );
      }
    });

  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    chart.totalRevenue[monthIndex] =
      chart.tripRevenue[monthIndex] +
      chart.otherIncome[monthIndex] +
      subconDeductionRevenue[monthIndex];

    chart.totalCost[monthIndex] =
      chart.subconCost[monthIndex] +
      chart.expenses[monthIndex] +
      subconDeductionCost[monthIndex];

    chart.netIncome[monthIndex] =
      chart.totalRevenue[monthIndex] - chart.totalCost[monthIndex];
  }

  return chart;
}


function buildYearChartRange_(selectedPeriod) {
  if (!selectedPeriod || selectedPeriod.mode === DASHBOARD_ALL_VALUE) {
    return {
      mode: DASHBOARD_ALL_VALUE,
      startDate: null,
      endDate: null
    };
  }

  return {
    mode: "YEAR",
    startDate: new Date(selectedPeriod.year, 0, 1),
    endDate: new Date(selectedPeriod.year, 11, 31)
  };
}


function buildReceivablesStatusChart_(receivablesKpi) {
  return {
    unbilled: receivablesKpi.unbilled,
    billed: receivablesKpi.billed,
    paid: receivablesKpi.paid,
    centerValue: receivablesKpi.receivables,
    centerLabel: "RECEIVABLES"
  };
}


function buildPayablesStatusChart_(payablesKpi) {
  return {
    unpaid: payablesKpi.unpaid,
    paid: payablesKpi.paid,
    centerValue: payablesKpi.payables,
    centerLabel: "PAYABLES"
  };
}


function buildOpexBreakdownChart_(expensesRecords, range) {
  return buildCategoryAmountChart_(
    expensesRecords,
    range,
    "category",
    "amount"
  );
}


function buildOtherIncomeBreakdownChart_(
  otherIncomeRecords,
  range
) {
  return buildCategoryAmountChart_(
    otherIncomeRecords,
    range,
    "category",
    "amount"
  );
}


function buildCategoryAmountChart_(
  records,
  range,
  categoryField,
  amountField
) {
  const categoryAmounts = {};
  const categories = [];

  records
    .filter(record => isInRange_(record.date, range))
    .forEach(record => {
      const category = normalizeText_(record[categoryField]);

      if (!category) return;

      if (!Object.prototype.hasOwnProperty.call(categoryAmounts, category)) {
        categoryAmounts[category] = 0;
        categories.push(category);
      }

      categoryAmounts[category] += toNumber_(record[amountField]);
    });

  return categories
    .filter(category => categoryAmounts[category] !== 0)
    .sort((a, b) => {
      const amountDifference = categoryAmounts[b] - categoryAmounts[a];

      if (amountDifference !== 0) return amountDifference;

      return a.localeCompare(b);
    })
    .reduce(
      (chart, category) => {
        chart.categories.push(category);
        chart.amounts.push(categoryAmounts[category]);

        return chart;
      },
      { categories: [], amounts: [] }
    );
}


function sumCustomerCollections_(tripsDb, range) {
  return sumRecords_(tripsDb, record =>
    hasPaymentDate_(record) &&
    isInRange_(record.paymentDate, range) &&
    normalizeStatus_(record.billingStatus) === "PAID"
      ? getBillingAmount_(record)
      : 0
  );
}


function sumCustomerCollectionsUntil_(tripsDb, cutoffDate) {
  return sumRecords_(tripsDb, record =>
    hasPaymentDate_(record) &&
    isBeforeOrOnDate_(record.paymentDate, cutoffDate) &&
    normalizeStatus_(record.billingStatus) === "PAID"
      ? getBillingAmount_(record)
      : 0
  );
}


function sumSubconPayments_(tripsDb, range) {
  return sumRecords_(tripsDb, record =>
    hasSubconPaymentDate_(record) &&
    isInRange_(record.subconPaymentDate, range) &&
    isSubcon_(record) &&
    normalizeStatus_(record.subconPayableStatus) === "PAID"
      ? toNumber_(record.totalSubconEarnings)
      : 0
  );
}


function sumSubconPaymentsUntil_(tripsDb, cutoffDate) {
  return sumRecords_(tripsDb, record =>
    hasSubconPaymentDate_(record) &&
    isBeforeOrOnDate_(record.subconPaymentDate, cutoffDate) &&
    isSubcon_(record) &&
    normalizeStatus_(record.subconPayableStatus) === "PAID"
      ? toNumber_(record.totalSubconEarnings)
      : 0
  );
}


function emptyMonthlyArray_() {
  return Array(12).fill(0);
}


function sumRecords_(records, getAmount) {
  return records.reduce((total, record) => total + getAmount(record), 0);
}


function formatDateKey_(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}