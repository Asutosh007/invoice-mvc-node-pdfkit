const express = require("express");
const path = require("path");
const invoiceRoutes = require("./routes/invoice.routes");
const { initializeDatabase } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;

initializeDatabase();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    name: "Invoice MVC API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      invoices: "/api/invoices",
      health: "/health"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/invoices", invoiceRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) return next(err);

  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
});

app.listen(PORT, () => {
  console.log(`Invoice API running on http://localhost:${PORT}`);
});