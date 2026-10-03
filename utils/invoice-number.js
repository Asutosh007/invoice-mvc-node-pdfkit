function generateInvoiceNumber(db) {
  const year = new Date().getFullYear();
  const row = db.prepare(`
    SELECT invoice_number
    FROM invoices
    WHERE invoice_number LIKE ?
    ORDER BY id DESC
    LIMIT 1
  `).get(`INV-${year}-%`);

  let next = 1;

  if (row) {
    const match = row.invoice_number.match(/(\d+)$/);
    if (match) next = Number(match[1]) + 1;
  }

  return `INV-${year}-${String(next).padStart(5, "0")}`;
}

module.exports = { generateInvoiceNumber };