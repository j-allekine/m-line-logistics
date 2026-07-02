const TABLE_FIELDS = {
  trips: {
    rowNo: "#",

    referenceNo: "Reference No.",
    date: "Delivery Date",
    arrivalDate: "Arrival Date",
    customerName: "Customer Name",
    shipmentDocs: "Shipment Docs",
    totalQty: "Total Qty",
    route: "Route",

    plateNo: "Plate No.",
    driverName: "Driver Name",
    vehicleType: "Vehicle Type",
    fuelBracket: "Fuel Bracket",

    isSubcon: "Subcon?",
    subconName: "Subcon Name",
    subconRate: "Subcon Rate",
    commissionAmount: "Less: Commission",
    totalSubconEarnings: "Total Subcon Earnings",

    alaskaRate: "Alaska Rate",
    tripEarnings: "Trip Earnings",
    fuelSubsidy: "Fuel Subsidy",
    grossEarnings: "Gross Earnings",

    tripStatus: "Trip Status"
  },

  tripsDb: {
    tripId: "Trip ID",

    referenceNo: "Reference No.",
    date: "Delivery Date",
    arrivalDate: "Arrival Date",
    customerName: "Customer Name",
    shipmentDocs: "Shipment Docs",
    totalQty: "Total Qty",
    route: "Route",

    plateNo: "Plate No.",
    driverName: "Driver Name",
    vehicleType: "Vehicle Type",
    fuelBracket: "Fuel Bracket",
    fuelPercent: "Fuel %",

    isSubcon: "Subcon?",
    subconName: "Subcon Name",
    subconRate: "Subcon Rate",
    commissionAmount: "Less: Commission",
    totalSubconEarnings: "Total Subcon Earnings",

    alaskaRate: "Alaska Rate",
    tripEarnings: "Trip Earnings",
    fuelSubsidy: "Fuel Subsidy",
    grossEarnings: "Gross Earnings",

    postedAt: "Posted At",

    subconPayableStatus: "Subcon Payable Status",
    subconPaymentRef: "Statement Ref No.",
    subconPaymentDate: "Statement Date",

    billingStatus: "Billing Status",
    billingRef: "Billing Ref",
    billingDate: "Billing Date",
    paymentRef: "Payment Ref",
    paymentDate: "Payment Date"
  },

  subconPayables: {
    tripId: "Trip ID",
    referenceNo: "Reference No.",
    route: "Route",
    date: "Delivery Date",
    arrivalDate: "Arrival Date",
    vehicleType: "Vehicle Type",
    subconName: "Subcon",
    subconRate: "Subcon Rate",
    commissionAmount: "Less: Commission",
    payableAmount: "Payable Amount",
    payableStatus: "Payable Status",
    subconPaymentRef: "Statement Ref No.",
    subconPaymentDate: "Statement Date"
  },

  subconDeductions: {
    date: "Date",
    subconName: "Subcon Name",
    category: "Category",
    particulars: "Particulars",
    chargeAmount: "Charge Amount",
    actualCost: "Actual Cost",
    margin: "Margin",
    isPaid: "Paid?",
    paymentRef: "Statement Ref No."
  },

  billing: {
    tripId: "Trip ID",
    referenceNo: "Reference No.",
    shipmentDocs: "Shipment Docs",
    date: "Delivery Date",
    customerName: "Customer Name",
    route: "Route",
    totalQty: "Total Qty",
    plateNo: "Plate No.",
    driverName: "Driver Name",
    vehicleType: "Vehicle Type",
    subconName: "Subcon Name",
    alaskaRate: "Alaska Rate",
    fuelSubsidy: "Fuel Subsidy",
    grossEarnings: "Gross Earnings",
    billingAmount: "Billing Amount",
    billingStatus: "Billing Status",
    billingRef: "Billing Ref",
    billingDate: "Billing Date",
    paymentRef: "Payment Ref",
    paymentDate: "Payment Date"
  },

  masterData: {
    route: "Route",
    province: "Province",
    town: "Town",
    commission: "Commission",

    alaska6WE: "Alaska 6WE",
    subcon6WE: "Subcon 6WE",

    alaska6WF: "Alaska 6WF",
    subcon6WF: "Subcon 6WF",

    alaskaTamaraw: "Alaska Tamaraw",
    subconTamaraw: "Subcon Tamaraw",

    alaskaL100: "Alaska L300",
    subconL100: "Subcon L300",

    alaskaH100: "Alaska H100",
    subconH100: "Subcon H100"
  },

  expenses: {
    date: "Date",
    category: "Category",
    particulars: "Particulars",
    amount: "Amount",
    remarks: "Remarks"
  },

  otherIncome: {
    date: "Date",
    category: "Category",
    particulars: "Particulars",
    amount: "Amount",
    remarks: "Remarks"
  },

  cashFlow: {
    date: "Date",
    cashIn: "Cash In",
    cashOut: "Cash Out",
    particulars: "Particulars",
    remarks: "Remarks"
  }
};


const TABLES = {
  trips: {
    sheetName: "Trips",
    tableId: "Trips",
    headerOffset: 1,
    firstDataOffset: 2,
    fields: TABLE_FIELDS.trips,
    requiredHeaders: Object.values(TABLE_FIELDS.trips)
  },

  tripsDb: {
    sheetName: "TripsDB",
    tableId: "TripsDB",
    headerOffset: 1,
    firstDataOffset: 2,
    fields: TABLE_FIELDS.tripsDb,
    requiredHeaders: Object.values(TABLE_FIELDS.tripsDb)
  },

  subconPayables: {
    sheetName: "Subcon Payables",
    tableId: "SubconPayables",
    headerOffset: 1,
    firstDataOffset: 2,
    fields: TABLE_FIELDS.subconPayables,
    requiredHeaders: Object.values(TABLE_FIELDS.subconPayables)
  },

  subconDeductions: {
    sheetName: "Subcon Deductions",
    tableId: "SubconDeductions",
    headerOffset: 1,
    firstDataOffset: 2,
    fields: TABLE_FIELDS.subconDeductions,
    requiredHeaders: Object.values(TABLE_FIELDS.subconDeductions)
  },

  billing: {
    sheetName: "Billing",
    tableId: "Billing",
    headerOffset: 1,
    firstDataOffset: 2,
    fields: TABLE_FIELDS.billing,
    requiredHeaders: Object.values(TABLE_FIELDS.billing)
  },

  masterData: {
    sheetName: "Master Data",
    tableId: "MasterData",
    headerOffset: 1,
    firstDataOffset: 2,
    fields: TABLE_FIELDS.masterData,
    requiredHeaders: Object.values(TABLE_FIELDS.masterData)
  },

  expenses: {
    sheetName: "Expenses",
    tableId: "Expenses",
    headerOffset: 1,
    firstDataOffset: 2,
    fields: TABLE_FIELDS.expenses,
    requiredHeaders: Object.values(TABLE_FIELDS.expenses)
  },

  otherIncome: {
    sheetName: "Other Income",
    tableId: "OtherIncome",
    headerOffset: 1,
    firstDataOffset: 2,
    fields: TABLE_FIELDS.otherIncome,
    requiredHeaders: Object.values(TABLE_FIELDS.otherIncome)
  },

  cashFlow: {
    sheetName: "Cashflow",
    tableId: "CashFlow",
    headerOffset: 1,
    firstDataOffset: 2,
    fields: TABLE_FIELDS.cashFlow,
    requiredHeaders: Object.values(TABLE_FIELDS.cashFlow)
  }
};


const NAMED_RANGES = {
  subconPayables: {
    subcon: "scPayableSubcon",
    dateFrom: "scPayableFrom",
    dateTo: "scPayableTo",
    load: "scPayableLoad",
    update: "scPayableUpdate"
  },

  billing: {
    status: "billingStatus",
    dateFrom: "billingFrom",
    dateTo: "billingTo",
    load: "billingLoad",
    update: "billingUpdate"
  }
};


const APP_SETTINGS = {
  tripIdPrefix: "TRIP-",
  tripIdDigits: 5,

  postStatuses: ["Completed"],
  activeStatuses: ["Pending", "In-Transit", "Cancelled"],

  clearPostedRows: true,
  preventDuplicateReferenceNo: true,

  defaultSubconPayableStatus: "UNPAID",
  subconPayablesCacheKey: "SUBCON_PAYABLES_LOADED_CACHE",

  defaultBillingStatus: "UNBILLED",
  billingStatuses: ["UNBILLED", "BILLED", "PAID"],
  billingAllStatus: "ALL",
  billingCacheKey: "BILLING_LOADED_CACHE",

  dashboardOpeningBalanceRange: "cashOpeningBalance",
  dashboardYearRange: "dashYear",
  dashboardMonthRange: "dashMonth"
};