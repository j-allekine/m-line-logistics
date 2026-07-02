function objectToTableRow_(tableInfo, rowObject) {
  const row = Array(tableInfo.lastColumn).fill("");

  Object.entries(tableInfo.fields).forEach(([fieldKey, headerName]) => {
    const column = tableInfo.headerMap[normalizeHeader_(headerName)];

    if (!column) return;

    row[column - 1] =
      rowObject[fieldKey] === undefined || rowObject[fieldKey] === null
        ? ""
        : rowObject[fieldKey];
  });

  return row;
}


function objectsToTableRows_(tableInfo, rowObjects) {
  if (!rowObjects || rowObjects.length === 0) {
    return [];
  }

  return rowObjects.map(rowObject => objectToTableRow_(tableInfo, rowObject));
}


function appendRowsToNextBlank_(tableInfo, rows) {
  if (!rows || rows.length === 0) {
    return {
      startRow: null,
      rowsWritten: 0
    };
  }

  const startRow = getNextBlankRow_(tableInfo);

  tableInfo.sheet
    .getRange(startRow, 1, rows.length, tableInfo.lastColumn)
    .setValues(rows);

  return {
    startRow,
    rowsWritten: rows.length
  };
}


function appendObjectsToTable_(tableInfo, rowObjects) {
  const rows = objectsToTableRows_(tableInfo, rowObjects);

  return appendRowsToNextBlank_(tableInfo, rows);
}


function replaceTableData_(tableInfo, rowObjects) {
  clearTableData_(tableInfo);

  if (!rowObjects || rowObjects.length === 0) {
    return {
      startRow: null,
      rowsWritten: 0
    };
  }

  return appendObjectsToTable_(tableInfo, rowObjects);
}


function getNextBlankRow_(tableInfo) {
  const firstFieldKey = Object.keys(tableInfo.fields)[0];
  const firstColumn = getColumnByField_(tableInfo, firstFieldKey);
  const lastRow = tableInfo.sheet.getLastRow();

  if (lastRow < tableInfo.firstDataRow) {
    return tableInfo.firstDataRow;
  }

  const numRows = lastRow - tableInfo.firstDataRow + 1;

  const values = tableInfo.sheet
    .getRange(tableInfo.firstDataRow, firstColumn, numRows, 1)
    .getValues();

  for (let i = 0; i < values.length; i++) {
    if (isBlankValue_(values[i][0])) {
      return tableInfo.firstDataRow + i;
    }
  }

  return lastRow + 1;
}


function deleteTableRowsAndAddBottomRows_(tableInfo, rowNumbers) {
  if (!rowNumbers || rowNumbers.length === 0) return 0;

  const uniqueRows = [...new Set(rowNumbers)]
    .filter(rowNumber => rowNumber >= tableInfo.firstDataRow)
    .sort((a, b) => b - a);

  if (uniqueRows.length === 0) return 0;

  uniqueRows.forEach(rowNumber => {
    tableInfo.sheet.deleteRow(rowNumber);
  });

  tableInfo.sheet.insertRowsAfter(
    tableInfo.sheet.getMaxRows(),
    uniqueRows.length
  );

  return uniqueRows.length;
}


function clearTableRowFields_(tableInfo, rowNumber, fieldKeys) {
  if (!fieldKeys || fieldKeys.length === 0) return 0;

  const columns = fieldKeys.map(fieldKey =>
    getColumnByField_(tableInfo, fieldKey)
  );

  return clearTableRowColumns_(tableInfo, rowNumber, columns);
}


function clearTableRowsFields_(tableInfo, rowNumbers, fieldKeys) {
  if (!rowNumbers || rowNumbers.length === 0) return 0;
  if (!fieldKeys || fieldKeys.length === 0) return 0;

  let clearedCells = 0;

  rowNumbers.forEach(rowNumber => {
    clearedCells += clearTableRowFields_(tableInfo, rowNumber, fieldKeys);
  });

  return clearedCells;
}


function clearTableRowHeaders_(tableInfo, rowNumber, headers) {
  if (!headers || headers.length === 0) return 0;

  const columns = headers.map(header =>
    getColumnByHeader_(tableInfo, header)
  );

  return clearTableRowColumns_(tableInfo, rowNumber, columns);
}


function clearTableRowColumns_(tableInfo, rowNumber, columns) {
  if (!columns || columns.length === 0) return 0;

  columns.forEach(column => {
    tableInfo.sheet.getRange(rowNumber, column).clearContent();
  });

  return columns.length;
}


function setTableCellByField_(tableInfo, rowNumber, fieldKey, value) {
  const column = getColumnByField_(tableInfo, fieldKey);

  tableInfo.sheet.getRange(rowNumber, column).setValue(value);
}


function setTableCellByHeader_(tableInfo, rowNumber, headerName, value) {
  const column = getColumnByHeader_(tableInfo, headerName);

  tableInfo.sheet.getRange(rowNumber, column).setValue(value);
}


function writeTableRowObject_(tableInfo, rowNumber, rowObject) {
  const row = objectToTableRow_(tableInfo, rowObject);

  tableInfo.sheet
    .getRange(rowNumber, 1, 1, tableInfo.lastColumn)
    .setValues([row]);
}


function clearTableData_(tableInfo) {
  const lastRow = tableInfo.sheet.getLastRow();

  if (lastRow < tableInfo.firstDataRow) {
    return 0;
  }

  const numRows = lastRow - tableInfo.firstDataRow + 1;

  tableInfo.sheet
    .getRange(tableInfo.firstDataRow, 1, numRows, tableInfo.lastColumn)
    .clearContent();

  return numRows;
}