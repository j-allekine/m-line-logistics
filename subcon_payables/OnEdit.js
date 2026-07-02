function handleSubconPayablesOnEdit_(e) {
  if (!e || !e.range) return;

  const editedRange = e.range;

  if (editedRange.getNumRows() !== 1 || editedRange.getNumColumns() !== 1) {
    return;
  }

  const ranges = NAMED_RANGES.subconPayables;

  const loadRange = getNamedRange_(ranges.load);
  const updateRange = getNamedRange_(ranges.update);

  if (isSameRange_(editedRange, loadRange) && e.value === "TRUE") {
    handleSubconPayablesLoadClick_();
    return;
  }

  if (isSameRange_(editedRange, updateRange) && e.value === "TRUE") {
    handleSubconPayablesUpdateClick_();
    return;
  }
}


function handleSubconPayablesLoadClick_() {
  const ranges = NAMED_RANGES.subconPayables;

  try {
    showToast_("🚀 Loading data, please wait...", "Subcon Payables");

    loadSubconPayables_();

  } catch (error) {
    showToast_(`❌ ${error.message}`, "Load Subcon Payables Failed");
    throw error;

  } finally {
    resetSubconPayablesCheckbox_(ranges.load);
  }
}


function handleSubconPayablesUpdateClick_() {
  const ranges = NAMED_RANGES.subconPayables;

  try {
    showToast_("🚀 Checking payable status changes...", "Subcon Payables");

    updateSubconPayables_();

  } catch (error) {
    showToast_(`❌ ${error.message}`, "Update Subcon Payables Failed");
    throw error;

  } finally {
    resetSubconPayablesCheckbox_(ranges.update);
  }
}


function resetSubconPayablesCheckbox_(namedRangeName) {
  const range = getNamedRange_(namedRangeName);

  range.setValue(false);

  SpreadsheetApp.flush();
}