function loadBilling_() {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    showToast_("🚀 Loading billing records...", "Billing");

    const filters = getBillingLoadFilters_();
    const tripsDbTable = getTableInfo_("tripsDb");
    const billingTable = getTableInfo_("billing");

    const tripsDbRecords = getTableRecords_(tripsDbTable);

    const billingItems = tripsDbRecords
      .filter(record => isBillingRecordMatch_(record, filters))
      .sort(sortBillingByDeliveryDate_)
      .map(record => buildBillingRowObject_(record));

    replaceTableData_(billingTable, billingItems);
    saveBillingCache_(billingItems);

    showToast_(
      `✅ ${billingItems.length} billing record/s loaded.`,
      "Billing"
    );

    return billingItems;

  } catch (error) {
    showToast_(`❌ ${error.message}`, "Load Billing Failed");
    throw error;

  } finally {
    lock.releaseLock();
  }
}


function getBillingLoadFilters_() {
  const ranges = NAMED_RANGES.billing;

  return {
    billingStatus: normalizeBillingStatusFilter_(
      getNamedRangeValue_(ranges.status)
    ),
    dateFrom: toDateOnly_(
      getNamedRangeValue_(ranges.dateFrom)
    ),
    dateTo: toDateOnly_(
      getNamedRangeValue_(ranges.dateTo)
    )
  };
}


function normalizeBillingStatusFilter_(value) {
  const status = normalizeStatus_(value);

  if (!status || status === APP_SETTINGS.billingAllStatus) {
    return "";
  }

  return status;
}


function isBillingRecordMatch_(record, filters) {
  const tripId = normalizeText_(record.tripId);

  if (!tripId) {
    return false;
  }

  const deliveryDate = toDateOnly_(record.date);

  if (!deliveryDate) {
    return false;
  }

  if (
    filters.dateFrom &&
    deliveryDate.getTime() < filters.dateFrom.getTime()
  ) {
    return false;
  }

  if (
    filters.dateTo &&
    deliveryDate.getTime() > filters.dateTo.getTime()
  ) {
    return false;
  }

  const recordStatus = getDisplayBillingStatus_(record.billingStatus);

  if (
    filters.billingStatus &&
    recordStatus !== filters.billingStatus
  ) {
    return false;
  }

  return true;
}


function buildBillingRowObject_(record) {
  return {
    tripId: record.tripId,
    referenceNo: record.referenceNo,
    shipmentDocs: record.shipmentDocs,
    date: record.date,
    customerName: record.customerName,
    route: record.route,
    totalQty: record.totalQty,
    plateNo: record.plateNo,
    driverName: record.driverName,
    vehicleType: record.vehicleType,
    subconName: record.subconName,
    alaskaRate: record.alaskaRate,
    fuelSubsidy: record.fuelSubsidy,
    grossEarnings: record.grossEarnings,
    billingAmount: calculateBillingAmount_(record),
    billingStatus: getDisplayBillingStatus_(record.billingStatus),
    billingRef: record.billingRef,
    billingDate: record.billingDate,
    paymentRef: record.paymentRef,
    paymentDate: record.paymentDate
  };
}


function getDisplayBillingStatus_(status) {
  const normalizedStatus = normalizeBillingStatusValue_(status);

  if (!normalizedStatus) {
    return APP_SETTINGS.defaultBillingStatus;
  }

  return normalizedStatus;
}


function sortBillingByDeliveryDate_(a, b) {
  const dateA = toDateOnly_(a.date);
  const dateB = toDateOnly_(b.date);

  const timeA = dateA ? dateA.getTime() : 0;
  const timeB = dateB ? dateB.getTime() : 0;

  if (timeA !== timeB) {
    return timeA - timeB;
  }

  return normalizeText_(a.tripId).localeCompare(
    normalizeText_(b.tripId)
  );
}

function calculateBillingAmount_(record) {
  return Number(record.alaskaRate || 0) + Number(record.fuelSubsidy || 0);
}