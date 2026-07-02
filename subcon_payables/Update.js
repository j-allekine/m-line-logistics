function updateSubconPayables_() {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    const subconPayablesTable = getTableInfo_("subconPayables");
    const tripsDbTable = getTableInfo_("tripsDb");

    const currentItems = getTableRecords_(subconPayablesTable);
    const tripsDbRecords = getTableRecords_(tripsDbTable);
    const cachedItems = getSubconPayablesCache_();

    validateSubconPayablesUpdate_(
      currentItems,
      tripsDbRecords,
      cachedItems
    );

    const changes = getSubconPayableChanges_(
      currentItems,
      cachedItems,
      tripsDbRecords
    );

    const ui = SpreadsheetApp.getUi();

    if (changes.length === 0) {
      ui.alert(
        "No Changes Made",
        "No subcon payable changes were found.",
        ui.ButtonSet.OK
      );

      showToast_("✅ No subcon payable changes found.", "Subcon Payables");

      return [];
    }

    const confirmation = ui.alert(
      "Update Subcon Payables?",
      buildSubconPayablesUpdateConfirmationMessage_(changes),
      ui.ButtonSet.YES_NO
    );

    if (confirmation !== ui.Button.YES) {
      showToast_("Update cancelled. No changes were saved.", "Subcon Payables");
      return [];
    }

    applySubconPayableChanges_(tripsDbTable, changes);

    saveSubconPayablesCache_(currentItems);

    showToast_(
      `✅ ${changes.length} subcon payable record/s updated.`,
      "Subcon Payables"
    );

    return changes;

  } finally {
    lock.releaseLock();
  }
}


function getSubconPayableChanges_(currentItems, cachedItems, tripsDbRecords) {
  const cacheMap = buildSubconPayablesCacheMap_(cachedItems);
  const tripsDbMap = buildTripsDbRecordMapByTripId_(tripsDbRecords);

  const changes = [];

  currentItems.forEach(item => {
    const tripId = normalizeText_(item.tripId);
    const cachedItem = cacheMap[tripId];
    const tripsDbRecord = tripsDbMap[tripId];

    if (!cachedItem || !tripsDbRecord) {
      return;
    }

    const oldValues = normalizeSubconPayableComparableValues_(cachedItem);
    const newValues = normalizeSubconPayableComparableValues_(item);

    if (areSubconPayableValuesSame_(oldValues, newValues)) {
      return;
    }

    changes.push({
      tripId,
      referenceNo: item.referenceNo,

      oldStatus: oldValues.payableStatus,
      oldPaymentRef: oldValues.subconPaymentRef,
      oldPaymentDate: oldValues.subconPaymentDate,

      newStatus: newValues.payableStatus,
      newPaymentRef: newValues.subconPaymentRef,
      newPaymentDate: newValues.subconPaymentDate,

      rawPaymentDate: item.subconPaymentDate,

      tripsDbRow: tripsDbRecord.__rowNumber
    });
  });

  return changes;
}


function normalizeSubconPayableComparableValues_(item) {
  return {
    payableStatus: normalizeSubconPayableStatusValue_(item.payableStatus),
    subconPaymentRef: normalizeText_(item.subconPaymentRef),
    subconPaymentDate: normalizeSubconPaymentDateKey_(item.subconPaymentDate)
  };
}


function areSubconPayableValuesSame_(oldValues, newValues) {
  return (
    oldValues.payableStatus === newValues.payableStatus &&
    oldValues.subconPaymentRef === newValues.subconPaymentRef &&
    oldValues.subconPaymentDate === newValues.subconPaymentDate
  );
}


function applySubconPayableChanges_(tripsDbTable, changes) {
  changes.forEach(change => {
    setTableCellByField_(
      tripsDbTable,
      change.tripsDbRow,
      "subconPayableStatus",
      change.newStatus
    );

    setTableCellByField_(
      tripsDbTable,
      change.tripsDbRow,
      "subconPaymentRef",
      change.newPaymentRef
    );

    setTableCellByField_(
      tripsDbTable,
      change.tripsDbRow,
      "subconPaymentDate",
      change.rawPaymentDate
    );
  });

  SpreadsheetApp.flush();

  return changes.length;
}


function buildSubconPayablesUpdateConfirmationMessage_(changes) {
  const previewLines = changes
    .slice(0, 10)
    .map(change => {
      const referenceNo = normalizeText_(change.referenceNo) || "No Reference No.";
      return `• Reference ${referenceNo}: ${change.oldStatus} → ${change.newStatus}`;
    });

  const extraCount = changes.length - previewLines.length;

  return [
    `You changed the subcon payment details of ${changes.length} record/s.`,
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