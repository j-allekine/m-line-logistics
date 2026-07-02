function postCompletedTrips(options) {
  const opts = options || {};
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    const tripsTable = getTableInfo_("trips");
    const tripsRecords = getTableRecords_(tripsTable);
    const itemsToPost = tripsRecords.filter(record =>
      APP_SETTINGS.postStatuses.includes(normalizeText_(record.tripStatus))
    );

    const payload = {
      source: "manual",
      items: itemsToPost
    };

    postTripsPayload_(payload, opts);

  } catch (error) {
    if (opts.showErrorToast !== false) {
      showToast_(error.message, "Post Trips Failed");
    }

    throw error;

  } finally {
    lock.releaseLock();
  }
}


function postTripFromRow_(rowNumber, options) {
  const opts = options || {};
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    const tripsTable = getTableInfo_("trips");

    if (rowNumber < tripsTable.firstDataRow) {
      return;
    }

    const item = getRowObject_(tripsTable, rowNumber);
    const tripStatus = normalizeText_(item.tripStatus);

    if (!APP_SETTINGS.postStatuses.includes(tripStatus)) {
      return;
    }

    const payload = {
      source: "onEdit",
      items: [item]
    };

    postTripsPayload_(payload, opts);

  } catch (error) {
    if (opts.showErrorToast !== false) {
      showToast_(error.message, "Post Trip Failed");
    }

    throw error;

  } finally {
    lock.releaseLock();
  }
}


function postTripsPayload_(payload, options) {
  const opts = options || {};

  validateTripsPostPayload_(payload);

  const tripsTable = getTableInfo_("trips");
  const tripsDbTable = getTableInfo_("tripsDb");

  const tripIds = generateNextTripIds_(payload.items.length);
  const postedAt = new Date();

  const tripsDbObjects = buildTripsDbObjects_(
    payload.items,
    tripIds,
    postedAt
  );

  appendObjectsToTable_(tripsDbTable, tripsDbObjects);

  if (APP_SETTINGS.clearPostedRows) {
    deletePostedTripRowsFromWorkingTable_(tripsTable, payload.items);
  }

  if (opts.showSuccessToast !== false) {
    showToast_(
      `${payload.items.length} trip/s successfully posted to the Database.`,
      "Trip Posted"
    );
  }
}


function buildTripsDbObjects_(items, tripIds, postedAt) {
  return items.map((item, index) => {
    return {
      tripId: tripIds[index],

      referenceNo: item.referenceNo,
      date: item.date,
      arrivalDate: item.arrivalDate,
      customerName: item.customerName,
      shipmentDocs: item.shipmentDocs,
      totalQty: item.totalQty,
      route: item.route,

      plateNo: formatPlateNoForPosting_(item.plateNo),
      driverName: formatDriverNameForPosting_(item.driverName),
      vehicleType: item.vehicleType,
      fuelBracket: item.fuelBracket,
      fuelPercent: getFuelPercentFromTrip_(item),

      isSubcon: item.isSubcon,
      subconName: item.subconName,
      subconRate: item.subconRate,
      commissionAmount: item.commissionAmount,
      totalSubconEarnings: item.totalSubconEarnings,

      alaskaRate: item.alaskaRate,
      tripEarnings: item.tripEarnings,
      fuelSubsidy: item.fuelSubsidy,
      grossEarnings: item.grossEarnings,

      postedAt: postedAt,

      subconPayableStatus: APP_SETTINGS.defaultSubconPayableStatus,
      subconPaymentRef: "",
      subconPaymentDate: "",

      billingStatus: APP_SETTINGS.defaultBillingStatus,
      billingRef: "",
      billingDate: "",
      paymentRef: "",
      paymentDate: ""
    };
  });
}


function getFuelPercentFromTrip_(item) {
  const alaskaRate = toNumber_(item.alaskaRate);
  const fuelSubsidy = toNumber_(item.fuelSubsidy);

  if (alaskaRate <= 0 || fuelSubsidy <= 0) {
    return "";
  }

  return fuelSubsidy / alaskaRate;
}


function formatPlateNoForPosting_(value) {
  return normalizeText_(value).toUpperCase();
}


function formatDriverNameForPosting_(value) {
  const text = normalizeText_(value).toLowerCase();

  if (!text) {
    return "";
  }

  return text.replace(/\b[a-z]/g, character => character.toUpperCase());
}


function deletePostedTripRowsFromWorkingTable_(tripsTable, items) {
  const rowNumbers = items
    .map(item => item.__rowNumber)
    .filter(Boolean);

  if (rowNumbers.length === 0) {
    return 0;
  }

  return deleteTableRowsAndAddBottomRows_(tripsTable, rowNumbers);
}