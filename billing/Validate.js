function validateBillingUpdate_(currentItems, tripsDbRecords, cachedItems) {
  if (!currentItems || currentItems.length === 0) {
    throw new Error("No billing records found to update.");
  }

  if (!cachedItems || cachedItems.length === 0) {
    throw new Error("No loaded cache found. Please click Load first before updating.");
  }

  validateNoDuplicateBillingTripIds_(currentItems);
  validateBillingRecordsExistInCache_(currentItems, cachedItems);
  validateBillingRecordsExistInTripsDb_(currentItems, tripsDbRecords);
  validateBillingStatusRules_(currentItems);

  return true;
}


function validateNoDuplicateBillingTripIds_(items) {
  const seenTripIds = new Set();

  items.forEach(item => {
    const tripId = normalizeText_(item.tripId);

    if (!tripId) {
      throw new Error("Trip ID is required in the Billing table.");
    }

    const normalizedTripId = tripId.toLowerCase();

    if (seenTripIds.has(normalizedTripId)) {
      throw new Error(`Duplicate Trip ID found in Billing table: ${tripId}`);
    }

    seenTripIds.add(normalizedTripId);
  });

  return true;
}


function validateBillingRecordsExistInCache_(currentItems, cachedItems) {
  const cacheMap = buildBillingCacheMap_(cachedItems);

  currentItems.forEach(item => {
    const tripId = normalizeText_(item.tripId);

    if (!cacheMap[tripId]) {
      throw new Error(
        `Trip ID was not part of the loaded cache: ${tripId}. Please click Load again before updating.`
      );
    }
  });

  return true;
}


function validateBillingRecordsExistInTripsDb_(currentItems, tripsDbRecords) {
  const tripsDbMap = buildTripsDbRecordMapByTripId_(tripsDbRecords);

  currentItems.forEach(item => {
    const tripId = normalizeText_(item.tripId);

    if (!tripsDbMap[tripId]) {
      throw new Error(`Trip ID not found in TripsDB: ${tripId}`);
    }
  });

  return true;
}


function validateBillingStatusRules_(items) {
  items.forEach(item => {
    const status = normalizeBillingStatusValue_(item.billingStatus);
    const label = getBillingRecordDisplayLabel_(item);

    validateBillingStatusValue_(status, label);

    const billingRef = normalizeText_(item.billingRef);
    const billingDateValue = item.billingDate;
    const billingDate = toDateOnly_(billingDateValue);

    const paymentRef = normalizeText_(item.paymentRef);
    const paymentDateValue = item.paymentDate;
    const paymentDate = toDateOnly_(paymentDateValue);

    if (status === "UNBILLED") {
      validateUnbilledBillingRecord_(
        billingRef,
        billingDateValue,
        paymentRef,
        paymentDateValue,
        label
      );
      return;
    }

    if (status === "BILLED") {
      validateBilledBillingRecord_(
        billingRef,
        billingDate,
        billingDateValue,
        paymentRef,
        paymentDateValue,
        label
      );
      return;
    }

    if (status === "PAID") {
      validatePaidBillingRecord_(
        billingRef,
        billingDate,
        billingDateValue,
        paymentRef,
        paymentDate,
        paymentDateValue,
        label
      );
    }
  });

  return true;
}


function validateBillingStatusValue_(status, label) {
  if (!status) {
    throw new Error(`${label}: Billing Status is required.`);
  }

  if (!APP_SETTINGS.billingStatuses.includes(status)) {
    throw new Error(`${label}: Billing Status must be UNBILLED, BILLED, or PAID.`);
  }

  return true;
}


function validateUnbilledBillingRecord_(
  billingRef,
  billingDateValue,
  paymentRef,
  paymentDateValue,
  label
) {
  const hasBillingDetails =
    billingRef ||
    !isBlankValue_(billingDateValue) ||
    paymentRef ||
    !isBlankValue_(paymentDateValue);

  if (hasBillingDetails) {
    throw new Error(
      `${label}: To set this record to UNBILLED, please clear the billing details.`
    );
  }

  return true;
}


function validateBilledBillingRecord_(
  billingRef,
  billingDate,
  billingDateValue,
  paymentRef,
  paymentDateValue,
  label
) {
  if (!billingRef || isBlankValue_(billingDateValue) || !billingDate) {
    throw new Error(
      `${label}: To set this record to BILLED, billing details must not be blank.`
    );
  }

  if (paymentRef || !isBlankValue_(paymentDateValue)) {
    throw new Error(
      `${label}: To keep this record as BILLED, please clear the payment details.`
    );
  }

  return true;
}


function validatePaidBillingRecord_(
  billingRef,
  billingDate,
  billingDateValue,
  paymentRef,
  paymentDate,
  paymentDateValue,
  label
) {
  if (!billingRef || isBlankValue_(billingDateValue) || !billingDate) {
    throw new Error(
      `${label}: To set this record to PAID, billing details must not be blank.`
    );
  }

  if (!paymentRef || isBlankValue_(paymentDateValue) || !paymentDate) {
    throw new Error(
      `${label}: To set this record to PAID, payment details must not be blank.`
    );
  }

  return true;
}


function normalizeBillingStatusValue_(value) {
  return normalizeStatus_(value);
}


function getBillingRecordDisplayLabel_(item) {
  const referenceNo = normalizeText_(item.referenceNo);
  const tripId = normalizeText_(item.tripId);

  if (referenceNo) {
    return `Reference ${referenceNo}`;
  }

  if (tripId) {
    return `Trip ${tripId}`;
  }

  return "Billing record";
}