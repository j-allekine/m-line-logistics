/*******************************************************
 * M-LINE LOGISTICS
 * Navigation Sidebar Config
 *******************************************************/

const NAVIGATION_APP_TITLE = "M-Line Logistics";

const NAVIGATION_SECTIONS = [
  {
    title: "Setup",
    items: [
      {
        label: "Setup",
        sheetName: "Setup",
        description: "System setup and dropdown sources"
      },
      {
        label: "Master Data",
        sheetName: "Master Data",
        description: "Route, province, destination, and rate master list"
      },
      {
        label: "Subcon Tracker",
        sheetName: "Subcon Tracker",
        description: "Track subcontractor unpaid trips and payable status"
      }
    ]
  },
  {
    title: "Data Entry",
    items: [
      {
        label: "Trips",
        sheetName: "Trips",
        description: "Encode delivery trips"
      },
      {
        label: "Subcon Payables",
        sheetName: "Subcon Payables",
        description: "Review and update subcontractor payables"
      },
      {
        label: "Billing",
        sheetName: "Billing",
        description: "Prepare customer billing records"
      },
      {
        label: "Cashflow",
        sheetName: "Cashflow",
        description: "Track system and manual cash movement"
      },
      {
        label: "Expenses",
        sheetName: "Expenses",
        description: "Encode operating expenses"
      },
      {
        label: "Other Income",
        sheetName: "Other Income",
        description: "Encode non-trip income"
      }
    ]
  },
  {
    title: "Forms",
    items: [
      {
        label: "Billing Statement",
        sheetName: "Billing Statement",
        description: "Printable customer billing form"
      },
      {
        label: "Payment Statement",
        sheetName: "Payment Statement",
        description: "Printable subcontractor payment form"
      }
    ]
  },
  {
    title: "Reports",
    items: [
      {
        label: "Trip History",
        sheetName: "Trip History",
        description: "View posted trip history"
      }
    ]
  },
  {
    title: "Database",
    items: [
      {
        label: "TripsDB",
        sheetName: "TripsDB",
        description: "Posted trip database"
      }
    ]
  }
];