function getDashboardData(year, month) {
  try {
    const sourceData = loadDashboardSourceData_();

    const availablePeriods = buildAvailablePeriods_(
      sourceData.tripsDb,
      sourceData.otherIncomeRecords,
      sourceData.expensesRecords,
      sourceData.cashFlowRecords,
      sourceData.subconDeductionsRecords
    );

    const selectedPeriod = resolveDashboardPeriod_(
      parseDashboardYear_(year),
      parseDashboardMonth_(month),
      availablePeriods
    );

    return calculateDashboard_(
      selectedPeriod,
      sourceData.tripsDb,
      sourceData.otherIncomeRecords,
      sourceData.expensesRecords,
      sourceData.cashFlowRecords,
      sourceData.subconDeductionsRecords,
      sourceData.openingBalance,
      availablePeriods
    );

  } catch (error) {
    return {
      error: (error && error.message) || String(error) || "Unknown server error"
    };
  }
}


function loadDashboardSourceData_() {
  const tripsDbTable = getTableInfo_("tripsDb");
  const expensesTable = getTableInfo_("expenses");
  const otherIncomeTable = getTableInfo_("otherIncome");
  const cashFlowTable = getTableInfo_("cashFlow");
  const subconDeductionsTable = getTableInfo_("subconDeductions");

  return {
    tripsDb: getTableRecords_(tripsDbTable),
    expensesRecords: getTableRecords_(expensesTable),
    otherIncomeRecords: getTableRecords_(otherIncomeTable),
    cashFlowRecords: getTableRecords_(cashFlowTable),
    subconDeductionsRecords: getTableRecords_(subconDeductionsTable),
    openingBalance: toNumber_(
      getNamedRangeValue_(APP_SETTINGS.dashboardOpeningBalanceRange)
    )
  };
}


function openDashboardDialog() {
  const template = HtmlService.createTemplateFromFile("dashboard/Dialog");

  template.dashboardLogoDataUri = DASHBOARD_LOGO_DATA_URI;

  const html = template
    .evaluate()
    .setWidth(1200)
    .setHeight(750);

  SpreadsheetApp
    .getUi()
    .showModalDialog(html, "Executive Overview Dashboard");
}


function includeDashboardFile_(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


function parseDashboardYear_(year) {
  const value = normalizeText_(year);

  if (!value || value.toUpperCase() === DASHBOARD_ALL_VALUE) {
    return DASHBOARD_ALL_VALUE;
  }

  const selectedYear = Number(value);

  if (!Number.isInteger(selectedYear) || selectedYear < 1) {
    throw new Error("A valid dashboard year is required.");
  }

  return selectedYear;
}


function parseDashboardMonth_(month) {
  const value = normalizeText_(month);

  if (!value || value.toUpperCase() === DASHBOARD_ALL_VALUE) {
    return DASHBOARD_ALL_VALUE;
  }

  const selectedMonth = Number(value);

  if (
    !Number.isInteger(selectedMonth) ||
    selectedMonth < 1 ||
    selectedMonth > 12
  ) {
    throw new Error("A valid dashboard month from 1 to 12 is required.");
  }

  return selectedMonth;
}