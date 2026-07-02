function handleBillingOnEdit_(e) {
  if (!e || !e.range) return;

  const editedRange = e.range;

  if (editedRange.getNumRows() !== 1 || editedRange.getNumColumns() !== 1) {
    return;
  }

  const ranges = NAMED_RANGES.billing;

  const loadRange = getNamedRange_(ranges.load);
  const updateRange = getNamedRange_(ranges.update);

  if (isSameRange_(editedRange, loadRange) && e.value === "TRUE") {
    handleBillingLoadClick_();
    return;
  }

  if (isSameRange_(editedRange, updateRange) && e.value === "TRUE") {
    handleBillingUpdateClick_();
    return;
  }
}


function handleBillingLoadClick_() {
  const ranges = NAMED_RANGES.billing;

  try {
    showToast_("🚀 Loading billing records, please wait...", "Billing");

    loadBilling_();

  } catch (error) {
    showToast_(`❌ ${error.message}`, "Load Billing Failed");
    throw error;

  } finally {
    resetBillingCheckbox_(ranges.load);
  }
}


function handleBillingUpdateClick_() {
  const ranges = NAMED_RANGES.billing;

  try {
    showToast_("🚀 Checking billing changes...", "Billing");

    updateBilling_();

  } catch (error) {
    showToast_(`❌ ${error.message}`, "Update Billing Failed");
    throw error;

  } finally {
    resetBillingCheckbox_(ranges.update);
  }
}


function resetBillingCheckbox_(namedRangeName) {
  const range = getNamedRange_(namedRangeName);

  range.setValue(false);

  SpreadsheetApp.flush();
}