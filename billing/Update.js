function updateBilling_() {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    const billingTable = getTableInfo_("billing");
    const tripsDbTable = getTableInfo_("tripsDb");

    const currentItems = getTableRecords_(billingTable);
    const tripsDbRecords = getTableRecords_(tripsDbTable);
    const cachedItems = getBillingCache_();

    validateBillingUpdate_(
      currentItems,
      tripsDbRecords,
      cachedItems
    );

    const changes = getBillingChanges_(
      currentItems,
      cachedItems,
      tripsDbRecords
    );

    const ui = SpreadsheetApp.getUi();

    if (changes.length === 0) {
      ui.alert(
        "No Changes Made",
        "No billing changes were found.",
        ui.ButtonSet.OK
      );

      showToast_("✅ No billing changes found.", "Billing");

      return [];
    }

    const confirmation = ui.alert(
      "Update Billing?",
      buildBillingUpdateConfirmationMessage_(changes),
      ui.ButtonSet.YES_NO
    );

    if (confirmation !== ui.Button.YES) {
      showToast_("Update cancelled. No changes were saved.", "Billing");
      return [];
    }

    applyBillingChanges_(tripsDbTable, changes);

    saveBillingCache_(currentItems);

    showToast_(
      `✅ ${changes.length} billing record/s updated.`,
      "Billing"
    );

    return changes;

  } finally {
    lock.releaseLock();
  }
}


function getBillingChanges_(currentItems, cachedItems, tripsDbRecords) {
  const cacheMap = buildBillingCacheMap_(cachedItems);
  const tripsDbMap = buildTripsDbRecordMapByTripId_(tripsDbRecords);

  const changes = [];

  currentItems.forEach(item => {
    const tripId = normalizeText_(item.tripId);
    const cachedItem = cacheMap[tripId];
    const tripsDbRecord = tripsDbMap[tripId];

    if (!cachedItem || !tripsDbRecord) {
      return;
    }

    const oldValues = normalizeBillingComparableValues_(cachedItem);
    const newValues = normalizeBillingComparableValues_(item);

    if (areBillingValuesSame_(oldValues, newValues)) {
      return;
    }

    changes.push({
      tripId,
      referenceNo: item.referenceNo,

      oldBillingStatus: oldValues.billingStatus,
      oldBillingRef: oldValues.billingRef,
      oldBillingDate: oldValues.billingDate,
      oldPaymentRef: oldValues.paymentRef,
      oldPaymentDate: oldValues.paymentDate,

      newBillingStatus: newValues.billingStatus,
      newBillingRef: newValues.billingRef,
      newBillingDate: newValues.billingDate,
      newPaymentRef: newValues.paymentRef,
      newPaymentDate: newValues.paymentDate,

      rawBillingDate: item.billingDate,
      rawPaymentDate: item.paymentDate,

      tripsDbRow: tripsDbRecord.__rowNumber
    });
  });

  return changes;
}


function normalizeBillingComparableValues_(item) {
  return {
    billingStatus: normalizeBillingStatusValue_(item.billingStatus),
    billingRef: normalizeText_(item.billingRef),
    billingDate: normalizeBillingDateKey_(item.billingDate),
    paymentRef: normalizeText_(item.paymentRef),
    paymentDate: normalizeBillingDateKey_(item.paymentDate)
  };
}


function areBillingValuesSame_(oldValues, newValues) {
  return (
    oldValues.billingStatus === newValues.billingStatus &&
    oldValues.billingRef === newValues.billingRef &&
    oldValues.billingDate === newValues.billingDate &&
    oldValues.paymentRef === newValues.paymentRef &&
    oldValues.paymentDate === newValues.paymentDate
  );
}


function applyBillingChanges_(tripsDbTable, changes) {
  changes.forEach(change => {
    setTableCellByField_(
      tripsDbTable,
      change.tripsDbRow,
      "billingStatus",
      change.newBillingStatus
    );

    setTableCellByField_(
      tripsDbTable,
      change.tripsDbRow,
      "billingRef",
      change.newBillingRef
    );

    setTableCellByField_(
      tripsDbTable,
      change.tripsDbRow,
      "billingDate",
      change.rawBillingDate
    );

    setTableCellByField_(
      tripsDbTable,
      change.tripsDbRow,
      "paymentRef",
      change.newPaymentRef
    );

    setTableCellByField_(
      tripsDbTable,
      change.tripsDbRow,
      "paymentDate",
      change.rawPaymentDate
    );
  });

  SpreadsheetApp.flush();

  return changes.length;
}


function buildBillingUpdateConfirmationMessage_(changes) {
  const previewLines = changes
    .slice(0, 10)
    .map(change => {
      const referenceNo = normalizeText_(change.referenceNo) || "No Reference No.";

      return `• Reference ${referenceNo}: ${change.oldBillingStatus} → ${change.newBillingStatus}`;
    });

  const extraCount = changes.length - previewLines.length;

  return [
    `You changed the billing/payment details of ${changes.length} record/s.`,
    "",
    "Please review before updating:",
    "",
    ...previewLines,
    extraCount > 0 ? `• ${extraCount} more record/s not shown` : "",
    "",
    "",
    "Continue?"
  ]
    .filter(line => line !== "")
    .join("\n");
}