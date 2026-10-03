# Invoice MVC API

Complete runnable invoice API using:

- Node.js
- Express
- SQLite (`better-sqlite3`)
- MVC architecture
- PDFKit
- GST invoice calculation
- Invoice CRUD
- Professional PDF generation
- PDF download endpoint

## Requirements

Node.js 18+ recommended.

## Install

```bash
npm install
```

## Run

```bash
npm start
```

Server:

```text
http://localhost:3000
```

## API

### Create invoice

`POST /api/invoices`

Example:

```json
{
  "customer": {
    "name": "ABC Enterprises",
    "address": "Mumbai, Maharashtra",
    "gstin": "27ABCDE1234F1Z5",
    "phone": "9876543210",
    "email": "abc@example.com"
  },
  "items": [
    {
      "description": "Website Development",
      "hsn": "998314",
      "quantity": 1,
      "rate": 25000,
      "discount": 0,
      "gstRate": 18
    },
    {
      "description": "Hosting",
      "hsn": "998315",
      "quantity": 2,
      "rate": 2500,
      "discount": 0,
      "gstRate": 18
    }
  ],
  "payment": {
    "method": "Bank Transfer",
    "status": "Paid"
  },
  "notes": "Thank you for your business."
}
```

The response contains the created invoice and PDF download URL.

### List

`GET /api/invoices`

### Get one

`GET /api/invoices/:id`

### Update

`PUT /api/invoices/:id`

Use the same JSON structure as create. Items are replaced.

### Delete

`DELETE /api/invoices/:id`

### Download PDF

`GET /api/invoices/:id/pdf`

The endpoint generates the PDF directly with PDFKit and downloads it.

### Preview PDF in browser

`GET /api/invoices/:id/pdf/preview`

## GST behavior

The invoice supports two GST modes:

- Same-state: CGST + SGST
- Inter-state: IGST

Set:

```json
{
  "seller": {
    "stateCode": "27"
  },
  "customer": {
    "stateCode": "27"
  }
}
```

or set `customer.stateCode` to another state code for IGST.

The default seller is configured in `config/company.js`.

## Project structure

```text
invoice-mvc/
├── app.js
├── package.json
├── README.md
├── config/
│   ├── company.js
│   └── database.js
├── controllers/
│   └── invoice.controller.js
├── models/
│   └── invoice.model.js
├── routes/
│   └── invoice.routes.js
├── services/
│   ├── invoice.service.js
│   └── invoice-pdf.service.js
├── utils/
│   ├── invoice-number.js
│   └── money.js
├── data/
│   └── .gitkeep
└── storage/
    └── invoices/
        └── .gitkeep
```

## Important

PDFs are generated directly from PDFKit. No HTML-to-PDF conversion is used.
