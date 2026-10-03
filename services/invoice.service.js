const { round2 } = require("../utils/money");
const { generateInvoiceNumber } = require("../utils/invoice-number");
const company = require("../config/company");
const invoiceModel = require("../models/invoice.model");
const { db } = require("../config/database");

function calculateInvoice(payload, existingNumber = null) {
  if (!payload.customer || !payload.customer.name) {
    throw new Error("customer.name is required");
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error("At least one invoice item is required");
  }

  const seller = {
    ...company,
    ...(payload.seller || {}),
    bank: {
      ...company.bank,
      ...((payload.seller && payload.seller.bank) || {})
    }
  };

  const customer = {
    ...payload.customer
  };

  const sameState =
    seller.stateCode &&
    customer.stateCode &&
    String(seller.stateCode) === String(customer.stateCode);

  let subtotal = 0;
  let discountTotal = 0;
  let taxableTotal = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  const items = payload.items.map((raw, index) => {
    const description = String(raw.description || "").trim();

    if (!description) {
      throw new Error(`items[${index}].description is required`);
    }

    const productname = String(raw.productname || "").trim();
    const consigner_name = String(raw.consigner_name || "").trim();

    if (!productname) {
      throw new Error(`items[${index}].productname is required`);
    }

    if (!consigner_name) {
      throw new Error(`items[${index}].consigner_name is required`);
    }

    const quantity = Number(raw.quantity);
    const rate = Number(raw.rate);
    const discount = Number(raw.discount || 0);
    const gstRate = Number(raw.gstRate || 0);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(
        `items[${index}].quantity must be greater than 0`
      );
    }

    if (!Number.isFinite(rate) || rate < 0) {
      throw new Error(
        `items[${index}].rate must be 0 or greater`
      );
    }

    if (!Number.isFinite(discount) || discount < 0) {
      throw new Error(
        `items[${index}].discount must be 0 or greater`
      );
    }

    if (!Number.isFinite(gstRate) || gstRate < 0) {
      throw new Error(
        `items[${index}].gstRate must be 0 or greater`
      );
    }

    const gross = round2(quantity * rate);

    const actualDiscount = Math.min(
      round2(discount),
      gross
    );

    const taxableAmount = round2(
      gross - actualDiscount
    );

    const tax = round2(
      taxableAmount * gstRate / 100
    );

    const itemCgst = sameState
      ? round2(tax / 2)
      : 0;

    const itemSgst = sameState
      ? round2(tax / 2)
      : 0;

    const itemIgst = sameState
      ? 0
      : tax;

    const total = round2(
      taxableAmount + tax
    );

    subtotal += gross;
    discountTotal += actualDiscount;
    taxableTotal += taxableAmount;
    cgst += itemCgst;
    sgst += itemSgst;
    igst += itemIgst;

    return {
      description,
      productname,
      consigner_name,
      hsn: String(raw.hsn || ""),
      quantity,
      rate,
      discount: actualDiscount,
      gstRate,
      taxableAmount,
      cgst: itemCgst,
      sgst: itemSgst,
      igst: itemIgst,
      total
    };
  });

  subtotal = round2(subtotal);
  discountTotal = round2(discountTotal);
  taxableTotal = round2(taxableTotal);
  cgst = round2(cgst);
  sgst = round2(sgst);
  igst = round2(igst);

  const grandTotal = round2(
    taxableTotal +
    cgst +
    sgst +
    igst
  );

  return {
    invoiceNumber:
      existingNumber ||
      generateInvoiceNumber(db),

    invoiceDate:
      payload.invoiceDate ||
      new Date().toISOString().slice(0, 10),

    dueDate:
      payload.dueDate || null,

    seller,

    customer,

    payment: {
      method: "Bank Transfer",
      status: "Unpaid",
      ...(payload.payment || {})
    },

    totals: {
      subtotal,
      discountTotal,
      taxableTotal,
      cgst,
      sgst,
      igst,
      grandTotal
    },

    items,

    notes: payload.notes || ""
  };
}

function create(payload) {
  return invoiceModel.create(
    calculateInvoice(payload)
  );
}

function update(id, payload) {
  const existing = invoiceModel.findById(id);

  if (!existing) {
    return null;
  }

  return invoiceModel.update(
    id,
    calculateInvoice(
      payload,
      existing.invoiceNumber
    )
  );
}

module.exports = {
  create,
  update,
  list: invoiceModel.findAll,
  get: invoiceModel.findById,
  remove: invoiceModel.remove
};