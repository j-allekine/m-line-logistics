function saveSubconPayablesCache_(items) {
  const cacheItems = normalizeSubconPayablesCacheItems_(items);

  PropertiesService
    .getDocumentProperties()
    .setProperty(
      APP_SETTINGS.subconPayablesCacheKey,
      JSON.stringify(cacheItems)
    );

  return cacheItems;
}


function getSubconPayablesCache_() {
  const rawValue = PropertiesService
    .getDocumentProperties()
    .getProperty(APP_SETTINGS.subconPayablesCacheKey);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return normalizeSubconPayablesCacheItems_(parsedValue);

  } catch (error) {
    clearSubconPayablesCache_();
    return [];
  }
}


function clearSubconPayablesCache_() {
  PropertiesService
    .getDocumentProperties()
    .deleteProperty(APP_SETTINGS.subconPayablesCacheKey);
}


function normalizeSubconPayablesCacheItems_(items) {
  if (!items || items.length === 0) {
    return [];
  }

  return items
    .map(item => {
      return {
        tripId: normalizeText_(item.tripId),
        payableStatus: normalizeStatus_(
          item.payableStatus || APP_SETTINGS.defaultSubconPayableStatus
        ),
        subconPaymentRef: normalizeText_(item.subconPaymentRef),
        subconPaymentDate: normalizeSubconPaymentDateKey_(
          item.subconPaymentDate
        )
      };
    })
    .filter(item => item.tripId);
}


function buildSubconPayablesCacheMap_(items) {
  const map = {};

  normalizeSubconPayablesCacheItems_(items).forEach(item => {
    map[item.tripId] = item;
  });

  return map;
}


function normalizeSubconPaymentDateKey_(value) {
  const date = toDateOnly_(value);

  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}