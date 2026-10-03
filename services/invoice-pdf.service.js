const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const company = require("../config/company");
const { money } = require("../utils/money");

/* =========================================================
   ASSETS
========================================================= */

const LOGO_PATH = path.join(
  __dirname,
  "../assets/logo.png"
);
const RUPEE_FONT = path.join(
  __dirname,
  "../assets/fonts/NotoSansDevanagari-Regular.ttf"
);

const storageDir = path.join(
  __dirname,
  "..",
  "storage",
  "invoices"
);

fs.mkdirSync(storageDir, { recursive: true });

/* =========================================================
   HELPERS
========================================================= */

function safe(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
}

function drawBox(
  doc,
  x,
  y,
  width,
  height,
  lineWidth = 0.7
) {
  doc
    .lineWidth(lineWidth)
    .strokeColor("#000000")
    .rect(x, y, width, height)
    .stroke();
}

function drawLine(
  doc,
  x1,
  y1,
  x2,
  y2,
  width = 0.7
) {
  doc
    .lineWidth(width)
    .strokeColor("#000000")
    .moveTo(x1, y1)
    .lineTo(x2, y2)
    .stroke();
}

function write(
  doc,
  value,
  x,
  y,
  width,
  options = {}
) {
  const text = safe(value);

  if (
    text.includes("₹") &&
    fs.existsSync(RUPEE_FONT)
  ) {
    doc
      .font(RUPEE_FONT)
      .fontSize(options.size || 8)
      .fillColor(options.color || "#000000")
      .text(
        text,
        x,
        y,
        {
          width,
          align: options.align || "left",
          lineGap: options.lineGap || 0,
          continued: false
        }
      );

    return;
  }

  doc
    .font(
      options.bold
        ? "Helvetica-Bold"
        : "Helvetica"
    )
    .fontSize(options.size || 8)
    .fillColor(options.color || "#000000")
    .text(
      text,
      x,
      y,
      {
        width,
        align: options.align || "left",
        lineGap: options.lineGap || 0,
        continued: false
      }
    );
}
/* =========================================================
   MAIN PDF FUNCTION
========================================================= */

function createInvoicePdf(
  invoice,
  mode = "stream"
) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    bufferPages: false,

    info: {
      Title: `Invoice ${safe(
        invoice.invoiceNumber ||
        invoice.invoiceNo ||
        "Invoice"
      )}`,

      Author:
        invoice.seller?.legalName ||
        invoice.seller?.name ||
        company.legalName ||
        company.name ||
        "Invoice"
    }
  });

  let outputPath = null;

  /* =======================================================
     FILE MODE
  ======================================================= */

  if (mode === "file") {
    outputPath = path.join(
      storageDir,
      `${safe(
        invoice.invoiceNumber ||
        invoice.invoiceNo,
        "invoice"
      ).replace(
        /[^a-z0-9_-]/gi,
        "_"
      )}.pdf`
    );

    doc.pipe(
      fs.createWriteStream(outputPath)
    );
  }

  /* =======================================================
     DRAW PDF
  ======================================================= */

  drawInvoiceLayout(
    doc,
    invoice
  );

  doc.end();

  return {
    doc,
    outputPath
  };
}

/* =========================================================
   INVOICE LAYOUT
========================================================= */

function drawInvoiceLayout(
  doc,
  invoice
) {
  /* =======================================================
     PAGE SETTINGS
  ======================================================= */

  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;

  const BORDER = 10;

  const LEFT = BORDER;
  const TOP = BORDER;

  const WIDTH =
    PAGE_WIDTH -
    BORDER * 2;

  const RIGHT =
    LEFT + WIDTH;

  /* =======================================================
     DATA
  ======================================================= */

  const seller =
    invoice.seller || company;

  const customer =
    invoice.customer || {};

  const items =
    Array.isArray(invoice.items)
      ? invoice.items
      : [];

  /* =======================================================
     BASIC DETAILS
  ======================================================= */

  const invoiceNumber =
    invoice.invoiceNumber ||
    invoice.invoiceNo ||
    "-";

  const invoiceDate =
    invoice.invoiceDate ||
    invoice.date ||
    "-";

  const deliveryNote =
    invoice.deliveryNote ||
    invoice.deliveryNoteNo ||
    "-";

  const deliveryNoteDate =
    invoice.deliveryNoteDate ||
    "-";

  const ewayBill =
    invoice.ewayBill ||
    invoice.eWayBill ||
    "-";

  const paymentMode =
    invoice.paymentMode ||
    invoice.payment?.mode ||
    "-";

  const buyerOrderNo =
    invoice.buyerOrderNo ||
    "-";

  const buyerOrderDate =
    invoice.buyerOrderDate ||
    "-";

  const otherReference =
    invoice.otherReference ||
    "-";
  const supplierRef =
  invoice.supplierRef ||
  "-";

  const dispatchDocumentNo =
    invoice.dispatchDocumentNo ||
    "-";

  const dispatchedThrough =
    invoice.dispatchedThrough ||
    "-";

  const destination =
    invoice.destination ||
    customer.city ||
    "-";

  const termsOfDelivery =
    invoice.termsOfDelivery ||
    "-";

  /* =======================================================
     TAX / TOTALS
  ======================================================= */

  const subtotal =
    Number(
      invoice.totals?.taxableValue ??
      invoice.totals?.subtotal ??
      invoice.subtotal ??
      items.reduce(
        (sum, item) =>
          sum +
          Number(
            item.taxableValue ??
            item.total ??
            item.amount ??
            0
          ),
        0
      )
    );

  const cgst =
    Number(
      invoice.totals?.cgst ??
      invoice.tax?.cgst ??
      0
    );

  const sgst =
    Number(
      invoice.totals?.sgst ??
      invoice.tax?.sgst ??
      0
    );

  const igst =
    Number(
      invoice.totals?.igst ??
      invoice.tax?.igst ??
      0
    );

  const grandTotal =
    Number(
      invoice.totals?.grandTotal ??
      invoice.grandTotal ??
      subtotal +
        cgst +
        sgst +
        igst
    );

  const taxableValue =
  Number(
    invoice.totals?.taxableValue ??
    invoice.totals?.subtotal ??
    invoice.subtotal ??
    0
  );



const storedCgstRate =
  Number(
    invoice.tax?.cgstRate ??
    invoice.totals?.cgstRate ??
    0
  );

const storedSgstRate =
  Number(
    invoice.tax?.sgstRate ??
    invoice.totals?.sgstRate ??
    0
  );

const storedIgstRate =
  Number(
    invoice.tax?.igstRate ??
    invoice.totals?.igstRate ??
    0
  );

const cgstRate =
  storedCgstRate > 0
    ? storedCgstRate
    : taxableValue > 0
      ? (cgst / taxableValue) * 100
      : 0;

const sgstRate =
  storedSgstRate > 0
    ? storedSgstRate
    : taxableValue > 0
      ? (sgst / taxableValue) * 100
      : 0;

const igstRate =
  storedIgstRate > 0
    ? storedIgstRate
    : taxableValue > 0
      ? (igst / taxableValue) * 100
      : 0;

  /* =======================================================
     OUTER BORDER
  ======================================================= */

  drawBox(
    doc,
    LEFT,
    TOP,
    WIDTH,
    PAGE_HEIGHT -
      BORDER * 2,
    0.8
  );

  let y = TOP;

  /* =======================================================
     TITLE
  ======================================================= */

  write(
    doc,
    invoice.title ||
      "Tax Invoice",
    LEFT,
    y + 7,
    WIDTH,
    {
      bold: true,
      size: 14,
      align: "center"
    }
  );

  y += 28;

  /* =======================================================
     TOP HEADER
  ======================================================= */

  const headerHeight = 92;

  const leftHeaderWidth = 285;

  const rightHeaderWidth =
    WIDTH -
    leftHeaderWidth;

  drawBox(
    doc,
    LEFT,
    y,
    WIDTH,
    headerHeight
  );

  const headerDividerX =
  LEFT + leftHeaderWidth;

drawLine(
  doc,
  headerDividerX,
  y,
  headerDividerX,
  y + headerHeight,
  0.8
);


  /* =======================================================
     COMPANY / SELLER
  ======================================================= */

  if (
    fs.existsSync(
      LOGO_PATH
    )
  ) {
    doc.image(
      LOGO_PATH,
      LEFT + 10,
      y + 10,
      {
        width: 55,
        height: 55
      }
    );
  }

  const companyX =
    LEFT + 72;

  write(
    doc,
    seller.legalName ||
      seller.name ||
      company.legalName ||
      company.name ||
      "Company Name",
    companyX,
    y + 8,
    leftHeaderWidth - 82,
    {
      bold: true,
      size: 8
    }
  );

  write(
    doc,
    seller.address ||
      company.address ||
      "",
    companyX,
    y + 25,
    leftHeaderWidth - 82,
    {
      size: 7
    }
  );

  write(
    doc,
    `GSTIN/UIN: ${
      seller.gstin ||
      company.gstin ||
      "-"
    }`,
    companyX,
    y + 48,
    leftHeaderWidth - 82,
    {
      size: 7
    }
  );

  write(
    doc,
    `State: ${
      seller.state ||
      "-"
    }`,
    companyX,
    y + 61,
    leftHeaderWidth - 82,
    {
      size: 7
    }
  );

  write(
    doc,
    `E-Mail: ${
      seller.email ||
      company.email ||
      "-"
    }`,
    companyX,
    y + 74,
    leftHeaderWidth - 82,
    {
      size: 6.5
    }
  );

  /* =======================================================
     RIGHT HEADER GRID
  ======================================================= */

  const rightX = headerDividerX;

  const rightCellWidth =
    rightHeaderWidth / 2;

  const headerRowHeight =
    headerHeight / 4;

  

  const headerRows = [
    [
      "Invoice No.",
      invoiceNumber,
      "e-Way Bill No.",
      ewayBill
    ],

    [
      "Delivery Note",
      deliveryNote,
      "Dated",
      invoiceDate
    ],

    [
      "Mode/Terms of Payment",
      paymentMode,
      "Other Reference(s)",
      otherReference
    ],

    [
      "Buyer's Order No.",
      buyerOrderNo,
      "Dated",
      buyerOrderDate
    ]
  ];

  headerRows.forEach(
    (row, index) => {

      const rowY =
        y +
        index *
          headerRowHeight;

      if (index > 0) {
        drawLine(
          doc,
          rightX,
          rowY,
          rightX +
            rightHeaderWidth,
          rowY
        );
      }

      drawLine(
        doc,
        rightX +
          rightCellWidth,
        rowY,
        rightX +
          rightCellWidth,
        rowY +
          headerRowHeight
      );

      /* First label */

      write(
        doc,
        row[0],
        rightX + 3,
        rowY + 5,
        rightCellWidth / 2 - 5,
        {
          size: 6.2
        }
      );

      /* First value */

      write(
        doc,
        row[1],
        rightX +
          rightCellWidth / 2,
        rowY + 5,
        rightCellWidth / 2 - 5,
        {
          size: 6.2
        }
      );

      /* Second label */

      write(
        doc,
        row[2],
        rightX +
          rightCellWidth +
          3,
        rowY + 5,
        rightCellWidth / 2 - 5,
        {
          size: 6.2
        }
      );

      /* Second value */

      write(
        doc,
        row[3],
        rightX +
          rightCellWidth +
          rightCellWidth / 2,
        rowY + 5,
        rightCellWidth / 2 - 5,
        {
          size: 6.2
        }
      );
    }
  );

  y += headerHeight;

  /* =======================================================
   BUYER + DISPATCH DETAILS
======================================================= */

const partyHeight = 105;

const partyLeftWidth = leftHeaderWidth;

const partyRightWidth =
  WIDTH - partyLeftWidth;

drawBox(
  doc,
  LEFT,
  y,
  WIDTH,
  partyHeight
);


// =======================================================
// MAIN VERTICAL DIVIDER
// =======================================================

const partyDividerX =
  LEFT + partyLeftWidth;

drawLine(
  doc,
  partyDividerX,
  y,
  partyDividerX,
  y + partyHeight
);


// =======================================================
// BUYER - LEFT SIDE
// =======================================================

write(
  doc,
  "Buyer",
  LEFT + 7,
  y + 7,
  partyLeftWidth - 14,
  {
    bold: true,
    size: 8
  }
);

write(
  doc,
  customer.name ||
    customer.legalName ||
    "-",
  LEFT + 7,
  y + 22,
  partyLeftWidth - 14,
  {
    bold: true,
    size: 8
  }
);

write(
  doc,
  customer.address || "-",
  LEFT + 7,
  y + 38,
  partyLeftWidth - 14,
  {
    size: 7
  }
);

write(
  doc,
  `GSTIN/UIN: ${
    customer.gstin || "-"
  }`,
  LEFT + 7,
  y + 63,
  partyLeftWidth - 14,
  {
    size: 7
  }
);

write(
  doc,
  `State Name: ${
    customer.state || "-"
  }`,
  LEFT + 7,
  y + 77,
  partyLeftWidth - 14,
  {
    size: 7
  }
);


// =======================================================
// RIGHT SIDE DISPATCH GRID
// =======================================================

const dispatchX =
  partyDividerX;

const dispatchW =
  partyRightWidth;

const dispatchRowHeight =
  partyHeight / 5;


// -------------------------------------------------------
// Vertical divider inside right section
// -------------------------------------------------------

const dispatchMiddleX =
  dispatchX + dispatchW / 2;

drawLine(
  doc,
  dispatchMiddleX,
  y,
  dispatchMiddleX,
  y + partyHeight
);


// -------------------------------------------------------
// Horizontal rows
// -------------------------------------------------------

for (let i = 1; i < 5; i++) {
  drawLine(
    doc,
    dispatchX,
    y + i * dispatchRowHeight,
    dispatchX + dispatchW,
    y + i * dispatchRowHeight
  );
}


// =======================================================
// ROW 1
// =======================================================

write(
  doc,
  "Supplier's Ref.",
  dispatchX + 4,
  y + 4,
  dispatchW / 2 - 8,
  {
    bold: true,
    size: 6
  }
);

write(
  doc,
  supplierRef,
  dispatchX + 4,
  y + 12,
  dispatchW / 2 - 8,
  {
    size: 6.5
  }
);


write(
  doc,
  "Other Reference(s)",
  dispatchMiddleX + 4,
  y + 4,
  dispatchW / 2 - 8,
  {
    bold: true,
    size: 6
  }
);

write(
  doc,
  otherReference,
  dispatchMiddleX + 4,
  y + 12,
  dispatchW / 2 - 8,
  {
    size: 6.5
  }
);


// =======================================================
// ROW 2
// =======================================================

const row2Y =
  y + dispatchRowHeight;

write(
  doc,
  "Buyer's Order No.",
  dispatchX + 4,
  row2Y + 4,
  dispatchW / 2 - 8,
  {
    bold: true,
    size: 6
  }
);

write(
  doc,
  buyerOrderNo,
  dispatchX + 4,
  row2Y + 12,
  dispatchW / 2 - 8,
  {
    size: 6.5
  }
);


write(
  doc,
  "Dated",
  dispatchMiddleX + 4,
  row2Y + 4,
  dispatchW / 2 - 8,
  {
    bold: true,
    size: 6
  }
);

write(
  doc,
  buyerOrderDate,
  dispatchMiddleX + 4,
  row2Y + 12,
  dispatchW / 2 - 8,
  {
    size: 6.5
  }
);


// =======================================================
// ROW 3
// =======================================================

const row3Y =
  y + dispatchRowHeight * 2;

write(
  doc,
  "Despatch Document No.",
  dispatchX + 4,
  row3Y + 4,
  dispatchW / 2 - 8,
  {
    bold: true,
    size: 6
  }
);

write(
  doc,
  dispatchDocumentNo,
  dispatchX + 4,
  row3Y + 12,
  dispatchW / 2 - 8,
  {
    size: 6.5
  }
);


write(
  doc,
  "Delivery Note Date",
  dispatchMiddleX + 4,
  row3Y + 4,
  dispatchW / 2 - 8,
  {
    bold: true,
    size: 6
  }
);

write(
  doc,
  deliveryNoteDate,
  dispatchMiddleX + 4,
  row3Y + 12,
  dispatchW / 2 - 8,
  {
    size: 6.5
  }
);


// =======================================================
// ROW 4
// =======================================================

const row4Y =
  y + dispatchRowHeight * 3;

write(
  doc,
  "Despatched through",
  dispatchX + 4,
  row4Y + 4,
  dispatchW / 2 - 8,
  {
    bold: true,
    size: 6
  }
);

write(
  doc,
  dispatchedThrough,
  dispatchX + 4,
  row4Y + 12,
  dispatchW / 2 - 8,
  {
    size: 6.5
  }
);


write(
  doc,
  "Destination",
  dispatchMiddleX + 4,
  row4Y + 4,
  dispatchW / 2 - 8,
  {
    bold: true,
    size: 6
  }
);

write(
  doc,
  destination,
  dispatchMiddleX + 4,
  row4Y + 12,
  dispatchW / 2 - 8,
  {
    size: 6.5
  }
);


// =======================================================
// ROW 5 - TERMS OF DELIVERY
// =======================================================

const row5Y =
  y + dispatchRowHeight * 4;

write(
  doc,
  "Terms of Delivery",
  dispatchX + 4,
  row5Y + 6,
  95,
  {
    bold: true,
    size: 6.5
  }
);

write(
  doc,
  termsOfDelivery,
  dispatchX + 105,
  row5Y + 6,
  dispatchW - 110,
  {
    size: 6.5
  }
);


// =======================================================
// MOVE TO ITEMS TABLE
// =======================================================

y += partyHeight;
  /* =======================================================
   ITEMS TABLE
======================================================= */

const tableX = LEFT;

const tableW = WIDTH;

const headerH = 30;

const rowH = 40;

const columns = [
  {
    key: "serial",
    label: "S.\nNo.",
    width: 25
  },

  {
    key: "description",
    label: "Description of Goods",
    width: 155
  },

  {
    key: "hsn",
    label: "HSN/SAC",
    width: 55
  },

  {
    key: "quantity",
    label: "Quantity",
    width: 55
  },

  {
    key: "rate",
    label: "Rate",
    width: 65
  },

  {
    key: "per",
    label: "Per",
    width: 45
  },

  {
    key: "amount",
    label: "Amount",
    width:
      tableW -
      25 -
      155 -
      55 -
      55 -
      65 -
      45
  }
];


/* =======================================================
   TABLE HEADER
======================================================= */

drawBox(
  doc,
  tableX,
  y,
  tableW,
  headerH
);

let columnX = tableX;

columns.forEach(
  (column, index) => {

    if (index > 0) {

      drawLine(
        doc,
        columnX,
        y,
        columnX,
        y + headerH
      );

    }

    write(
      doc,
      column.label,
      columnX + 2,
      y + 7,
      column.width - 4,
      {
        bold: true,
        size: 6.3,
        align: "center"
      }
    );

    columnX += column.width;

  }
);

y += headerH;


/* =======================================================
   ITEM ROWS
======================================================= */

if (items.length === 0) {

  drawBox(
    doc,
    tableX,
    y,
    tableW,
    rowH
  );

  write(
    doc,
    "No items",
    tableX,
    y + 14,
    tableW,
    {
      size: 8,
      align: "center"
    }
  );

  y += rowH;

} else {

  items.forEach(
    (item, index) => {

      drawBox(
        doc,
        tableX,
        y,
        tableW,
        rowH
      );

      let cellX = tableX;

      columns.forEach(
        (
          column,
          columnIndex
        ) => {

          if (
            columnIndex > 0
          ) {

            drawLine(
              doc,
              cellX,
              y,
              cellX,
              y + rowH
            );

          }


          let value = "";


          switch (
            column.key
          ) {

            case "serial":

              value =
                index + 1;

              break;


            case "description":

              value =
                item.description ||
                item.productname ||
                item.product ||
                "-";

              break;


            case "hsn":

              value =
                item.hsn ||
                item.hsnSac ||
                "-";

              break;


            case "quantity":

              value =
                item.quantity ??
                item.qty ??
                "-";

              break;


            case "rate":

              value = money(
                item.rate || 0
              );

              break;


            case "per":

              value =
                item.per ||
                item.unit ||
                "Nos";

              break;


            case "amount": {

              const quantity =
                Number(
                  item.quantity ??
                  item.qty ??
                  0
                );


              const rate =
                Number(
                  item.rate ?? 0
                );


              const discount =
                Number(
                  item.discount ?? 0
                );


              const itemTaxableValue =
                item.taxableValue != null
                  ? Number(
                      item.taxableValue
                    )
                  : (
                      quantity * rate
                    ) - discount;


              value = money(
                itemTaxableValue
              );

              break;

            }


            default:

              value =
                item[column.key] ??
                "-";

          }


          let align = "left";


          if (
            column.key === "serial" ||
            column.key === "hsn" ||
            column.key === "quantity" ||
            column.key === "per"
          ) {

            align = "center";

          }


          if (
            column.key === "rate" ||
            column.key === "amount"
          ) {

            align = "right";

          }


          const cellPaddingLeft = 5;

          const cellPaddingRight = 7;


          write(
            doc,
            value,
            cellX + cellPaddingLeft,
            y + 8,
            column.width -
              cellPaddingLeft -
              cellPaddingRight,
            {
              bold:
                column.key === "amount",

              size: 6.8,

              align
            }
          );


          cellX +=
            column.width;

        }
      );


      y += rowH;

    }
  );

}


/* =======================================================
   TOTAL
======================================================= */
  const totalHeight =
    25;

  drawBox(
    doc,
    tableX,
    y,
    tableW,
    totalHeight
  );

  const totalLabelWidth =
    25 +
    155 +
    55 +
    55 +
    65 +
    45;

  drawLine(
    doc,
    tableX +
      totalLabelWidth,
    y,
    tableX +
      totalLabelWidth,
    y +
      totalHeight
  );

  write(
    doc,
    "Total",
    tableX + 5,
    y + 7,
    totalLabelWidth - 10,
    {
      bold: true,
      size: 8,
      align: "right"
    }
  );

  write(
    doc,
    money(grandTotal),
    tableX +
      totalLabelWidth +
      5,
    y + 7,
    tableW -
      totalLabelWidth -
      10,
    {
      bold: true,
      size: 8,
      align: "right"
    }
  );

  y += totalHeight;

  /* =======================================================
     AMOUNT CHARGEABLE IN WORDS
  ======================================================= */

  const wordsHeight =
    32;

  drawBox(
    doc,
    LEFT,
    y,
    WIDTH,
    wordsHeight
  );

  write(
    doc,
    "Amount Chargeable (in words)",
    LEFT + 5,
    y + 5,
    160,
    {
      bold: true,
      size: 6.5
    }
  );

  write(
    doc,
    invoice.amountInWords ||
      "-",
    LEFT + 5,
    y + 16,
    WIDTH - 160,
    {
      bold: true,
      size: 7
    }
  );

  write(
    doc,
    "E. & O.E",
    RIGHT - 60,
    y + 8,
    55,
    {
      bold: true,
      size: 6.5,
      align: "right"
    }
  );

  y += wordsHeight;

  /* =======================================================
     GST SUMMARY
  ======================================================= */

  const taxHeight =
    65;

  drawBox(
    doc,
    LEFT,
    y,
    WIDTH,
    taxHeight
  );

  const taxColumns = [
    {
      label: "HSN/SAC",
      width: 65
    },

    {
      label: "Taxable\nValue",
      width: 95
    },

    {
      label: "Central Tax\nRate",
      width: 60
    },

    {
      label: "Central Tax\nAmount",
      width: 75
    },

    {
      label: "State Tax\nRate",
      width: 60
    },

    {
      label: "State Tax\nAmount",
      width: 75
    },

    {
      label: "Total Tax\nAmount",
      width:
        WIDTH -
        65 -
        95 -
        60 -
        75 -
        60 -
        75
    }
  ];

  let taxX =
    LEFT;

  taxColumns.forEach(
    (column, index) => {

      if (index > 0) {
        drawLine(
          doc,
          taxX,
          y,
          taxX,
          y +
            taxHeight
        );
      }

      write(
        doc,
        column.label,
        taxX + 2,
        y + 5,
        column.width - 4,
        {
          bold: true,
          size: 5.8,
          align: "center"
        }
      );

      taxX +=
        column.width;
    }
  );

  drawLine(
    doc,
    LEFT,
    y + 28,
    RIGHT,
    y + 28
  );

  /* =======================================================
     TAX VALUES
  ======================================================= */

  const taxValues = [
  invoice.tax?.hsn ||
    items[0]?.hsn ||
    "-",

  money(taxableValue),

  igst > 0
    ? "-"
    : `${cgstRate}%`,

  igst > 0
    ? "-"
    : money(cgst),

  igst > 0
    ? "-"
    : `${sgstRate}%`,

  igst > 0
    ? "-"
    : money(sgst),

  money(
    cgst +
    sgst +
    igst
  )
];

  taxX =
    LEFT;

  taxColumns.forEach(
    (column, index) => {

      write(
        doc,
        taxValues[index],
        taxX + 2,
        y + 39,
        column.width - 4,
        {
          bold: true,
          size: 6.5,
          align: "center"
        }
      );

      taxX +=
        column.width;
    }
  );

  y += taxHeight;

  /* =======================================================
     IGST ROW IF INTERSTATE
  ======================================================= */

  if (igst > 0) {

    const igstHeight =
      20;

    drawBox(
      doc,
      LEFT,
      y,
      WIDTH,
      igstHeight
    );

    write(
      doc,
      `IGST @ ${igstRate}%`,
      LEFT + 5,
      y + 6,
      180,
      {
        bold: true,
        size: 7
      }
    );

    write(
      doc,
      money(igst),
      RIGHT - 120,
      y + 6,
      115,
      {
        bold: true,
        size: 7,
        align: "right"
      }
    );

    y += igstHeight;
  }

  /* =======================================================
     TAX AMOUNT IN WORDS
  ======================================================= */

  const taxWordsHeight =
    25;

  drawBox(
    doc,
    LEFT,
    y,
    WIDTH,
    taxWordsHeight
  );

  write(
    doc,
    "Tax Amount (in words):",
    LEFT + 5,
    y + 7,
    115,
    {
      bold: true,
      size: 6.8
    }
  );

  write(
    doc,
    invoice.taxAmountInWords ||
      "-",
    LEFT + 120,
    y + 7,
    WIDTH - 125,
    {
      size: 6.8
    }
  );

  y += taxWordsHeight;

  /* =======================================================
     DECLARATION / SIGNATURE
  ======================================================= */

  const declarationHeight =
    78;

  drawBox(
    doc,
    LEFT,
    y,
    WIDTH,
    declarationHeight
  );

  const declarationWidth =
    WIDTH * 0.55;

  drawLine(
    doc,
    LEFT +
      declarationWidth,
    y,
    LEFT +
      declarationWidth,
    y +
      declarationHeight
  );

  /* =======================================================
     DECLARATION
  ======================================================= */

  write(
    doc,
    "Declaration",
    LEFT + 7,
    y + 7,
    declarationWidth - 14,
    {
      bold: true,
      size: 7
    }
  );

  write(
    doc,
    invoice.declaration ||
      "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
    LEFT + 7,
    y + 22,
    declarationWidth - 14,
    {
      size: 6.5,
      lineGap: 2
    }
  );

  /* =======================================================
     AUTHORISED SIGNATORY
  ======================================================= */

  const signatureX =
    LEFT +
    declarationWidth;

  write(
    doc,
    `For ${
      seller.legalName ||
      seller.name ||
      company.legalName ||
      company.name ||
      ""
    }`,
    signatureX + 8,
    y + 8,
    WIDTH -
      declarationWidth -
      16,
    {
      bold: true,
      size: 7,
      align: "center"
    }
  );

  write(
    doc,
    invoice.authorisedSignatory ||
      "Authorised Signatory",
    signatureX + 8,
    y + 55,
    WIDTH -
      declarationWidth -
      16,
    {
      bold: true,
      size: 7,
      align: "right"
    }
  );

  y +=
    declarationHeight;

  /* =======================================================
     COMPUTER GENERATED FOOTER
  ======================================================= */

  write(
    doc,
    "This is a Computer Generated Invoice",
    LEFT,
    y + 7,
    WIDTH,
    {
      bold: true,
      size: 7,
      align: "center"
    }
  );
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  createInvoicePdf
};