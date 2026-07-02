function saveBillingCache_(items) {
  const cacheItems = normalizeBillingCacheItems_(items);

  PropertiesService
    .getDocumentProperties()
    .setProperty(
      APP_SETTINGS.billingCacheKey,
      JSON.stringify(cacheItems)
    );

  return cacheItems;
}


function getBillingCache_() {
  const rawValue = PropertiesService
    .getDocumentProperties()
    .getProperty(APP_SETTINGS.billingCacheKey);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return normalizeBillingCacheItems_(parsedValue);

  } catch (error) {
    clearBillingCache_();
    return [];
  }
}


function clearBillingCache_() {
  PropertiesService
    .getDocumentProperties()
    .deleteProperty(APP_SETTINGS.billingCacheKey);
}


function normalizeBillingCacheItems_(items) {
  if (!items || items.length === 0) {
    return [];
  }

  return items
    .map(item => {
      return {
        tripId: normalizeText_(item.tripId),
        billingStatus: normalizeBillingStatusValue_(item.billingStatus),
        billingRef: normalizeText_(item.billingRef),
        billingDate: normalizeBillingDateKey_(item.billingDate),
        paymentRef: normalizeText_(item.paymentRef),
        paymentDate: normalizeBillingDateKey_(item.paymentDate)
      };
    })
    .filter(item => item.tripId);
}


function buildBillingCacheMap_(items) {
  const map = {};

  normalizeBillingCacheItems_(items).forEach(item => {
    map[item.tripId] = item;
  });

  return map;
}


function normalizeBillingDateKey_(value) {
  const date = toDateOnly_(value);

  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}