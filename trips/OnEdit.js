function handleTripsOnEdit_(e) {
  if (!e || !e.range) return;

  handleTripStatusOnEdit_(e);
}


function handleTripStatusOnEdit_(e) {
  if (!e || !e.range) return;

  const editedRange = e.range;

  if (editedRange.getNumRows() !== 1 || editedRange.getNumColumns() !== 1) {
    return;
  }

  const tripsTable = getTableInfo_("trips");
  const editedSheet = editedRange.getSheet();

  if (editedSheet.getName() !== tripsTable.sheetName) {
    return;
  }

  const editedRow = editedRange.getRow();
  const editedColumn = editedRange.getColumn();

  if (editedRow < tripsTable.firstDataRow) {
    return;
  }

  const tripStatusColumn = getColumnByField_(tripsTable, "tripStatus");

  if (editedColumn !== tripStatusColumn) {
    return;
  }

  const newStatus = normalizeText_(editedRange.getValue());

  if (!APP_SETTINGS.postStatuses.includes(newStatus)) {
    return;
  }

  SpreadsheetApp.flush();

  const tripItem = getRowObject_(tripsTable, editedRow);
  const payload = {
    source: "onEditValidation",
    items: [tripItem]
  };

  const ui = SpreadsheetApp.getUi();

  try {
    validateTripsPostPayload_(payload);

  } catch (error) {
    restoreEditedStatus_(editedRange, e.oldValue);

    ui.alert(
      "Trip Posting Failed",
      buildTripPostFailedMessage_(error),
      ui.ButtonSet.OK
    );

    return;
  }

  const confirmation = ui.alert(
    "Post Trip?",
    buildTripPostConfirmationMessage_(tripItem),
    ui.ButtonSet.YES_NO
  );

  if (confirmation !== ui.Button.YES) {
    restoreEditedStatus_(editedRange, e.oldValue);
    showToast_("Trip posting cancelled. No data was posted.", "Cancelled");
    return;
  }

  try {
    postTripFromRow_(editedRow, {
      showSuccessToast: true,
      showErrorToast: false
    });

  } catch (error) {
    restoreEditedStatus_(editedRange, e.oldValue);

    ui.alert(
      "Trip Posting Failed",
      buildTripPostFailedMessage_(error),
      ui.ButtonSet.OK
    );

    throw error;
  }
}


function buildTripPostConfirmationMessage_(tripItem) {
  const tripNo = normalizeText_(tripItem.rowNo) || "Selected trip";
  const referenceNo = normalizeText_(tripItem.referenceNo) || "No reference no.";
  const customerName = normalizeText_(tripItem.customerName) || "No customer name";
  const route = normalizeText_(tripItem.route) || "No route";
  const plateNo = formatPlateNoForPosting_(tripItem.plateNo) || "No plate no.";
  const driverName = formatDriverNameForPosting_(tripItem.driverName) || "No driver name";
  const vehicleType = normalizeText_(tripItem.vehicleType) || "No vehicle type";

  return [
    "Save this trip to the Database?",
    "",
    `Trip #: ${tripNo}`,
    `Reference No.: ${referenceNo}`,
    `Customer Name: ${customerName}`,
    `Route: ${route}`,
    `Plate No.: ${plateNo}`,
    `Driver Name: ${driverName}`,
    `Vehicle Type: ${vehicleType}`,
    "",
    "This will post the trip to the Database and remove it from the working table.",
    "",
    "Continue?"
  ].join("\n");
}


function buildTripPostFailedMessage_(error) {
  return [
    "The trip was not posted.",
    "",
    "Please fix the issue below and try again:",
    "",
    error && error.message ? error.message : String(error),
    "",
    "The trip status was restored. No data was posted."
  ].join("\n");
}


function restoreEditedStatus_(editedRange, oldValue) {
  editedRange.setValue(oldValue || "");
  SpreadsheetApp.flush();
}