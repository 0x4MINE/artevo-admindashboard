import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import connectDB from "@/lib/mongoConnect";
import { SellBon, SellBDetails } from "@/lib/models/sellBonModel";
import { getInfo } from "@/lib/actions/infoActions";
import { formatBillNo, formatPhone } from "@/lib/utils";
import path from "path";
import fs from "fs/promises";
import mongoose from "mongoose";
import { ToWords } from "to-words";
import {
  ISellFact,
  SellFact,
  SellFDetails,
} from "@/lib/models/sellFactureModel";

const toWords = new ToWords({
  localeCode: "fr-FR",
  converterOptions: {
    currency: true,
    ignoreDecimal: false,
    ignoreZeroCurrency: false,
    doNotAddOnly: false,
    currencyOptions: {
      name: "Dinar",
      plural: "Dinars",
      symbol: "",
      fractionalUnit: {
        name: "Centime",
        plural: "Centimes",
        symbol: "",
      },
    },
  },
});
interface LogoData {
  base64: string;
  format: string;
}

interface CompanyInfo {
  companyName?: string;
  companyDesc?: string;
  phone?: string;
  address?: string;
  rc?: string;
  nif?: string;
  nis?: string;
  art?: string;
  rib?: string;
  banque?: string;
  logoUrl?: string;
}

interface Client {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  nif?: string;
  _id: string;
}

interface ProductService {
  _id?: string;
  name?: string;
  quantity: number;
  sellPrice: number;
  tva?: number;
  type: "product" | "service";
}

interface FactureData {
  products: ProductService[];
  services: ProductService[];
  client: Client;
  total: number;
  billDate: string;
  billNo: string;
  reglement?: string;
}

const ERROR_TYPES = {
  BON_NOT_FOUND: "BON_NOT_FOUND",
  BON_DETAILS_NOT_FOUND: "BON_DETAILS_NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  PDF_GENERATION_ERROR: "PDF_GENERATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

const ERROR_MESSAGES: Record<string, string> = {
  BON_NOT_FOUND: "Sales transaction not found",
  BON_DETAILS_NOT_FOUND: "Transaction details not found",
  VALIDATION_ERROR: "Invalid request parameters",
  DATABASE_ERROR: "Database operation failed",
  PDF_GENERATION_ERROR: "Failed to generate invoice PDF",
  INTERNAL_ERROR: "An unexpected error occurred",
};

function createErrorResponse(
  errorType: string,
  message?: string,
  details?: any
): NextResponse {
  const errorMessage =
    message || ERROR_MESSAGES[errorType] || "An error occurred";

  return NextResponse.json(
    {
      error: errorMessage,
      errorType,
      ...(details && { details }),
    },
    { status: 400 }
  );
}

async function getSafeImagePath(logoUrl?: string): Promise<string | null> {
  if (!logoUrl) return null;

  const publicDir = path.join(process.cwd(), "public");
  const cleanLogoUrl = logoUrl.startsWith("/") ? logoUrl.slice(1) : logoUrl;
  const filePath = path.join(publicDir, cleanLogoUrl);

  if (!filePath.startsWith(publicDir)) {
    throw new Error("Invalid file path");
  }

  try {
    await fs.access(filePath);
    return filePath;
  } catch (error) {
    return null;
  }
}

async function loadLogoAsBase64(logoUrl: string): Promise<LogoData | null> {
  try {
    const safeImagePath = await getSafeImagePath(logoUrl);
    if (!safeImagePath) return null;

    const fileBuffer = await fs.readFile(safeImagePath);
    const fileExt = path.extname(safeImagePath).toLowerCase().slice(1);

    const formatMap: Record<string, string> = {
      png: "PNG",
      jpg: "JPEG",
      jpeg: "JPEG",
      gif: "GIF",
      bmp: "BMP",
      webp: "WEBP",
    };

    const jsPDFFormat = formatMap[fileExt];
    if (!jsPDFFormat) return null;

    const mimeType = fileExt === "jpg" ? "jpeg" : fileExt;
    const base64String = fileBuffer.toString("base64");
    const base64DataUrl = `data:image/${mimeType};base64,${base64String}`;

    return {
      base64: base64DataUrl,
      format: jsPDFFormat,
    };
  } catch (error) {
    return null;
  }
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
  const fontSize = options?.fontSize || 10;
  const rightMargin = options?.rightMargin ?? 40;
  const fontStyle = options?.fontStyle || "normal";

  doc.setFontSize(fontSize);
  doc.setFont("Helvetica", fontStyle);

  const textWidth = doc.getTextWidth(text);
  const x = pageWidth - rightMargin - textWidth;

  doc.text(text, x, y);
}

function validateFactureRequest(bonId: string | null): asserts bonId is string {
  if (!bonId) {
    throw new Error("Bon ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(bonId)) {
    throw new Error("Invalid Bon ID format");
  }
}

function validateConvertRequest(bonId: string | null) {
  if (!bonId) {
    throw new Error("Bon ID is required");
  }

  // Basic ObjectId format validation
  if (!/^[0-9a-fA-F]{24}$/.test(bonId)) {
    throw new Error("Invalid Bon ID format");
  }
}

function calculateTotals(
  products: ProductService[],
  services: ProductService[]
) {
  const productSubtotal = products.reduce(
    (sum, p) => sum + p.sellPrice * p.quantity,
    0
  );
  const serviceSubtotal = services.reduce(
    (sum, s) => sum + s.sellPrice * s.quantity,
    0
  );
  const subtotal = productSubtotal + serviceSubtotal;

  const tvaAmount = [...products, ...services].reduce((sum, item) => {
    const tvaRate = (item.tva || 0) / 100;
    return sum + item.sellPrice * item.quantity * tvaRate;
  }, 0);

  const totalTTC = subtotal + tvaAmount;

  return {
    subtotalHT: subtotal,
    tvaAmount,
    totalTTC,
  };
}

async function generateFacturePDF(
  factureData: FactureData
): Promise<ArrayBuffer> {
  try {
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    // Get company info
    const companyInfo: CompanyInfo = await getInfo();

    const generalInfo = [
      companyInfo.companyDesc || "/",
      companyInfo.address || "/",
      `Tel: ${formatPhone(companyInfo.phone || "/")}`,
      `RC No: ${companyInfo.rc || "/"}`,
      `NIF No: ${companyInfo.nif || "/"}`,
      `NIS No: ${companyInfo.nis || "/"}`,
      `ART No: ${companyInfo.art || "/"}`,
      `RIB No: ${companyInfo.rib || "/"}`,
      companyInfo.banque || "/",
    ];

    const billInfo = [
      `FACTURE No ${factureData.billNo}`,
      `Date: ${new Date(factureData.billDate).toLocaleDateString("fr-FR")}`,
      `Reglement: ${factureData.reglement || "Cheque"}`,
    ];

    const clientInfo = [
      `Addressee a: ${factureData.client.name || "N/A"}`,
      `Address: ${factureData.client.address || "N/A"}`,
      `Tel: ${formatPhone(factureData.client.phone || "N/A")}`,
      `NIF: ${factureData.client.nif || "N/A"}`,
    ];

    const [generalInfoX, generalInfoY] = [40, 70];
    const [billInfoX, billInfoY] = [40, 70 + generalInfo.length * 16];
    const [imgX, imgY, imgW, imgH] = [400, 40, 80, 80];
    const [clientInfoX, clientInfoY] = [350, 70 + generalInfo.length * 16];
    const [billType, billTypeX, billTypeY] = [
      "Facture",
      imgX,
      imgY + imgH + 52,
    ];

    const headColor = "#BFDEFF";
    const [tableX, tableY] = [40, billTypeY + 120];

    // Company name (keeping original style)
    doc.setFontSize(22);
    doc.setFont("", "", "bold");
    doc.text(companyInfo.companyName || "ARTEVO", 40, 50);

    // General info
    doc.setFont("", "", "regular");
    doc.setFontSize(9);
    generalInfo.map((item, index) => {
      doc.text(item, generalInfoX, generalInfoY + index * 14);
    });

    // Bill info
    doc.setFont("", "", "bold");
    billInfo.map((info, index) => {
      doc.text(info, billInfoX, billInfoY + index * 14);
    });

    // Client info
    clientInfo.map((info, index) => {
      doc.text(info, clientInfoX, clientInfoY + index * 14);
    });

    // Logo (keeping original style)
    if (companyInfo.logoUrl) {
      try {
        const logoData = await loadLogoAsBase64(companyInfo.logoUrl);
        if (logoData) {
          doc.addImage(
            logoData.base64,
            logoData.format,
            imgX,
            imgY,
            imgW,
            imgH
          );
        }
      } catch (logoError) {
        // Fallback to default logo path
        try {
          const filePath = path.join(process.cwd(), "public", "minilogo.png");
          const imageBuffer = await fs.readFile(filePath);
          const base64Image = imageBuffer.toString("base64");

          doc.addImage(
            `data:image/png;base64,${base64Image}`,
            "PNG",
            imgX,
            imgY,
            imgW,
            imgH
          );
        } catch (fallbackError) {
          // Silently fail if both logo attempts fail
        }
      }
    }

    // Bill type
    doc.setFontSize(20);
    doc.text(billType, billTypeX, billTypeY);

    // Bill type Rectangle
    //doc.rect(380, 150, 115, 30);

    // Prepare table data
    const productsHeaders = [["Product", "Qty", "Price", "TVA", "Total"]];
    const servicesHeaders = [["Services", "Qty", "Price", "TVA", "Total"]];

    // Format products data (keeping original style)
    const products = factureData.products.map((p) => [
      p.name || "Unknown Product",
      p.quantity.toString(),
      `${p.sellPrice.toFixed(2)} DA`,
      `${p.tva || 0}%`,
      `${(p.sellPrice * p.quantity * (1 + (p.tva || 0) / 100)).toFixed(2)} DA`,
    ]);

    // Format services data (keeping original style)
    const services = factureData.services.map((s) => [
      s.name || "Unknown Service",
      s.quantity.toString(),
      `${s.sellPrice.toFixed(2)} DA`,
      `${s.tva || 0}%`,
      `${(s.sellPrice * s.quantity * (1 + (s.tva || 0) / 100)).toFixed(2)} DA`,
    ]);

    // Add totals row for products
    if (products.length > 0) {
      const productsTotal = factureData.products.reduce(
        (sum, p) => sum + p.sellPrice * p.quantity * (1 + (p.tva || 0) / 100),
        0
      );

      products.push([
        { content: "", styles: { lineWidth: 0 } },
        { content: "", styles: { lineWidth: 0 } },
        { content: "", styles: { lineWidth: 0 } },
        {
          content: "Total",
          styles: {
            fontStyle: "bold",
            valign: "middle",
            halign: "center",
            lineWidth: 1.2,
            lineColor: "black",
          },
        },
        {
          content: `${productsTotal.toFixed(2)} DA`,
          styles: { fontStyle: "bold", halign: "center" },
        },
      ]);
    }

    // Add totals row for services
    if (services.length > 0) {
      const servicesTotal = factureData.services.reduce(
        (sum, p) => sum + p.sellPrice * p.quantity * (1 + (p.tva || 0) / 100),
        0
      );

      services.push([
        { content: "", styles: { lineWidth: 0 } },
        { content: "", styles: { lineWidth: 0 } },
        { content: "", styles: { lineWidth: 0 } },
        {
          content: "Total",
          styles: {
            fontStyle: "bold",
            valign: "middle",
            halign: "center",
            lineWidth: 1.2,
            lineColor: "black",
          },
        },
        {
          content: `${servicesTotal.toFixed(2)} DA`,
          styles: { fontStyle: "bold", halign: "center" },
        },
      ]);
    }

    let currentY = tableY;

    // Products table (keeping original style)
    if (products.length > 0) {
      doc.setFont("", "", "regular");
      doc.setFontSize(14);
      doc.text("Produits", tableX, currentY);
      autoTable(doc, {
        startY: currentY + 10,
        head: productsHeaders,
        body: products,
        bodyStyles: {
          valign: "middle",
          halign: "center",
          lineWidth: 1.2,
          lineColor: "black",
        },
        theme: "plain",
        columnStyles: {
          0: {
            cellWidth: "auto",
            cellPadding: 10.5,
            valign: "middle",
            halign: "left",
          },
          1: { cellWidth: 40 },
          2: { cellWidth: 85 },
          3: { cellWidth: 50 },
          4: { cellWidth: 90 },
        },
        styles: { fontSize: 10, overflow: "linebreak" },
        headStyles: {
          fillColor: headColor,
          textColor: "black",
          valign: "middle",
          halign: "center",
          lineWidth: 1.2,
          lineColor: "black",
        },
      });
      currentY = (doc as any).lastAutoTable.finalY + 35;
    }

    // Services table (keeping original style)
    if (services.length > 0) {
      doc.text("Services", tableX, currentY);
      autoTable(doc, {
        startY: currentY + 10,
        head: servicesHeaders,
        body: services,
        bodyStyles: {
          valign: "middle",
          halign: "center",
          lineWidth: 1.2,
          lineColor: "black",
          textColor: "black",
        },
        theme: "plain",
        columnStyles: {
          0: {
            cellWidth: "auto",
            cellPadding: 10.5,
            valign: "middle",
            halign: "left",
          },
          1: { cellWidth: 40 },
          2: { cellWidth: 85 },
          3: { cellWidth: 50 },
          4: { cellWidth: 90 },
        },
        styles: { fontSize: 10, overflow: "linebreak" },
        headStyles: {
          fillColor: headColor,
          textColor: "black",
          valign: "middle",
          halign: "center",
          lineWidth: 1.2,
          lineColor: "black",
        },
      });
      currentY = (doc as any).lastAutoTable.finalY + 40;
    }

    // Calculate final totals
    const totals = calculateTotals(factureData.products, factureData.services);

    // Final totals table (keeping original style)
    if (factureData.products.length > 0 || factureData.services.length > 0) {
      const pageWidth = doc.internal.pageSize.getWidth();
      const totalTableWidth = 100 + 85 + 85;
      const rightPadding = 40;

      autoTable(doc, {
        margin: { left: pageWidth - totalTableWidth - rightPadding },
        startY: currentY,
        head: [["Total hors taxes", "TVA", "Total T.T.C"]],
        body: [
          [
            `${totals.subtotalHT.toFixed(2)} DA`,
            `${totals.tvaAmount.toFixed(2)} DA`,
            `${totals.totalTTC.toFixed(2)} DA`,
          ],
        ],
        bodyStyles: {
          valign: "middle",
          halign: "center",
          lineWidth: 1.2,
          lineColor: "black",
        },
        theme: "plain",
        columnStyles: {
          0: { cellPadding: 10.5, cellWidth: 100 },
          1: { cellWidth: 85 },
          2: { cellWidth: 85 },
        },
        tableWidth: "wrap",
        styles: { fontSize: 10, overflow: "linebreak" },
        headStyles: {
          fillColor: headColor,
          textColor: "black",
          valign: "middle",
          halign: "center",
          lineWidth: 1.2,
          lineColor: "black",
        },
      });

      // Net to pay (keeping original style)
      doc.setFont("helvetica", "bold");
      drawRightAlignedText(
        doc,
        `Net a payer: ${totals.totalTTC.toFixed(2)} DZD`,
        (doc as any).lastAutoTable.finalY + 30,
        { fontStyle: "bold", rightMargin: 45 }
      );

      // Footer text (keeping original style)
      doc.text(
        "La presente facture est arretee en TTC a la somme de:",
        40,
        (doc as any).lastAutoTable.finalY + 80
      );
      doc.setFont("", "normal");
      doc.text(
        `${toWords.convert(totals.totalTTC)}`,
        40,
        (doc as any).lastAutoTable.finalY + 92
      );
    }

    return doc.output("arraybuffer");
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error(`Failed to generate PDF: ${error}`);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bonId = searchParams.get("bonId");

    // Validate request
    validateConvertRequest(bonId);

    await connectDB();

    // Fetch bon data with populated client
    const bon = await SellBon.findById(bonId).populate("clientId");
    if (!bon) {
      return createErrorResponse(
        ERROR_TYPES.BON_NOT_FOUND,
        "Sales transaction not found"
      );
    }

    // Fetch bon details
    const bonDetails = await SellBDetails.find({ sellBonId: bonId });
    if (!bonDetails.length) {
      return createErrorResponse(
        ERROR_TYPES.BON_DETAILS_NOT_FOUND,
        "Transaction details not found"
      );
    }

    // Check if SellFact already exists for this bon
    const originalCode = `BON-${bon.sellBonId}`;
    let existingSellFact = await SellFact.findOne({ originalCode }).populate(
      "clientId"
    );

    console.log("existingSellFact:", existingSellFact);
    let savedSellFact;
    let savedFactDetails;

    if (existingSellFact) {
      // Use existing SellFact
      savedSellFact = existingSellFact;
      // Fetch existing details
      savedFactDetails = await SellFDetails.find({
        sellFactId: existingSellFact._id,
      });
    } else {
      // Create new SellFact
      const newSellFact = new SellFact({
        userId: bon.userId,
        clientId: bon.clientId,
        date: new Date(),
        reglement: bon.reglement,
        originalCode,
        type: "sale",
      });

      savedSellFact = await newSellFact.save();

      // Create SellFDetails from SellBDetails
      const factDetails = bonDetails.map((detail) => ({
        sellFactId: savedSellFact._id,
        name: detail.name,
        quantity: detail.quantity,
        price: detail.price,
        type: detail.type,
        tva: detail.tva || 0,
      }));

      // Insert all details
      savedFactDetails = await SellFDetails.insertMany(factDetails);
    }

    // Fetch the complete SellFact with populated data
    const completeSellFact = savedSellFact.clientId
      ? savedSellFact
      : await SellFact.findById(savedSellFact._id).populate("clientId");

    // Prepare facture data
    const products = savedFactDetails
      .filter((d) => d.type === "product")
      .map((d) => ({
        _id: d._id,
        name: d.name,
        quantity: d.quantity,
        sellPrice: d.price,
        tva: d.tva || 0,
        type: "product" as const,
      }));

    const services = savedFactDetails
      .filter((d) => d.type === "service")
      .map((d) => ({
        _id: d._id,
        name: d.name,
        quantity: d.quantity,
        sellPrice: d.price,
        tva: d.tva || 0,
        type: "service" as const,
      }));

    const client = {
      name: completeSellFact.clientId?.name || "N/A",
      phone: completeSellFact.clientId?.phone,
      email: completeSellFact.clientId?.email,
      address: completeSellFact.clientId?.address,
      nif: completeSellFact.clientId?.nif,
      _id: completeSellFact.clientId?._id,
    };

    const total = savedFactDetails.reduce(
      (sum, d) => sum + d.price * d.quantity,
      0
    );
    const billDate = completeSellFact.date.toISOString().split("T")[0];
    const billNo = formatBillNo(completeSellFact.sellFactId);

    const factureData = {
      products,
      services,
      client,
      total,
      billDate,
      billNo,
      reglement: completeSellFact.reglement,
    };

    // Generate PDF
    const buffer = await generateFacturePDF(factureData);

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=facture-${billNo}.pdf`,
        // "Cache-Control": "public, max-age=3600",
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error("Convert Bon to Fact error:", error);

    // Handle validation errors
    if (
      error.message.includes("Bon ID is required") ||
      error.message.includes("Invalid Bon ID format")
    ) {
      return createErrorResponse(ERROR_TYPES.VALIDATION_ERROR, error.message);
    }

    // Handle database errors
    if (error.name === "ValidationError") {
      return createErrorResponse(
        ERROR_TYPES.VALIDATION_ERROR,
        `Database validation error: ${error.message}`
      );
    }

    if (error.name === "CastError") {
      return createErrorResponse(
        ERROR_TYPES.VALIDATION_ERROR,
        "Invalid ID format provided"
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return createErrorResponse(
        ERROR_TYPES.INTERNAL_ERROR,
        "A fact with similar data already exists"
      );
    }

    // Handle PDF generation errors
    if (error.message.includes("Failed to generate PDF")) {
      return createErrorResponse(ERROR_TYPES.INTERNAL_ERROR, error.message);
    }

    // Generic error fallback
    return createErrorResponse(
      ERROR_TYPES.INTERNAL_ERROR,
      "An unexpected error occurred while converting bon to fact"
    );
  }
}
export async function POST(req: NextRequest) {
  const { bonId, reglement, billType } = await req.json();
  validateFactureRequest(bonId);

  await connectDB();

  const bon = await SellBon.findById(bonId).populate("clientId");
  if (!bon) {
    return createErrorResponse(
      ERROR_TYPES.BON_NOT_FOUND,
      "Sales transaction not found"
    );
  }

  const details = await SellBDetails.find({ sellBonId: bonId });
  if (!details.length) {
    return createErrorResponse(
      ERROR_TYPES.BON_DETAILS_NOT_FOUND,
      "Transaction details not found"
    );
  }

  const facture = await SellFact.create({
    date: bon.date,
    userId: bon.userId,
    clientId: bon.clientId,
    reglement: reglement ?? "cash",
    type: billType,
  });
  const products = details
    .filter((d) => d.type === "product")
    .map((d) => ({
      _id: d._id,
      name: d.name,
      quantity: d.quantity,
      sellPrice: d.price,
      tva: d.tva || 0,
      type: "product" as const,
    }));

  const services = details
    .filter((d) => d.type === "service")
    .map((d) => ({
      _id: d._id,
      name: d.name,
      quantity: d.quantity,
      sellPrice: d.price,
      tva: d.tva || 0,
      type: "service" as const,
    }));
}
