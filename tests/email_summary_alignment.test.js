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
    "notifications/Helper.js"
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

  const tripsDb = [
    {
      date: d(2026, 7, 2),
      isSubcon: false,
      grossEarnings: 10000,
      alaskaRate: 7000,
      fuelSubsidy: 1000,
      billingStatus: "UNBILLED"
    },
    {
      date: d(2026, 7, 1),
      isSubcon: true,
      grossEarnings: 8000,
      alaskaRate: 5000,
      fuelSubsidy: 500,
      billingStatus: "BILLED",
      paymentRef: "",
      paymentDate: "",
      subconPayableStatus: "UNPAID",
      totalSubconEarnings: 3000,
      subconName: "ACME TRUCKING"
    },
    {
      date: d(2026, 7, 1),
      isSubcon: true,
      grossEarnings: 6000,
      billingStatus: "PAID",
      paymentRef: "OR-001",
      paymentDate: d(2026, 7, 2),
      subconPayableStatus: "PAID",
      totalSubconEarnings: 2000,
      subconName: "ACME TRUCKING"
    }
  ];

  const dashboardReceivables = ctx.buildReceivablesKpi_(tripsDb);
  const dashboardPayables = ctx.buildPayablesKpi_(tripsDb);
  const emailReceivables = ctx.buildEmailReceivablesTotals_(tripsDb);

  assert.strictEqual(dashboardReceivables.unbilled, 8000);
  assert.strictEqual(dashboardReceivables.billed, 5500);
  assert.strictEqual(dashboardReceivables.paid, 0);
  assert.strictEqual(dashboardReceivables.receivables, 13500);

  assert.strictEqual(emailReceivables.unbilledAmount, 8000);
  assert.strictEqual(emailReceivables.billedButUnpaidAmount, 5500);
  assert.strictEqual(emailReceivables.totalReceivables, 13500);

  assert.strictEqual(emailReceivables.unbilledAmount, dashboardReceivables.unbilled);
  assert.strictEqual(emailReceivables.billedButUnpaidAmount, dashboardReceivables.billed);
  assert.strictEqual(emailReceivables.totalReceivables, dashboardReceivables.receivables);

  const emailPayables = ctx.sumRecords_(tripsDb, record =>
    ctx.isSubcon_(record) &&
    ctx.normalizeStatus_(record.subconPayableStatus) === "UNPAID"
      ? ctx.toNumber_(record.totalSubconEarnings)
      : 0
  );

  assert.strictEqual(emailPayables, dashboardPayables.payables);

  console.log("email_summary_alignment.test.js passed");
}

run();