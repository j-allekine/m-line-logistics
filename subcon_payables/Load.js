function loadSubconPayables_() {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    showToast_("🚀 Loading subcon payable records...", "Subcon Payables");

    const filters = getSubconPayablesLoadFilters_();
    const tripsDbTable = getTableInfo_("tripsDb");
    const subconPayablesTable = getTableInfo_("subconPayables");

    const tripsDbRecords = getTableRecords_(tripsDbTable);

    const payableItems = tripsDbRecords
      .filter(record => isSubconPayableRecordMatch_(record, filters))
      .sort(sortSubconPayablesByDeliveryDate_)
      .map(record => buildSubconPayableRowObject_(record));

    replaceTableData_(subconPayablesTable, payableItems);
    saveSubconPayablesCache_(payableItems);

    showToast_(
      `✅ ${payableItems.length} subcon payable record/s loaded.`,
      "Subcon Payables"
    );

    return payableItems;

  } catch (error) {
    showToast_(`❌ ${error.message}`, "Load Subcon Payables Failed");
    throw error;

  } finally {
    lock.releaseLock();
  }
}


function getSubconPayablesLoadFilters_() {
  const ranges = NAMED_RANGES.subconPayables;

  return {
    subconName: normalizeText_(
      getNamedRangeValue_(ranges.subcon)
    ),
    dateFrom: toDateOnly_(
      getNamedRangeValue_(ranges.dateFrom)
    ),
    dateTo: toDateOnly_(
      getNamedRangeValue_(ranges.dateTo)
    )
  };
}


function isSubconPayableRecordMatch_(record, filters) {
  if (!toBoolean_(record.isSubcon)) {
    return false;
  }

  const tripId = normalizeText_(record.tripId);

  if (!tripId) {
    return false;
  }

  const recordSubconName = normalizeText_(record.subconName);
  const filterSubconName = normalizeText_(filters.subconName);

  if (
    filterSubconName &&
    recordSubconName.toLowerCase() !== filterSubconName.toLowerCase()
  ) {
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

  return true;
}


function buildSubconPayableRowObject_(record) {
  return {
    tripId: record.tripId,
    referenceNo: record.referenceNo,
    route: record.route,
    date: record.date,
    arrivalDate: record.arrivalDate,
    vehicleType: record.vehicleType,
    subconName: record.subconName,
    subconRate: record.subconRate,
    commissionAmount: record.commissionAmount,
    payableAmount: record.totalSubconEarnings,
    payableStatus: getDisplaySubconPayableStatus_(
      record.subconPayableStatus
    ),
    subconPaymentRef: record.subconPaymentRef,
    subconPaymentDate: record.subconPaymentDate
  };
}


function getDisplaySubconPayableStatus_(status) {
  const normalizedStatus = normalizeStatus_(status);

  if (!normalizedStatus) {
    return APP_SETTINGS.defaultSubconPayableStatus;
  }

  return normalizedStatus;
}


function sortSubconPayablesByDeliveryDate_(a, b) {
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