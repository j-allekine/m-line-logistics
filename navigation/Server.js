/*******************************************************
 * M-LINE LOGISTICS
 * Navigation Sidebar Server
 *******************************************************/

function openNavigationSidebar() {
  const template = HtmlService.createTemplateFromFile("navigation/Sidebar");

  template.navigationAppTitle = NAVIGATION_APP_TITLE;
  template.navigationLogoDataUri = getNavigationLogoDataUri_();

  const html = template
    .evaluate()
    .setTitle("M-Line Navigation");

  SpreadsheetApp
    .getUi()
    .showSidebar(html);
}


function getNavigationPayload() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const activeSheet = ss.getActiveSheet();

  const existingSheetNames = ss
    .getSheets()
    .map(function(sheet) {
      return sheet.getName();
    });

  const normalizedSheetMap = existingSheetNames.reduce(function(map, sheetName) {
    map[normalizeNavigationText_(sheetName)] = sheetName;
    return map;
  }, {});

  const sections = NAVIGATION_SECTIONS.map(function(section) {
    return {
      title: section.title,
      items: section.items.map(function(item) {
        const matchedSheetName =
          normalizedSheetMap[normalizeNavigationText_(item.sheetName)] || "";

        return {
          label: item.label,
          sheetName: item.sheetName,
          resolvedSheetName: matchedSheetName,
          description: item.description || "",
          exists: Boolean(matchedSheetName),
          isActive: activeSheet
            ? normalizeNavigationText_(activeSheet.getName()) === normalizeNavigationText_(matchedSheetName)
            : false
        };
      })
    };
  });

  return {
    appTitle: NAVIGATION_APP_TITLE,
    activeSheetName: activeSheet ? activeSheet.getName() : "",
    sections: sections
  };
}


function goToSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheet = findSheetByName_(ss, sheetName);

  if (!targetSheet) {
    throw new Error("Sheet not found: " + sheetName);
  }

  ss.setActiveSheet(targetSheet);

  return {
    success: true,
    sheetName: targetSheet.getName()
  };
}


function getActiveSheetName() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();

  return sheet ? sheet.getName() : "";
}


function findSheetByName_(ss, sheetName) {
  const requestedName = normalizeNavigationText_(sheetName);
  const sheets = ss.getSheets();

  for (let i = 0; i < sheets.length; i++) {
    const currentSheet = sheets[i];

    if (normalizeNavigationText_(currentSheet.getName()) === requestedName) {
      return currentSheet;
    }
  }

  return null;
}


function normalizeNavigationText_(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}


function getNavigationLogoDataUri_() {
  try {
    if (typeof DASHBOARD_LOGO_DATA_URI !== "undefined" && DASHBOARD_LOGO_DATA_URI) {
      return DASHBOARD_LOGO_DATA_URI;
    }
  } catch (error) {
    Logger.log("Navigation logo unavailable: " + error);
  }

  return "";
}