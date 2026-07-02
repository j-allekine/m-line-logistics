function handleSubconDeductionsOnEdit_(e) {
  if (!e || !e.range) return;

  const editedRange = e.range;
  const deductionsTable = getTableInfo_("subconDeductions");
  const editedSheet = editedRange.getSheet();

  if (editedSheet.getName() !== deductionsTable.sheetName) {
    return;
  }

  const paidColumn = getColumnByField_(deductionsTable, "isPaid");
  const editedStartColumn = editedRange.getColumn();
  const editedEndColumn = editedStartColumn + editedRange.getNumColumns() - 1;

  if (paidColumn < editedStartColumn || paidColumn > editedEndColumn) {
    return;
  }

  const invalidRows = getInvalidCheckedSubconDeductionRows_(
    deductionsTable,
    editedRange,
    paidColumn
  );

  if (invalidRows.length === 0) {
    return;
  }

  uncheckSubconDeductionPaidRows_(deductionsTable, invalidRows);

  SpreadsheetApp.getUi().alert(
    "Cannot Mark Subcon Deduction as Paid",
    buildSubconDeductionPaidValidationMessage_(invalidRows),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


function getInvalidCheckedSubconDeductionRows_(tableInfo, editedRange, paidColumn) {
  const editedValues = editedRange.getValues();
  const paidColumnOffset = paidColumn - editedRange.getColumn();
  const invalidRows = [];

  editedValues.forEach((rowValues, index) => {
    const rowNumber = editedRange.getRow() + index;

    if (rowNumber < tableInfo.firstDataRow) {
      return;
    }

    if (!toBoolean_(rowValues[paidColumnOffset])) {
      return;
    }

    const rowObject = getRowObject_(tableInfo, rowNumber);
    const missingFields = getMissingSubconDeductionPaidFields_(rowObject);

    if (missingFields.length === 0) {
      return;
    }

    invalidRows.push({
      rowNumber,
      missingFields
    });
  });

  return invalidRows;
}


function uncheckSubconDeductionPaidRows_(tableInfo, invalidRows) {
  const paidColumn = getColumnByField_(tableInfo, "isPaid");

  invalidRows.forEach(invalidRow => {
    tableInfo.sheet.getRange(invalidRow.rowNumber, paidColumn).setValue(false);
  });

  SpreadsheetApp.flush();
}
