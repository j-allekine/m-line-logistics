/*******************************************************
 * M-LINE LOGISTICS
 * Email Notification Helpers
 *******************************************************/

function getNotificationRecipientEmail_() {
  const userEmail =
    Session.getEffectiveUser().getEmail() ||
    Session.getActiveUser().getEmail();

  return normalizeText_(userEmail);
}


function getTodayDateOnly_() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
}


function isSameDate_(dateValue, targetDate) {
  const date = toDateOnly_(dateValue);

  if (!date || !targetDate) return false;

  return date.getTime() === targetDate.getTime();
}


function formatEmailDate_(dateValue) {
  return Utilities.formatDate(
    dateValue,
    Session.getScriptTimeZone(),
    "MMMM d, yyyy"
  );
}


function formatEmailCurrency_(value) {
  return "₱" + toNumber_(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}


function formatEmailNumber_(value) {
  return toNumber_(value).toLocaleString("en-PH", {
    maximumFractionDigits: 0
  });
}



function isBillingPaidRecord_(record) {
  const billingStatus = normalizeStatus_(record.billingStatus);
  const paymentRef = normalizeText_(record.paymentRef);
  const paymentDate = toDateOnly_(record.paymentDate);

  return (
    billingStatus === "PAID" ||
    paymentRef !== "" ||
    !!paymentDate
  );
}


function isBilledButUnpaidRecord_(record) {
  return (
    normalizeStatus_(record.billingStatus) === "BILLED" &&
    !isBillingPaidRecord_(record)
  );
}


function buildEmailReceivablesTotals_(tripsDb) {
  const result = {
    unbilledTrips: 0,
    unbilledAmount: 0,
    billedButUnpaidTrips: 0,
    billedButUnpaidAmount: 0,
    totalReceivables: 0
  };

  tripsDb.forEach(record => {
    const amount = getBillingAmount_(record);

    if (normalizeStatus_(record.billingStatus) === "UNBILLED") {
      result.unbilledTrips++;
      result.unbilledAmount += amount;
    }

    if (isBilledButUnpaidRecord_(record)) {
      result.billedButUnpaidTrips++;
      result.billedButUnpaidAmount += amount;
    }
  });

  result.totalReceivables =
    result.unbilledAmount + result.billedButUnpaidAmount;

  return result;
}


function buildDailySummaryData_() {
  const sourceData = loadEmailNotificationSourceData_();
  const today = getTodayDateOnly_();

  const tripsToday = sourceData.tripsDb.filter(record =>
    isSameDate_(record.date, today)
  );

  const ownTruckTripsToday = tripsToday.filter(record =>
    !isSubcon_(record)
  );

  const subconTripsToday = tripsToday.filter(record =>
    isSubcon_(record)
  );

  const totalGrossEarningsToday = sumRecords_(tripsToday, record =>
    toNumber_(record.grossEarnings)
  );

  const newUnbilledTripsToday = tripsToday.filter(record =>
    normalizeStatus_(record.billingStatus) === "UNBILLED"
  );

  const receivablesTotals = buildEmailReceivablesTotals_(
    sourceData.tripsDb
  );

  const newSubconTripsToday = subconTripsToday.length;

  const totalUnpaidSubconAmount = sumRecords_(sourceData.tripsDb, record =>
    isSubcon_(record) &&
    normalizeStatus_(record.subconPayableStatus) === "UNPAID"
      ? toNumber_(record.totalSubconEarnings)
      : 0
  );

  const readySubcons = buildReadySubconsForPayment_(
    sourceData.tripsDb
  );

  return {
    date: today,

    tripsToday: {
      totalTripsPosted: tripsToday.length,
      ownTruckTrips: ownTruckTripsToday.length,
      subconTrips: subconTripsToday.length,
      totalGrossEarnings: totalGrossEarningsToday
    },

    billingStatus: {
      newUnbilledTrips: newUnbilledTripsToday.length,

      unbilledAmount: receivablesTotals.unbilledAmount,

      billedButUnpaidTrips: receivablesTotals.billedButUnpaidTrips,
      billedButUnpaidAmount: receivablesTotals.billedButUnpaidAmount,

      totalReceivables: receivablesTotals.totalReceivables,

      totalUnbilledAmount: receivablesTotals.unbilledAmount,
      totalBilledButUnpaid: receivablesTotals.billedButUnpaidAmount
    },

    subconPayables: {
      newSubconTrips: newSubconTripsToday,
      totalUnpaidSubconAmount: totalUnpaidSubconAmount,
      readySubcons: readySubcons
    }
  };
}


function loadEmailNotificationSourceData_() {
  const tripsDbTable = getTableInfo_("tripsDb");

  return {
    tripsDb: getTableRecords_(tripsDbTable)
  };
}


function buildReadySubconsForPayment_(tripsDb) {
  const subconMap = {};

  tripsDb
    .filter(record =>
      isSubcon_(record) &&
      normalizeStatus_(record.subconPayableStatus) === "UNPAID" &&
      normalizeText_(record.subconName) !== ""
    )
    .forEach(record => {
      const subconName = normalizeText_(record.subconName);

      if (!subconMap[subconName]) {
        subconMap[subconName] = [];
      }

      subconMap[subconName].push(record);
    });

  return Object.keys(subconMap)
    .map(subconName => {
      const unpaidTrips = subconMap[subconName]
        .slice()
        .sort((a, b) => {
          const dateA = toDateOnly_(a.date);
          const dateB = toDateOnly_(b.date);

          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;

          return dateA.getTime() - dateB.getTime();
        });

      const unpaidTripCount = unpaidTrips.length;
      const payableAmount = sumRecords_(unpaidTrips, record =>
        toNumber_(record.totalSubconEarnings)
      );

      return {
        subconName: subconName,
        unpaidTrips: unpaidTripCount,
        payableAmount: payableAmount,
        isReady: unpaidTripCount >= 5
      };
    })
    .filter(item => item.isReady)
    .sort((a, b) => {
      if (b.payableAmount !== a.payableAmount) {
        return b.payableAmount - a.payableAmount;
      }

      return a.subconName.localeCompare(b.subconName);
    });
}