function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}


function getSheetByName_(sheetName) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`Sheet not found: ${sheetName}`);
  }

  return sheet;
}


function getNamedRange_(name) {
  const range = getSpreadsheet_().getRangeByName(name);

  if (!range) {
    throw new Error(`Named range not found: ${name}`);
  }

  return range;
}


function getNamedRangeValue_(name) {
  return getNamedRange_(name).getValue();
}


function setNamedRangeValue_(name, value) {
  getNamedRange_(name).setValue(value);
}


function isSameRange_(rangeA, rangeB) {
  return (
    rangeA &&
    rangeB &&
    rangeA.getSheet().getSheetId() === rangeB.getSheet().getSheetId() &&
    rangeA.getRow() === rangeB.getRow() &&
    rangeA.getColumn() === rangeB.getColumn() &&
    rangeA.getNumRows() === rangeB.getNumRows() &&
    rangeA.getNumColumns() === rangeB.getNumColumns()
  );
}


function getTableConfig_(tableKey) {
  const tableConfig = TABLES[tableKey];

  if (!tableConfig) {
    throw new Error(`Table config not found: ${tableKey}`);
  }

  return tableConfig;
}


function getTableInfo_(tableKey) {
  const tableConfig = getTableConfig_(tableKey);
  const sheet = getSheetByName_(tableConfig.sheetName);
  const headerRow = findHeaderRow_(sheet, tableConfig.requiredHeaders);
  const headers = getHeaderValues_(sheet, headerRow);
  const headerMap = buildHeaderMap_(headers);

  validateRequiredHeaders_(
    tableConfig.requiredHeaders,
    headerMap,
    tableConfig.tableId
  );

  const firstDataRow =
    headerRow + (tableConfig.firstDataOffset - tableConfig.headerOffset);

  return {
    key: tableKey,
    sheet,
    sheetName: tableConfig.sheetName,
    tableId: tableConfig.tableId,
    fields: tableConfig.fields,
    requiredHeaders: tableConfig.requiredHeaders,
    headerRow,
    firstDataRow,
    lastColumn: headers.length,
    headers,
    headerMap
  };
}


function findHeaderRow_(sheet, requiredHeaders) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow === 0 || lastColumn === 0) {
    throw new Error(`Sheet is empty: ${sheet.getName()}`);
  }

  const rowsToScan = Math.min(lastRow, 100);
  const values = sheet
    .getRange(1, 1, rowsToScan, lastColumn)
    .getDisplayValues();

  for (let r = 0; r < values.length; r++) {
    const rowHeaders = values[r].map(value => normalizeHeader_(value));
    const rowSet = new Set(rowHeaders.filter(Boolean));

    const isHeaderRow = requiredHeaders.every(header =>
      rowSet.has(normalizeHeader_(header))
    );

    if (isHeaderRow) {
      return r + 1;
    }
  }

  throw new Error(
    `Header row not found in sheet "${sheet.getName()}".`
  );
}


function getHeaderValues_(sheet, headerRow) {
  return sheet
    .getRange(headerRow, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0]
    .map(value => normalizeHeader_(value));
}


function buildHeaderMap_(headers) {
  const headerMap = {};
  const duplicates = [];

  headers.forEach((header, index) => {
    if (!header) return;

    if (headerMap[header]) {
      duplicates.push(header);
      return;
    }

    headerMap[header] = index + 1;
  });

  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate header/s found: ${[...new Set(duplicates)].join(", ")}`
    );
  }

  return headerMap;
}


function validateRequiredHeaders_(requiredHeaders, headerMap, tableId) {
  const missingHeaders = requiredHeaders.filter(header => {
    return !headerMap[normalizeHeader_(header)];
  });

  if (missingHeaders.length > 0) {
    throw new Error(
      `Missing required headers in ${tableId}: ${missingHeaders.join(", ")}`
    );
  }
}


function getColumnByHeader_(tableInfo, headerName) {
  const normalizedHeader = normalizeHeader_(headerName);
  const column = tableInfo.headerMap[normalizedHeader];

  if (!column) {
    throw new Error(
      `Header not found in ${tableInfo.tableId}: ${headerName}`
    );
  }

  return column;
}


function getColumnByField_(tableInfo, fieldKey) {
  const headerName = tableInfo.fields[fieldKey];

  if (!headerName) {
    throw new Error(
      `Field key not found in ${tableInfo.tableId}: ${fieldKey}`
    );
  }

  return getColumnByHeader_(tableInfo, headerName);
}


function getRowObject_(tableInfo, rowNumber) {
  const rowValues = tableInfo.sheet
    .getRange(rowNumber, 1, 1, tableInfo.lastColumn)
    .getValues()[0];

  const record = {
    __rowNumber: rowNumber
  };

  Object.entries(tableInfo.fields).forEach(([fieldKey, headerName]) => {
    const column = tableInfo.headerMap[normalizeHeader_(headerName)];
    record[fieldKey] = column ? rowValues[column - 1] : "";
  });

  return record;
}


function getTableRecords_(tableInfo) {
  const lastRow = tableInfo.sheet.getLastRow();

  if (lastRow < tableInfo.firstDataRow) {
    return [];
  }

  const numRows = lastRow - tableInfo.firstDataRow + 1;
  const values = tableInfo.sheet
    .getRange(tableInfo.firstDataRow, 1, numRows, tableInfo.lastColumn)
    .getValues();

  const records = [];

  values.forEach((rowValues, index) => {
    const record = {
      __rowNumber: tableInfo.firstDataRow + index
    };

    Object.entries(tableInfo.fields).forEach(([fieldKey, headerName]) => {
      const column = tableInfo.headerMap[normalizeHeader_(headerName)];
      record[fieldKey] = column ? rowValues[column - 1] : "";
    });

    if (!isRecordBlank_(record, Object.keys(tableInfo.fields))) {
      records.push(record);
    }
  });

  return records;
}


function isRecordBlank_(record, fieldKeys) {
  return fieldKeys.every(fieldKey => isBlankValue_(record[fieldKey]));
}


function isBlankValue_(value) {
  return (
    value === "" ||
    value === null ||
    value === undefined ||
    value === false
  );
}


function normalizeHeader_(value) {
  return String(value || "").trim();
}


function normalizeText_(value) {
  return String(value || "").trim();
}


function normalizeStatus_(value) {
  return normalizeText_(value).toUpperCase();
}


function toBoolean_(value) {
  if (value === true) return true;
  if (value === false) return false;

  const text = normalizeText_(value).toLowerCase();

  return text === "true" || text === "yes" || text === "checked";
}


function toNumber_(value) {
  if (typeof value === "number") return value;

  const cleaned = String(value || "")
    .replace(/[₱,%\s,]/g, "");

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : 0;
}


function toDateOnly_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (isBlankValue_(value)) {
    return null;
  }

  const parsedDate = new Date(value);

  if (isNaN(parsedDate.getTime())) {
    return null;
  }

  return new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate()
  );
}


function showToast_(message, title, seconds) {
  getSpreadsheet_().toast(
    message,
    title || "M-Line Logistics",
    seconds || 5
  );
}