function validateSubconPayablesUpdate_(currentItems, tripsDbRecords, cachedItems) {
  if (!currentItems || currentItems.length === 0) {
    throw new Error("No subcon payable records found to update.");
  }

  if (!cachedItems || cachedItems.length === 0) {
    throw new Error("No loaded cache found. Please click Load first before updating.");
  }

  validateNoDuplicateSubconPayableTripIds_(currentItems);
  validateSubconPayablesExistInCache_(currentItems, cachedItems);
  validateSubconPayablesExistInTripsDb_(currentItems, tripsDbRecords);
  validateSubconPayableStatusRules_(currentItems);

  return true;
}


function validateNoDuplicateSubconPayableTripIds_(items) {
  const seenTripIds = new Set();

  items.forEach(item => {
    const tripId = normalizeText_(item.tripId);

    if (!tripId) {
      throw new Error("Trip ID is required in the Subcon Payables table.");
    }

    const normalizedTripId = tripId.toLowerCase();

    if (seenTripIds.has(normalizedTripId)) {
      throw new Error(`Duplicate Trip ID found in Subcon Payables table: ${tripId}`);
    }

    seenTripIds.add(normalizedTripId);
  });

  return true;
}


function validateSubconPayablesExistInCache_(currentItems, cachedItems) {
  const cacheMap = buildSubconPayablesCacheMap_(cachedItems);

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


function validateSubconPayablesExistInTripsDb_(currentItems, tripsDbRecords) {
  const tripsDbMap = buildTripsDbRecordMapByTripId_(tripsDbRecords);

  currentItems.forEach(item => {
    const tripId = normalizeText_(item.tripId);

    if (!tripsDbMap[tripId]) {
      throw new Error(`Trip ID not found in TripsDB: ${tripId}`);
    }
  });

  return true;
}


function validateSubconPayableStatusRules_(items) {
  items.forEach(item => {
    const status = normalizeSubconPayableStatusValue_(item.payableStatus);
    const label = getSubconPayableDisplayLabel_(item);

    validateSubconPayableStatusValue_(status, label);

    const paymentRef = normalizeText_(item.subconPaymentRef);
    const paymentDateValue = item.subconPaymentDate;
    const paymentDate = toDateOnly_(paymentDateValue);

    if (status === "UNPAID") {
      validateUnpaidSubconPayableRecord_(
        paymentRef,
        paymentDateValue,
        label
      );
      return;
    }

    if (status === "PAID") {
      validatePaidSubconPayableRecord_(
        paymentRef,
        paymentDate,
        paymentDateValue,
        label
      );
    }
  });

  return true;
}


function validateSubconPayableStatusValue_(status, label) {
  if (!status) {
    throw new Error(`${label}: Payable Status is required.`);
  }

  if (!["UNPAID", "PAID"].includes(status)) {
    throw new Error(`${label}: Payable Status must be UNPAID or PAID.`);
  }

  return true;
}


function validateUnpaidSubconPayableRecord_(
  paymentRef,
  paymentDateValue,
  label
) {
  const hasPaymentDetails =
    paymentRef ||
    !isBlankValue_(paymentDateValue);

  if (hasPaymentDetails) {
    throw new Error(
      `${label}: To set this record to UNPAID, please clear the payment details.`
    );
  }

  return true;
}


function validatePaidSubconPayableRecord_(
  paymentRef,
  paymentDate,
  paymentDateValue,
  label
) {
  if (!paymentRef || isBlankValue_(paymentDateValue) || !paymentDate) {
    throw new Error(
      `${label}: To set this record to PAID, payment details must not be blank.`
    );
  }

  return true;
}


function normalizeSubconPayableStatusValue_(value) {
  const status = normalizeStatus_(value);

  if (!status) {
    return APP_SETTINGS.defaultSubconPayableStatus;
  }

  return status;
}


function getSubconPayableDisplayLabel_(item) {
  const referenceNo = normalizeText_(item.referenceNo);
  const tripId = normalizeText_(item.tripId);

  if (referenceNo) {
    return `Reference ${referenceNo}`;
  }

  if (tripId) {
    return `Trip ${tripId}`;
  }

  return "Subcon payable record";
}


function buildTripsDbRecordMapByTripId_(records) {
  const map = {};

  if (!records || records.length === 0) {
    return map;
  }

  records.forEach(record => {
    const tripId = normalizeText_(record.tripId);

    if (tripId) {
      map[tripId] = record;
    }
  });

  return map;
}