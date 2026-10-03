const invoiceService = require("../services/invoice.service");
const { createInvoicePdf } = require("../services/invoice-pdf.service");

async function create(req, res, next) {
  try {
    const invoice = invoiceService.create(req.body);

    res.status(201).json({
      message: "Invoice created successfully",
      invoice,
      pdfUrl: `/api/invoices/${invoice.id}/pdf`
    });
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    res.json({
      invoices: invoiceService.list()
    });
  } catch (error) {
    next(error);
  }
}

async function get(req, res, next) {
  try {
    const invoice = invoiceService.get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const invoice = invoiceService.update(req.params.id, req.body);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json({
      message: "Invoice updated successfully",
      invoice,
      pdfUrl: `/api/invoices/${invoice.id}/pdf`
    });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const removed = invoiceService.remove(req.params.id);

    if (!removed) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    next(error);
  }
}

async function pdf(req, res, next) {
  try {
    const invoice = invoiceService.get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoice.invoiceNumber}.pdf"`
    );

    const { doc } = createInvoicePdf(invoice, "stream");
    doc.pipe(res);
  } catch (error) {
    next(error);
  }
}

async function previewPdf(req, res, next) {
  try {
    const invoice = invoiceService.get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${invoice.invoiceNumber}.pdf"`
    );

    const { doc } = createInvoicePdf(invoice, "stream");
    doc.pipe(res);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  list,
  get,
  update,
  remove,
  pdf,
  previewPdf
};