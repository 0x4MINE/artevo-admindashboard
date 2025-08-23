import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import path from "path";
import fs from "fs";
import { formatPhone } from "@/lib/utils";
import { Proforma, SellPDetails } from "@/lib/models/sellProformaModel";

// Configuration constants
const CONFIG = {
  margins: {
    right: 40,
    left: 40,
    top: 50,
  },
  colors: {
    header: "#BFDEFF",
    text: "#000000",
    border: "#000000",
  },
  fonts: {
    default: "Helvetica",
    sizes: {
      small: 9,
      medium: 14,
      large: 20,
      xl: 22,
    },
  },
  table: {
    columnWidths: {
      designation: "auto",
      quantity: 40,
      unitPrice: 85,
      amount: 90,
    },
    cellPadding: 10.5,
  },
} as const;

interface Product {
  prod_name: string;
  quantity: number;
  sellPrice: number;
}

interface Service {
  name: string;
  quantity?: number;
  sellPrice: number;
}

interface Client {
  name?: string;
  email?: string;
  phone?: string;
  nif?: string;
}

interface InvoiceData {
  products: Product[];
  services: Service[];
  client: Client;
  total: number;
  billDate: string;
  billNo: string;
  userId: string;
}

function validateInvoiceData(data: any): data is InvoiceData {
  if (!data || typeof data !== "object") return false;

  // Validate required fields
  if (typeof data.total !== "number" || data.total < 0) return false;
  if (
    typeof data.billDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data.billDate)
  )
    return false;
  if (!data.client || typeof data.client !== "object") return false;

  // Validate products array
  if (!Array.isArray(data.products)) return false;
  for (const product of data.products) {
    if (typeof product.prod_name !== "string") return false;
    if (typeof product.quantity !== "number" || product.quantity < 0)
      return false;
    if (typeof product.sellPrice !== "number" || product.sellPrice < 0)
      return false;
  }

  // Validate services array
  if (!Array.isArray(data.services)) return false;
  for (const service of data.services) {
    if (typeof service.name !== "string") return false;
    if (
      service.quantity !== undefined &&
      (typeof service.quantity !== "number" || service.quantity < 1)
    )
      return false;
    if (typeof service.sellPrice !== "number" || service.sellPrice < 0)
      return false;
  }

  return true;
}

function drawRightAlignedText(
  doc: jsPDF,
  text: string,
  y: number,
  options?: {
    rightMargin?: number;
    fontSize?: number;
    fontStyle?: "normal" | "bold" | "italic";
  }
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const fontSize = options?.fontSize || CONFIG.fonts.sizes.small;
  const rightMargin = options?.rightMargin ?? CONFIG.margins.right;
  const fontStyle = options?.fontStyle || "normal";

  doc.setFontSize(fontSize);
  doc.setFont(CONFIG.fonts.default, fontStyle);

  const textWidth = doc.getTextWidth(text);
  const x = pageWidth - rightMargin - textWidth;

  doc.text(text, x, y);
}

function formatTableData(
  items: Array<Product | Service>
): Array<Array<string | number | { content: any; styles: any }>> {
  return items.map((item) => [
    "prod_name" in item ? item.prod_name : item.name,
    item.quantity ?? 1,
    item.sellPrice,
    (item.quantity ?? 1) * item.sellPrice,
  ]);
}

function calculateSubtotal(
  items: Array<Array<string | number | { content: any; styles: any }>>
): number {
  return items.reduce(
    (sum, row) => sum + (typeof row[3] === "number" ? row[3] : 0),
    0
  );
}

function getSafeImagePath(): string {
  const publicDir = path.join(process.cwd(), "public");
  const filePath = path.join(publicDir, "minilogo.png");

  // Security check to prevent directory traversal
  if (!filePath.startsWith(publicDir)) {
    throw new Error("Invalid file path");
  }

  return filePath;
}

export async function POST(req: NextRequest) {
  try {
    const requestData = await req.json();

    // Validate input data
    if (!validateInvoiceData(requestData)) {
      return NextResponse.json(
        { error: "Invalid invoice data" },
        { status: 400 }
      );
    }

    const {
      products: rProducts,
      services: rServices,
      client,
      total,
      billDate,
      billNo,
      userId,
    } = requestData;

    // Format data
    const formattedProducts = formatTableData(rProducts);
    const formattedServices = formatTableData(rServices);

    const productsSubtotal = calculateSubtotal(formattedProducts);
    const servicesSubtotal = calculateSubtotal(formattedServices);


    const proforma = await Proforma.create({
      date: billDate,
      userId,
      clientId: client._id,
    });

    const details = [
      ...formattedProducts.map((p) => ({
        proformaId: proforma._id,
        name: p[0],
        quantity: p[1],
        price: p[2],
        type: "product",
      })),
      ...formattedServices.map((s) => ({
        proformaId: proforma._id,
        name: s[0],
        quantity: 1,

        price: s[2],
        type: "service",
      })),
    ];

    console.log(details);

    await SellPDetails.insertMany(details);


    const doc = new jsPDF({ unit: "pt", format: "a4" });

    // Company information
    const generalInfo = [
      "Advertising Agency",
      "En face baladia, Ain Oulmene, Setif",
      "Tel: 07 78 50 99 97",
      "RC No: 99A0430591",
      "NIF No: 197219280039720",
      "NIS No: 197219280039720",
      "ART No: 19280867049",
      "RIB No: 004003514000922211/85",
      "Credit Populiare Algerien CPA, Agence de Ain Oulmene",
    ];

    // Bill information
    const billDateFormatted = billDate.split("-").join("/");
    const billInfo = [`FACTURE No ${billNo}`, `Date: ${billDateFormatted}`];

    // Client information
    const clientInfo = [
      `Addressee a: ${client.name ?? "/"}`,
      `Email: ${client.email ?? "/"}`,
      `Tel: ${client.phone ? formatPhone(client.phone) : "/"}`,
      `NIF: ${client.nif ?? "/"}`,
    ];

    // Layout positions
    const [generalInfoX, generalInfoY] = [CONFIG.margins.left, 70];
    const [billInfoX, billInfoY] = [
      CONFIG.margins.left,
      70 + generalInfo.length * 16,
    ];
    const [imgX, imgY, imgW, imgH] = [370, 10, 120, 120];
    const [clientInfoX, clientInfoY] = [350, 70 + generalInfo.length * 16];
    const [billType, billTypeX, billTypeY] = [
      "Proforma",
      imgX + 10,
      imgY + imgH + 47,
    ];
    const [table, tableX, tableY] = [
      "Produits",
      CONFIG.margins.left,
      billTypeY + 120,
    ];

    // Draw company header
    doc.setFontSize(CONFIG.fonts.sizes.xl);
    doc.setFont(CONFIG.fonts.default, "bold");
    doc.text("ARTEVO", CONFIG.margins.left, 50);

    // Draw general info
    doc.setFont(CONFIG.fonts.default, "normal");
    doc.setFontSize(CONFIG.fonts.sizes.small);
    generalInfo.forEach((item, index) => {
      doc.text(item, generalInfoX, generalInfoY + index * 14);
    });

    // Draw bill info
    doc.setFont(CONFIG.fonts.default, "bold");
    billInfo.forEach((info, index) => {
      doc.text(info, billInfoX, billInfoY + index * 14);
    });

    // Draw client info
    clientInfo.forEach((info, index) => {
      doc.text(info, clientInfoX, clientInfoY + index * 14);
    });

    // Add logo
    try {
      const filePath = getSafeImagePath();
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString("base64");
      doc.addImage(
        `data:image/png;base64,${base64Image}`,
        "PNG",
        imgX,
        imgY,
        imgW,
        imgH
      );
    } catch (error) {
      console.warn("Logo image not found, proceeding without it");
    }

    // Draw bill type
    doc.setFontSize(CONFIG.fonts.sizes.large);
    doc.text(billType, billTypeX, billTypeY);

    // Prepare table data with totals
    const productsTableData = [
      ...formattedProducts,
      [
        { content: "", styles: { lineWidth: 0 } },
        { content: "", styles: { lineWidth: 0 } },
        {
          content: "Total",
          styles: {
            fontStyle: "bold",
            valign: "middle",
            halign: "center",
            lineWidth: 1.2,
            lineColor: CONFIG.colors.border,
          },
        },
        {
          content: productsSubtotal,
          styles: { fontStyle: "bold", halign: "center" },
        },
      ],
    ];

    const servicesTableData = [
      ...formattedServices,
      [
        { content: "", styles: { lineWidth: 0 } },
        { content: "", styles: { lineWidth: 0 } },
        {
          content: "Total",
          styles: {
            fontStyle: "bold",
            valign: "middle",
            halign: "center",
            lineWidth: 1.2,
            lineColor: CONFIG.colors.border,
          },
        },
        {
          content: servicesSubtotal,
          styles: { fontStyle: "bold", halign: "center" },
        },
      ],
    ];

    const tableHeaders = [
      ["Designation", "Qte", "Prix unitaire hors taxes", "Montant"],
    ];

    // Draw products table
    if (formattedProducts.length > 0) {
      doc.setFont(CONFIG.fonts.default, "normal");
      doc.setFontSize(CONFIG.fonts.sizes.medium);
      doc.text(table, tableX, tableY);

      autoTable(doc, {
        startY: tableY + 10,
        head: tableHeaders,
        body: productsTableData,
        bodyStyles: {
          valign: "middle",
          halign: "center",
          lineWidth: 1.2,
          lineColor: CONFIG.colors.border,
        },
        theme: "plain",
        columnStyles: {
          0: {
            cellWidth: CONFIG.table.columnWidths.designation,
            cellPadding: CONFIG.table.cellPadding,
            valign: "middle",
            halign: "left",
          },
          1: { cellWidth: CONFIG.table.columnWidths.quantity },
          2: { cellWidth: CONFIG.table.columnWidths.unitPrice },
          3: { cellWidth: CONFIG.table.columnWidths.amount },
        },
        styles: { fontSize: CONFIG.fonts.sizes.small, overflow: "linebreak" },
        headStyles: {
          fillColor: CONFIG.colors.header,
          textColor: CONFIG.colors.text,
          valign: "middle",
          halign: "center",
          lineWidth: 1.2,
          lineColor: CONFIG.colors.border,
        },
      });
    }

    // Draw services table
    if (formattedServices.length > 0) {
      const servicesStartY =
        doc.lastAutoTable?.finalY !== undefined
          ? doc.lastAutoTable.finalY + 35
          : tableY + 10;
      doc.setFont(CONFIG.fonts.default, "normal");
      doc.setFontSize(CONFIG.fonts.sizes.medium);
      doc.text("Services", tableX, servicesStartY);

      autoTable(doc, {
        startY: servicesStartY + 10,
        head: tableHeaders,
        body: servicesTableData,
        bodyStyles: {
          valign: "middle",
          halign: "center",
          lineWidth: 1.2,
          lineColor: CONFIG.colors.border,
          textColor: CONFIG.colors.text,
        },
        theme: "plain",
        columnStyles: {
          0: {
            cellWidth: CONFIG.table.columnWidths.designation,
            cellPadding: CONFIG.table.cellPadding,
            valign: "middle",
            halign: "left",
          },
          1: { cellWidth: CONFIG.table.columnWidths.quantity },
          2: { cellWidth: CONFIG.table.columnWidths.unitPrice },
          3: { cellWidth: CONFIG.table.columnWidths.amount },
        },
        styles: { fontSize: CONFIG.fonts.sizes.small, overflow: "linebreak" },
        headStyles: {
          fillColor: CONFIG.colors.header,
          textColor: CONFIG.colors.text,
          valign: "middle",
          halign: "center",
          lineWidth: 1.2,
          lineColor: CONFIG.colors.border,
        },
      });
    }

    // Draw total table
    if (formattedProducts.length > 0 || formattedServices.length > 0) {
      const pageWidth = doc.internal.pageSize.getWidth();
      const totalTableWidth = 100;

      autoTable(doc, {
        margin: { left: pageWidth - totalTableWidth - CONFIG.margins.right },
        startY:
          doc.lastAutoTable?.finalY !== undefined
            ? doc.lastAutoTable.finalY + 40
            : tableY + 10,
        head: [["Total hors taxes"]],
        body: [[total]],
        bodyStyles: {
          valign: "middle",
          halign: "center",
          lineWidth: 1.2,
          lineColor: CONFIG.colors.border,
        },
        theme: "plain",
        columnStyles: {
          0: {
            cellPadding: CONFIG.table.cellPadding,
            cellWidth: totalTableWidth,
          },
        },
        tableWidth: "wrap",
        styles: { fontSize: CONFIG.fonts.sizes.small, overflow: "linebreak" },
        headStyles: {
          fillColor: CONFIG.colors.header,
          textColor: CONFIG.colors.text,
          valign: "middle",
          halign: "center",
          lineWidth: 1.2,
          lineColor: CONFIG.colors.border,
        },
      });
    }

    const buffer = doc.output("arraybuffer");

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=proforma-${Date.now()}.pdf`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
