const { db } = require("../config/database");

function parseInvoice(row, items) {
  if (!row) return null;

  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    invoiceDate: row.invoice_date,
    dueDate: row.due_date,
    seller: JSON.parse(row.seller_json),
    customer: JSON.parse(row.customer_json),
    payment: JSON.parse(row.payment_json),
    totals: {
      subtotal: row.subtotal,
      discountTotal: row.discount_total,
      taxableTotal: row.taxable_total,
      cgst: row.cgst,
      sgst: row.sgst,
      igst: row.igst,
      grandTotal: row.grand_total
    },
    notes: row.notes,
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function getItems(invoiceId) {
  return db.prepare(`
    SELECT
      id,
      description,
      productname,
      consigner_name,
      hsn,
      quantity,
      rate,
      discount,
      gst_rate AS gstRate,
      taxable_amount AS taxableAmount,
      cgst,
      sgst,
      igst,
      total
    FROM invoice_items
    WHERE invoice_id = ?
    ORDER BY id
  `).all(invoiceId);
}

function findById(id) {
  const row = db.prepare(`SELECT * FROM invoices WHERE id = ?`).get(id);
  return parseInvoice(row, row ? getItems(row.id) : []);
}

function findAll() {
  const rows = db.prepare(`
    SELECT *
    FROM invoices
    ORDER BY id DESC
  `).all();

  return rows.map(row => parseInvoice(row, getItems(row.id)));
}

function create(invoice) {
  const now = new Date().toISOString();

  const insertInvoice = db.prepare(`
    INSERT INTO invoices (
      invoice_number,
      invoice_date,
      due_date,
      seller_json,
      customer_json,
      payment_json,
      subtotal,
      discount_total,
      taxable_total,
      cgst,
      sgst,
      igst,
      grand_total,
      notes,
      created_at,
      updated_at
    )
    VALUES (
      @invoiceNumber,
      @invoiceDate,
      @dueDate,
      @sellerJson,
      @customerJson,
      @paymentJson,
      @subtotal,
      @discountTotal,
      @taxableTotal,
      @cgst,
      @sgst,
      @igst,
      @grandTotal,
      @notes,
      @createdAt,
      @updatedAt
    )
  `);

  const insertItem = db.prepare(`
    INSERT INTO invoice_items (
      invoice_id,
      description,
      productname,
      consigner_name,
      hsn,
      quantity,
      rate,
      discount,
      gst_rate,
      taxable_amount,
      cgst,
      sgst,
      igst,
      total
    )
    VALUES (
      @invoiceId,
      @description,
      @productname,
      @consigner_name,
      @hsn,
      @quantity,
      @rate,
      @discount,
      @gstRate,
      @taxableAmount,
      @cgst,
      @sgst,
      @igst,
      @total
    )
  `);

  const transaction = db.transaction(() => {
    const result = insertInvoice.run({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate || null,
      sellerJson: JSON.stringify(invoice.seller),
      customerJson: JSON.stringify(invoice.customer),
      paymentJson: JSON.stringify(invoice.payment),
      subtotal: invoice.totals.subtotal,
      discountTotal: invoice.totals.discountTotal,
      taxableTotal: invoice.totals.taxableTotal,
      cgst: invoice.totals.cgst,
      sgst: invoice.totals.sgst,
      igst: invoice.totals.igst,
      grandTotal: invoice.totals.grandTotal,
      notes: invoice.notes || "",
      createdAt: now,
      updatedAt: now
    });

    

    for (const item of invoice.items) {
       console.log("========== INVOICE ITEM ==========");
      console.log("FULL ITEM:", item);
      console.log("productname:", item.productname);
      console.log("description:", item.description);
      console.log("consigner_name:", item.consigner_name);
      insertItem.run({
        invoiceId: result.lastInsertRowid,
        description: item.description,
        productname: item.productname,
        consigner_name: item.consigner_name,
        hsn: item.hsn || "",
        quantity: item.quantity,
        rate: item.rate,
        discount: item.discount,
        gstRate: item.gstRate,
        taxableAmount: item.taxableAmount,
        cgst: item.cgst,
        sgst: item.sgst,
        igst: item.igst,
        total: item.total
      });
    }

    return result.lastInsertRowid;
  });

  return findById(transaction());
}

function update(id, invoice) {
  const existing = findById(id);
  if (!existing) return null;

  const now = new Date().toISOString();

  const updateInvoice = db.prepare(`
    UPDATE invoices SET
      invoice_date = @invoiceDate,
      due_date = @dueDate,
      seller_json = @sellerJson,
      customer_json = @customerJson,
      payment_json = @paymentJson,
      subtotal = @subtotal,
      discount_total = @discountTotal,
      taxable_total = @taxableTotal,
      cgst = @cgst,
      sgst = @sgst,
      igst = @igst,
      grand_total = @grandTotal,
      notes = @notes,
      updated_at = @updatedAt
    WHERE id = @id
  `);

  const deleteItems = db.prepare(`DELETE FROM invoice_items WHERE invoice_id = ?`);

  const insertItem = db.prepare(`
    INSERT INTO invoice_items (
      invoice_id,
      description,
      productname,
      consigner_name,
      hsn,
      quantity,
      rate,
      discount,
      gst_rate,
      taxable_amount,
      cgst,
      sgst,
      igst,
      total
    )
    VALUES (
      @invoiceId,
      @description,
      @productname,
      @consigner_name,
      @hsn,
      @quantity,
      @rate,
      @discount,
      @gstRate,
      @taxableAmount,
      @cgst,
      @sgst,
      @igst,
      @total
    )
  `);

  const transaction = db.transaction(() => {
    updateInvoice.run({
      id,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate || null,
      sellerJson: JSON.stringify(invoice.seller),
      customerJson: JSON.stringify(invoice.customer),
      paymentJson: JSON.stringify(invoice.payment),
      subtotal: invoice.totals.subtotal,
      discountTotal: invoice.totals.discountTotal,
      taxableTotal: invoice.totals.taxableTotal,
      cgst: invoice.totals.cgst,
      sgst: invoice.totals.sgst,
      igst: invoice.totals.igst,
      grandTotal: invoice.totals.grandTotal,
      notes: invoice.notes || "",
      updatedAt: now
    });

    deleteItems.run(id);

    for (const item of invoice.items) {
      insertItem.run({
        invoiceId: id,
        description: item.description,
        productname: item.productname,
        consigner_name: item.consigner_name,
        hsn: item.hsn || "",
        quantity: item.quantity,
        rate: item.rate,
        discount: item.discount,
        gstRate: item.gstRate,
        taxableAmount: item.taxableAmount,
        cgst: item.cgst,
        sgst: item.sgst,
        igst: item.igst,
        total: item.total
      });
    }
  });

  transaction();
  return findById(id);
}

function remove(id) {
  return db.prepare(`DELETE FROM invoices WHERE id = ?`).run(id).changes > 0;
}

module.exports = { findAll, findById, create, update, remove };