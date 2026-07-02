/*******************************************************
 * M-LINE LOGISTICS
 * Email Notification Test
 *******************************************************/

function testDailySummaryEmailNotification() {
  const recipientEmail = normalizeText_(
    EMAIL_NOTIFICATION_CONFIG.testRecipientEmail
  );

  if (!recipientEmail) {
    throw new Error(
      "No test recipient email is set in notifications/Config.js."
    );
  }

  const summaryData = buildDailySummaryData_();
  const subject = "[TEST] " + buildDailySummarySubject_(summaryData);
  const htmlBody = buildDailySummaryHtmlBody_(summaryData);
  const plainBody = buildDailySummaryPlainBody_(summaryData);

  MailApp.sendEmail({
    to: recipientEmail,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody
  });

  Logger.log("Test daily summary email sent to: " + recipientEmail);
}