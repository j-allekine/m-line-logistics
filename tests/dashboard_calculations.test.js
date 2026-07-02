const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");

function loadAppsScriptContext() {
  const context = {
    console
  };

  vm.createContext(context);

  [
    "tables/Utils.js",
    "dashboard/Helpers.js",
    "dashboard/Calculate.js"
  ].forEach(relativePath => {
    const absolutePath = path.join(ROOT, relativePath);
    const source = fs.readFileSync(absolutePath, "utf8");
    vm.runInContext(source, context, { filename: relativePath });
  });

  return context;
}

function d(year, month, day) {
  return new Date(year, month - 1, day);
}

function run() {
  const ctx = loadAppsScriptContext();
  const selectedPeriod = ctx.buildDashboardPeriodMonth_(2026, 7);

  const tripsDb = [
    {
      date: d(2026, 7, 5),
      isSubcon: false,
      grossEarnings: 10000,
      billingStatus: "PAID",
      paymentDate: d(2026, 7, 5)
    },
    {
      date: d(2026, 7, 6),
      isSubcon: true,
      grossEarnings: 8000,
      totalSubconEarnings: 3000,
      billingStatus: "PAID",
      paymentDate: d(2026, 7, 6),
      subconPayableStatus: "PAID",
      subconPaymentDate: d(2026, 7, 6)
    }
  ];

  const otherIncomeRecords = [
    { date: d(2026, 7, 7), amount: 500 }
  ];

  const expensesRecords = [
    { date: d(2026, 7, 8), amount: 200 }
  ];

  const cashFlowRecords = [
    { date: d(2026, 7, 9), cashIn: 50, cashOut: 25 }
  ];

  const subconDeductionsRecords = [
    {
      date: d(2026, 7, 10),
      subconName: "MARSHALL T. CORGOS",
      chargeAmount: 6000,
      actualCost: 3000,
      isPaid: true,
      paymentRef: "PAY-001"
    },
    {
      date: d(2026, 7, 11),
      subconName: "MARSHALL T. CORGOS",
      chargeAmount: 9999,
      actualCost: 9999,
      isPaid: false,
      paymentRef: ""
    },
    {
      date: d(2026, 8, 1),
      subconName: "MARSHALL T. CORGOS",
      chargeAmount: 7000,
      actualCost: 4000,
      isPaid: true,
      paymentRef: "PAY-002"
    }
  ];

  const result = ctx.calculateDashboard_(
    selectedPeriod,
    tripsDb,
    otherIncomeRecords,
    expensesRecords,
    cashFlowRecords,
    subconDeductionsRecords,
    1000,
    {
      years: ["ALL", 2026],
      monthsByYear: {
        ALL: [{ month: "ALL", label: "All" }],
        2026: [{ month: "ALL", label: "All" }, { month: 7, label: "Jul" }]
      }
    }
  );

  assert.strictEqual(result.kpi.totalRevenue, 24500);
  assert.strictEqual(result.kpi.totalCost, 6200);
  assert.strictEqual(result.kpi.netIncome, 18300);
  assert.strictEqual(result.kpi.netCashFlow, 18325);
  assert.strictEqual(result.kpi.currentBalance, 19325);

  assert.strictEqual(result.monthlyFinancialPerformance.totalRevenue[6], 24500);
  assert.strictEqual(result.monthlyFinancialPerformance.totalCost[6], 6200);
  assert.strictEqual(result.monthlyFinancialPerformance.netIncome[6], 18300);

  assert.strictEqual(result.monthlyFinancialPerformance.totalRevenue[7], 7000);
  assert.strictEqual(result.monthlyFinancialPerformance.totalCost[7], 4000);
  assert.strictEqual(result.monthlyFinancialPerformance.netIncome[7], 3000);

  assert.strictEqual(result.kpi.payables, 0);

  const receivablesKpi = ctx.buildReceivablesKpi_([
    {
      grossEarnings: 10000,
      alaskaRate: 7000,
      fuelSubsidy: 1000,
      billingStatus: "UNBILLED"
    },
    {
      grossEarnings: 8000,
      alaskaRate: 5000,
      fuelSubsidy: 500,
      billingStatus: "BILLED"
    },
    {
      grossEarnings: 6000,
      alaskaRate: 3000,
      fuelSubsidy: 500,
      billingStatus: "PAID"
    }
  ]);

  assert.strictEqual(receivablesKpi.unbilled, 8000);
  assert.strictEqual(receivablesKpi.billed, 5500);
  assert.strictEqual(receivablesKpi.paid, 3500);
  assert.strictEqual(receivablesKpi.receivables, 13500);

  console.log("dashboard_calculations.test.js passed");
}

run();
