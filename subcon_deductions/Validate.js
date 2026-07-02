const SUBCON_DEDUCTION_PAID_REQUIRED_FIELDS = [
  "date",
  "subconName",
  "chargeAmount",
  "actualCost",
  "paymentRef"
];


function getMissingSubconDeductionPaidFields_(deductionItem) {
  return SUBCON_DEDUCTION_PAID_REQUIRED_FIELDS.filter(fieldKey => {
    return isBlankValue_(deductionItem[fieldKey]);
  });
}


function buildSubconDeductionPaidValidationMessage_(invalidRows) {
  const rowMessages = invalidRows.map(invalidRow => {
    const missingLabels = invalidRow.missingFields.map(fieldKey => {
      return TABLE_FIELDS.subconDeductions[fieldKey] || fieldKey;
    });

    return `Row ${invalidRow.rowNumber}: ${missingLabels.join(", ")}`;
  });

  return [
    "The selected row/s were not marked as paid.",
    "",
    "Please fill in the required field/s below and try again:",
    "",
    ...rowMessages
  ].join("\n");
}
