function validateTripsPostPayload_(payload) {
  if (!payload) {
    throw new Error("No trip payload found.");
  }

  if (!payload.items || payload.items.length === 0) {
    throw new Error("No trips found for posting.");
  }

  payload.items.forEach(item => validateSingleTripPostItem_(item));

  if (APP_SETTINGS.preventDuplicateReferenceNo) {
    validateNoDuplicateTripReferenceNos_(payload.items);
  }

  return true;
}


function validateSingleTripPostItem_(item) {
  const tripStatus = normalizeText_(item.tripStatus);

  validateTripPostStatus_(tripStatus, item);
  validateCompletedTripPostItem_(item);

  return true;
}


function validateTripPostStatus_(tripStatus, item) {
  if (!APP_SETTINGS.postStatuses.includes(tripStatus)) {
    throw new Error(
      `${getTripDisplayLabel_(item)}: Only Completed trips can be posted to the Database.`
    );
  }
}


function validateCompletedTripPostItem_(item) {
  requireTripValue_(item, "referenceNo");
  requireTripValue_(item, "date");
  requireTripValue_(item, "arrivalDate");

  requireTripValue_(item, "customerName");
  requireTripValue_(item, "shipmentDocs");
  requireTripValue_(item, "totalQty");
  requireTripValue_(item, "route");

  requireTripValue_(item, "plateNo");
  requireTripValue_(item, "driverName");
  requireTripValue_(item, "vehicleType");
  requireTripValue_(item, "fuelBracket");

  requireTripValue_(item, "alaskaRate");
  requireTripValue_(item, "tripEarnings");
  requireTripValue_(item, "fuelSubsidy");
  requireTripValue_(item, "grossEarnings");

  validateTripDateSequence_(item);
  validateTripTotalQty_(item);

  if (toBoolean_(item.isSubcon)) {
    validateSubconTripFields_(item);
  }

  return true;
}


function validateTripTotalQty_(item) {
  const fields = TABLE_FIELDS.trips;
  const totalQty = toNumber_(item.totalQty);

  if (totalQty <= 0) {
    throw new Error(
      `${getTripDisplayLabel_(item)}: ${fields.totalQty} must be greater than 0.`
    );
  }

  return true;
}


function validateSubconTripFields_(item) {
  const fields = TABLE_FIELDS.trips;

  requireTripValue_(item, "subconName");
  requireTripValue_(item, "subconRate");
  requireTripValue_(item, "commissionAmount");
  requireTripValue_(item, "totalSubconEarnings");

  const subconRate = toNumber_(item.subconRate);
  const totalSubconEarnings = toNumber_(item.totalSubconEarnings);

  if (subconRate <= 0) {
    throw new Error(
      `${getTripDisplayLabel_(item)}: ${fields.subconRate} must be greater than 0.`
    );
  }

  if (totalSubconEarnings <= 0) {
    throw new Error(
      `${getTripDisplayLabel_(item)}: ${fields.totalSubconEarnings} must be greater than 0.`
    );
  }

  return true;
}


function validateTripDateSequence_(item) {
  const fields = TABLE_FIELDS.trips;

  const deliveryDate = parseTripDateValue_(
    item.date,
    fields.date,
    item
  );

  const arrivalDate = parseTripDateValue_(
    item.arrivalDate,
    fields.arrivalDate,
    item
  );

  if (arrivalDate.getTime() < deliveryDate.getTime()) {
    throw new Error(
      `${getTripDisplayLabel_(item)}: ${fields.arrivalDate} cannot be earlier than ${fields.date}.`
    );
  }

  return true;
}


function parseTripDateValue_(value, fieldLabel, item) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const parsedDate = new Date(value);

  if (!isNaN(parsedDate.getTime())) {
    return new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate()
    );
  }

  throw new Error(
    `${getTripDisplayLabel_(item)}: ${fieldLabel} must be a valid date.`
  );
}


function validateNoDuplicateTripReferenceNos_(items) {
  const fields = TABLE_FIELDS.trips;
  const existingReferenceNos = getExistingTripsDbReferenceNos_();
  const seenInPayload = new Set();

  items.forEach(item => {
    const referenceNo = normalizeText_(item.referenceNo);

    if (!referenceNo) return;

    const normalizedReferenceNo = referenceNo.toLowerCase();

    if (existingReferenceNos.has(normalizedReferenceNo)) {
      throw new Error(
        `${getTripDisplayLabel_(item)}: ${fields.referenceNo} already exists in the Database: ${referenceNo}`
      );
    }

    if (seenInPayload.has(normalizedReferenceNo)) {
      throw new Error(
        `${getTripDisplayLabel_(item)}: Duplicate ${fields.referenceNo} found: ${referenceNo}`
      );
    }

    seenInPayload.add(normalizedReferenceNo);
  });

  return true;
}


function getExistingTripsDbReferenceNos_() {
  const tripsDbTable = getTableInfo_("tripsDb");
  const tripsDbRecords = getTableRecords_(tripsDbTable);
  const referenceNos = new Set();

  tripsDbRecords.forEach(record => {
    const referenceNo = normalizeText_(record.referenceNo);

    if (referenceNo) {
      referenceNos.add(referenceNo.toLowerCase());
    }
  });

  return referenceNos;
}


function requireTripValue_(item, fieldKey) {
  const fields = TABLE_FIELDS.trips;
  const value = item[fieldKey];
  const fieldLabel = fields[fieldKey];

  if (isBlankValue_(value)) {
    throw new Error(
      `${getTripDisplayLabel_(item)}: ${fieldLabel} is required.`
    );
  }

  return true;
}


function getTripDisplayLabel_(item) {
  const tripNo = normalizeText_(item.rowNo);

  if (tripNo) {
    return `Trip #${tripNo}`;
  }

  return "Selected trip";
}