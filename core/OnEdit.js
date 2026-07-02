function onEdit(e) {
  if (!e || !e.range) return;

  const moduleConfig = getOnEditModuleConfig_(e.range.getSheet().getName());

  if (!moduleConfig) return;

  runOnEditHandler_(moduleConfig.moduleName, moduleConfig.handler, e);
}


function getOnEditModuleConfig_(sheetName) {
  const modules = [
    {
      moduleName: "Trips",
      sheetName: TABLES.trips.sheetName,
      handler: handleTripsOnEdit_
    },
    {
      moduleName: "Subcon Payables",
      sheetName: TABLES.subconPayables.sheetName,
      handler: handleSubconPayablesOnEdit_
    },
    {
      moduleName: "Subcon Deductions",
      sheetName: TABLES.subconDeductions.sheetName,
      handler: handleSubconDeductionsOnEdit_
    },
    {
      moduleName: "Billing",
      sheetName: TABLES.billing.sheetName,
      handler: handleBillingOnEdit_
    }
  ];

  return modules.find(module => module.sheetName === sheetName);
}


function runOnEditHandler_(moduleName, handler, e) {
  try {
    handler(e);

  } catch (error) {
    showToast_(
      `${moduleName}: ${error.message}`,
      "On Edit Error"
    );

    throw error;
  }
}
