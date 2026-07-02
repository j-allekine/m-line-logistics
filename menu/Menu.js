/*******************************************************
 * M-LINE LOGISTICS
 * Spreadsheet Menu / Startup
 *******************************************************/

function onOpen(e) {
  try {
    openNavigationSidebar();
  } catch (error) {
    Logger.log("Navigation sidebar failed to open on start: " + error);
  }

  createMLineMenu_();
}


function createMLineMenu_() {
  SpreadsheetApp
    .getUi()
    .createMenu("M-Line")
    .addItem("Open Navigation", "openNavigationSidebar")
    .addSeparator()
    .addItem("Executive Overview Dashboard", "openDashboardDialog")
    .addSeparator()
    .addItem("Install Email Notifications", "installEmailNotifications")
    .addToUi();
}