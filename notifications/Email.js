/*******************************************************
 * M-LINE LOGISTICS
 * Email Notifications
 *******************************************************/

function installEmailNotifications() {
  const recipientEmail = getNotificationRecipientEmail_();

  if (!recipientEmail) {
    SpreadsheetApp.getUi().alert(
      "Unable to detect your Google account email.\n\nPlease make sure you are signed in with the account that should receive the notifications."
    );
    return;
  }

  removeExistingDailySummaryTriggers_();

  PropertiesService
    .getUserProperties()
    .setProperty(
      EMAIL_NOTIFICATION_CONFIG.recipientPropertyKey,
      recipientEmail
    );

  ScriptApp
    .newTrigger(EMAIL_NOTIFICATION_CONFIG.dailySummaryTriggerHandler)
    .timeBased()
    .everyDays(1)
    .atHour(EMAIL_NOTIFICATION_CONFIG.dailySummaryHour)
    .create();

  SpreadsheetApp.getUi().alert(
    "Email notifications installed successfully.\n\nDaily summaries will be sent to:\n" +
    recipientEmail +
    "\n\nThis uses your Google account authorization and Gmail quota."
  );
}


function sendDailySummaryEmailNotification() {
  const recipientEmail = getStoredNotificationRecipientEmail_();

  if (!recipientEmail) {
    throw new Error(
      "No notification recipient email found. Please reinstall email notifications from the M-Line menu."
    );
  }

  const summaryData = buildDailySummaryData_();
  const subject = buildDailySummarySubject_(summaryData);
  const htmlBody = buildDailySummaryHtmlBody_(summaryData);
  const plainBody = buildDailySummaryPlainBody_(summaryData);

  MailApp.sendEmail({
    to: recipientEmail,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody
  });
}


function getStoredNotificationRecipientEmail_() {
  const userEmail = PropertiesService
    .getUserProperties()
    .getProperty(EMAIL_NOTIFICATION_CONFIG.recipientPropertyKey);

  return normalizeText_(userEmail);
}


function removeExistingDailySummaryTriggers_() {
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(trigger => {
    if (
      trigger.getHandlerFunction() ===
      EMAIL_NOTIFICATION_CONFIG.dailySummaryTriggerHandler
    ) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}


function buildDailySummarySubject_(summaryData) {
  return (
    EMAIL_NOTIFICATION_CONFIG.subjectPrefix +
    " - " +
    formatEmailDate_(summaryData.date)
  );
}


function buildDailySummaryPlainBody_(summaryData) {
  const readySubconsText =
    summaryData.subconPayables.readySubcons.length > 0
      ? summaryData.subconPayables.readySubcons
          .map(item =>
            item.subconName +
            " (" +
            item.unpaidTrips +
            " unpaid trips, " +
            formatEmailCurrency_(item.payableAmount) +
            " payable)"
          )
          .join(", ")
      : "None";

  return [
    "M-Line Daily Summary",
    "Date: " + formatEmailDate_(summaryData.date),
    "",
    "Trips Today",
    "- Total trips delivered today: " + formatEmailNumber_(summaryData.tripsToday.totalTripsPosted),
    "- Own truck trips: " + formatEmailNumber_(summaryData.tripsToday.ownTruckTrips),
    "- Subcon trips: " + formatEmailNumber_(summaryData.tripsToday.subconTrips),
    "- Total gross earnings: " + formatEmailCurrency_(summaryData.tripsToday.totalGrossEarnings),
    "",
    "Billing & Receivables",
    "- New unbilled trips: " + formatEmailNumber_(summaryData.billingStatus.newUnbilledTrips),
    "- Unbilled amount: " + formatEmailCurrency_(summaryData.billingStatus.unbilledAmount),
    "- Billed but unpaid trips: " + formatEmailNumber_(summaryData.billingStatus.billedButUnpaidTrips),
    "- Billed but unpaid amount: " + formatEmailCurrency_(summaryData.billingStatus.billedButUnpaidAmount),
    "- Total receivables / grand total: " + formatEmailCurrency_(summaryData.billingStatus.totalReceivables),
    "",
    "Subcon Payables",
    "- New subcon trips: " + formatEmailNumber_(summaryData.subconPayables.newSubconTrips),
    "- Total unpaid subcon amount: " + formatEmailCurrency_(summaryData.subconPayables.totalUnpaidSubconAmount),
    "- Subcons ready for payment: " + readySubconsText
  ].join("\n");
}


function buildDailySummaryHtmlBody_(summaryData) {
  const readySubconsHtml =
    summaryData.subconPayables.readySubcons.length > 0
      ? summaryData.subconPayables.readySubcons
          .map(item =>
            escapeHtml_(item.subconName) +
            " (" +
            formatEmailNumber_(item.unpaidTrips) +
            " unpaid trips, " +
            formatEmailCurrency_(item.payableAmount) +
            " payable)"
          )
          .join("<br>")
      : "None";


  return `
    <div style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:720px;margin:0 auto;padding:24px;">
        <div style="background:#ffffff;border:1px solid #dbe3ef;border-radius:16px;overflow:hidden;">
          <div style="background:#0b3f73;padding:24px;color:#ffffff;">
            <div style="font-size:24px;font-weight:700;line-height:1.2;">M-Line Daily Summary</div>
            <div style="font-size:14px;margin-top:6px;color:#dbeafe;">${formatEmailDate_(summaryData.date)}</div>
          </div>

          <div style="padding:24px;">
            ${buildEmailSectionHtml_(
              "Trips Today",
              [
                ["Total trips delivered today", formatEmailNumber_(summaryData.tripsToday.totalTripsPosted)],
                ["Own truck trips", formatEmailNumber_(summaryData.tripsToday.ownTruckTrips)],
                ["Subcon trips", formatEmailNumber_(summaryData.tripsToday.subconTrips)],
                ["Total gross earnings", formatEmailCurrency_(summaryData.tripsToday.totalGrossEarnings)]
              ]
            )}

            ${buildEmailSectionHtml_(
              "Billing & Receivables",
              [
                ["New unbilled trips", formatEmailNumber_(summaryData.billingStatus.newUnbilledTrips)],
                ["Unbilled amount", formatEmailCurrency_(summaryData.billingStatus.unbilledAmount)],
                ["Billed but unpaid trips", formatEmailNumber_(summaryData.billingStatus.billedButUnpaidTrips)],
                ["Billed but unpaid amount", formatEmailCurrency_(summaryData.billingStatus.billedButUnpaidAmount)],
                ["Total receivables / grand total", formatEmailCurrency_(summaryData.billingStatus.totalReceivables)]
              ]
            )}

            ${buildEmailSectionHtml_(
              "Subcon Payables",
              [
                ["New subcon trips", formatEmailNumber_(summaryData.subconPayables.newSubconTrips)],
                ["Total unpaid subcon amount", formatEmailCurrency_(summaryData.subconPayables.totalUnpaidSubconAmount)],
                ["Subcons ready for payment", readySubconsHtml]
              ]
            )}
          </div>

          <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
            This is an automated email from ${EMAIL_NOTIFICATION_CONFIG.companyName}.
          </div>
        </div>
      </div>
    </div>
  `;
}


function buildEmailSectionHtml_(title, rows, note) {
  const bodyRows = rows.map(row => {
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#475569;">${escapeHtml_(row[0])}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;color:#0f172a;">${row[1]}</td>
      </tr>
    `;
  }).join("");

  const noteHtml = note
    ? `
      <div style="margin-top:8px;font-size:12px;line-height:1.4;color:#64748b;">
        ${escapeHtml_(note)}
      </div>
    `
    : "";

  return `
    <div style="margin-bottom:24px;">
      <div style="font-size:16px;font-weight:700;color:#0b3f73;margin-bottom:10px;">${escapeHtml_(title)}</div>
      <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
        ${bodyRows}
      </table>
      ${noteHtml}
    </div>
  `;
}


function escapeHtml_(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}