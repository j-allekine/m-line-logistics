function generateNextTripIds_(count) {
  const tripsDbTable = getTableInfo_("tripsDb");

  return generateNextIds_(
    tripsDbTable,
    "tripId",
    APP_SETTINGS.tripIdPrefix,
    APP_SETTINGS.tripIdDigits,
    count
  );
}


function generateNextIds_(tableInfo, idFieldKey, prefix, digits, count) {
  if (!count || count <= 0) return [];

  const maxIdNumber = getMaxIdNumber_(tableInfo, idFieldKey, prefix);
  const ids = [];

  for (let i = 1; i <= count; i++) {
    ids.push(formatId_(prefix, maxIdNumber + i, digits));
  }

  return ids;
}


function getNextId_(tableInfo, idFieldKey, prefix, digits) {
  return generateNextIds_(tableInfo, idFieldKey, prefix, digits, 1)[0];
}


function getMaxIdNumber_(tableInfo, idFieldKey, prefix) {
  const records = getTableRecords_(tableInfo);
  let maxNumber = 0;

  records.forEach(record => {
    const idValue = record[idFieldKey];
    const idNumber = extractIdNumber_(idValue, prefix);

    if (idNumber > maxNumber) {
      maxNumber = idNumber;
    }
  });

  return maxNumber;
}


function extractIdNumber_(idValue, prefix) {
  const text = normalizeText_(idValue);

  if (!text || !text.startsWith(prefix)) {
    return 0;
  }

  const numericPart = text.slice(prefix.length);
  const number = Number(numericPart);

  return Number.isFinite(number) ? number : 0;
}


function formatId_(prefix, number, digits) {
  return prefix + String(number).padStart(digits, "0");
}