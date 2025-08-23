import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import path from "path";
import fs from "fs";
import { formatBillNo, formatPhone } from "@/lib/utils";
import { Proforma, SellPDetails } from "@/lib/models/sellProformaModel";
import connectDB from "@/lib/mongoConnect";
import { getInfo } from "@/lib/actions/infoActions";

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

interface CompanyInfo {
  companyName?: string;
  companyDesc?: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  rc?: string;
  nif?: string;
  nis?: string;
  art?: string;
  rib?: string;
  banque?: string;
}

function validateInvoiceData(data: any): data is InvoiceData {
  console.log("🔍 Validating invoice data:", JSON.stringify(data, null, 2));
  
  if (!data || typeof data !== "object") {
    console.error("❌ Data is not an object");
    return false;
  }

  // Validate required fields
  if (typeof data.total !== "number" || data.total < 0) {
    console.error("❌ Invalid total:", data.total);
    return false;
  }
  if (
    typeof data.billDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data.billDate)
  ) {
    console.error("❌ Invalid billDate:", data.billDate);
    return false;
  }
  if (!data.client || typeof data.client !== "object") {
    console.error("❌ Invalid client:", data.client);
    return false;
  }

  // Validate products array
  if (!Array.isArray(data.products)) {
    console.error("❌ Products is not an array:", data.products);
    return false;
  }
  for (const product of data.products) {
    if (typeof product.prod_name !== "string") {
      console.error("❌ Invalid product name:", product);
      return false;
    }
    if (typeof product.quantity !== "number" || product.quantity < 0) {
      console.error("❌ Invalid product quantity:", product);
      return false;
    }
    if (typeof product.sellPrice !== "number" || product.sellPrice < 0) {
      console.error("❌ Invalid product price:", product);
      return false;
    }
  }

  // Validate services array
  if (!Array.isArray(data.services)) {
    console.error("❌ Services is not an array:", data.services);
    return false;
  }
  for (const service of data.services) {
    if (typeof service.name !== "string") {
      console.error("❌ Invalid service name:", service);
      return false;
    }
    if (
      service.quantity !== undefined &&
      (typeof service.quantity !== "number" || service.quantity < 1)
    ) {
      console.error("❌ Invalid service quantity:", service);
      return false;
    }
    if (typeof service.sellPrice !== "number" || service.sellPrice < 0) {
      console.error("❌ Invalid service price:", service);
      return false;
    }
  }

  console.log("✅ Invoice data validation passed");
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
  console.log("📊 Formatting table data for items:", items.length);
  const formatted = items.map((item) => [
    "prod_name" in item ? item.prod_name : item.name,
    item.quantity ?? 1,
    item.sellPrice,
    (item.quantity ?? 1) * item.sellPrice,
  ]);
  console.log("📊 Formatted data:", formatted);
  return formatted;
}

function calculateSubtotal(
  items: Array<Array<string | number | { content: any; styles: any }>>
): number {
  const subtotal = items.reduce(
    (sum, row) => sum + (typeof row[3] === "number" ? row[3] : 0),
    0
  );
  console.log("💰 Calculated subtotal:", subtotal);
  return subtotal;
}

function getSafeImagePath(logoUrl: string | undefined): string | null {
  console.log("🖼️ Processing logo URL:", logoUrl);
  
  if (!logoUrl) {
    console.warn("⚠️ No logo URL provided");
    return null;
  }
  
  const publicDir = path.join(process.cwd(), "public");
  console.log("📁 Public directory:", publicDir);
  
  // Clean the logoUrl - remove leading slash if present
  const cleanLogoUrl = logoUrl.startsWith('/') ? logoUrl.slice(1) : logoUrl;
  console.log("🧹 Cleaned logo URL:", cleanLogoUrl);
  
  const filePath = path.join(publicDir, cleanLogoUrl);
  console.log("📂 Full file path:", filePath);

  // Security check to prevent directory traversal
  if (!filePath.startsWith(publicDir)) {
    console.error("🚫 Security violation: Invalid file path");
    throw new Error("Invalid file path");
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Logo file not found: ${filePath}`);
    // List files in the directory for debugging
    try {
      const dirContents = fs.readdirSync(path.dirname(filePath));
      console.log("📁 Directory contents:", dirContents);
    } catch (err) {
      console.error("❌ Failed to read directory:", err);
    }
    return null;
  }

  console.log("✅ Logo file found and accessible");
  return filePath;
}

function formatCompanyInfo(info: CompanyInfo | null): string[] {
  console.log("🏢 Formatting company info:", info);
  return [
    info?.companyDesc || "/",
    info?.address || "/",
    `Tel: ${formatPhone(info?.phone) || "/"}`,
    `RC No: ${info?.rc || "/"}`,
    `NIF No: ${info?.nif || "/"}`,
    `NIS No: ${info?.nis || "/"}`,
    `ART No: ${info?.art || "/"}`,
    `RIB No: ${info?.rib || "/"}`,
    info?.banque || "Credit Populiare Algerien CPA, Agence de Ain Oulmene",
  ];
}

async function generatePDF(
  products: Product[],
  services: Service[],
  client: Client,
  total: number,
  billDate: string,
  billNo: string
): Promise<ArrayBuffer> {
  console.log("📄 Starting PDF generation");
  console.log("📊 Products:", products.length, "Services:", services.length);
  console.log("👤 Client:", client);
  console.log("💰 Total:", total);
  console.log("📅 Bill Date:", billDate);
  console.log("🔢 Bill No:", billNo);

  // Format data
  const formattedProducts = formatTableData(products);
  const formattedServices = formatTableData(services);

  const productsSubtotal = calculateSubtotal(formattedProducts);
  const servicesSubtotal = calculateSubtotal(formattedServices);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  console.log("📄 PDF document created");

  // Fetch company information
  let companyInfo: CompanyInfo | null = null;
  try {
    console.log("🏢 Fetching company information...");
    companyInfo = await getInfo();
    console.log("🏢 Company info retrieved:", JSON.stringify(companyInfo, null, 2));
  } catch (error) {
    console.error("❌ Failed to fetch company info:", error);
  }

  // Company information
  const generalInfo = formatCompanyInfo(companyInfo);

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
  console.log("✍️ Drawing company header");
  doc.setFontSize(CONFIG.fonts.sizes.xl);
  doc.setFont(CONFIG.fonts.default, "bold");
  doc.text(companyInfo?.companyName || "Company Name", CONFIG.margins.left, 50);

  // Draw general info
  console.log("✍️ Drawing general info");
  doc.setFont(CONFIG.fonts.default, "normal");
  doc.setFontSize(CONFIG.fonts.sizes.small);
  generalInfo.forEach((item, index) => {
    doc.text(item, generalInfoX, generalInfoY + index * 14);
  });

  // Draw bill info
  console.log("✍️ Drawing bill info");
  doc.setFont(CONFIG.fonts.default, "bold");
  billInfo.forEach((info, index) => {
    doc.text(info, billInfoX, billInfoY + index * 14);
  });

  // Draw client info
  console.log("✍️ Drawing client info");
  clientInfo.forEach((info, index) => {
    doc.text(info, clientInfoX, clientInfoY + index * 14);
  });

  // Add logo - ENHANCED WITH DEBUGGING
  console.log("🖼️ Starting logo processing...");
  try {
    const logoPath = getSafeImagePath(companyInfo?.logoUrl);
    
    if (logoPath) {
      console.log("📂 Reading image file from:", logoPath);
      
      // Get file stats for debugging
      const stats = fs.statSync(logoPath);
      console.log("📊 File stats:", {
        size: stats.size,
        isFile: stats.isFile(),
        modified: stats.mtime
      });
      
      const imageBuffer = fs.readFileSync(logoPath);
      console.log("💾 Image buffer size:", imageBuffer.length, "bytes");
      
      const base64Image = imageBuffer.toString("base64");
      console.log("🔤 Base64 string length:", base64Image.length);
      
      // Determine image format from file extension
      const fileExtension = path.extname(logoPath).toLowerCase().slice(1);
      console.log("🏷️ File extension detected:", fileExtension);
      
      let imageFormat = fileExtension;
      
      // Map common extensions to proper MIME types
      switch (fileExtension) {
        case 'jpg':
        case 'jpeg':
          imageFormat = 'JPEG';
          break;
        case 'png':
          imageFormat = 'PNG';
          break;
        case 'gif':
          imageFormat = 'GIF';
          break;
        case 'webp':
          imageFormat = 'WEBP';
          break;
        default:
          console.warn(`⚠️ Unsupported image format: ${fileExtension}, defaulting to PNG`);
          imageFormat = 'PNG';
      }
      
      console.log("🖼️ Using image format:", imageFormat);
      console.log("📐 Image position and size:", { x: imgX, y: imgY, width: imgW, height: imgH });
      
      // Add image to PDF
      doc.addImage(
        `data:image/${fileExtension};base64,${base64Image}`,
        imageFormat,
        imgX,
        imgY,
        imgW,
        imgH
      );
      
      console.log("✅ Logo added to PDF successfully!");
      
    } else {
      console.warn("⚠️ No logo path available - continuing without logo");
    }
  } catch (error) {
    console.error("❌ Logo processing failed:", error);
    console.error("❌ Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    // Continue without logo instead of failing
  }

  // Draw bill type
  console.log("✍️ Drawing bill type");
  doc.setFontSize(CONFIG.fonts.sizes.large);
  doc.text(billType, billTypeX, billTypeY);

  // Prepare table data with totals
  const productsTableData = [
    ...formattedProducts,
    ...(formattedProducts.length > 0
      ? [
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
        ]
      : []),
  ];

  const servicesTableData = [
    ...formattedServices,
    ...(formattedServices.length > 0
      ? [
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
        ]
      : []),
  ];

  const tableHeaders = [
    ["Designation", "Qte", "Prix unitaire hors taxes", "Montant"],
  ];

  // Draw products table
  if (formattedProducts.length > 0) {
    console.log("📊 Drawing products table");
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
    console.log("✅ Products table drawn");
  }

  // Draw services table
  if (formattedServices.length > 0) {
    console.log("📊 Drawing services table");
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
    console.log("✅ Services table drawn");
  }

  // Draw total table
  if (formattedProducts.length > 0 || formattedServices.length > 0) {
    console.log("📊 Drawing total table");
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
    console.log("✅ Total table drawn");
  }

  console.log("✅ PDF generation completed successfully");
  const buffer = doc.output("arraybuffer");
  console.log("📦 PDF buffer size:", buffer.byteLength, "bytes");
  
  return buffer;
}

// POST method
export async function POST(req: NextRequest) {
  console.log("🚀 POST request received for PDF generation");
  
  try {
    const requestData = await req.json();
    console.log("📥 Request data received");

    // Validate input data
    if (!validateInvoiceData(requestData)) {
      console.error("❌ Invoice data validation failed");
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

    console.log("📊 Extracted data:", {
      productsCount: rProducts.length,
      servicesCount: rServices.length,
      clientName: client.name,
      total,
      billDate,
      billNo,
      userId
    });

    // Connect to database
    console.log("🔌 Connecting to database...");
    await connectDB();
    console.log("✅ Database connected");

    // Format data
    const formattedProducts = formatTableData(rProducts);
    const formattedServices = formatTableData(rServices);

    // Create proforma record
    console.log("💾 Creating proforma record...");
    const proforma = await Proforma.create({
      date: billDate,
      userId,
      clientId: client._id,
    });
    console.log("✅ Proforma created with ID:", proforma._id);

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
        quantity: s[2] ? 1 : s[1], // Handle quantity properly
        price: s[2] || s[1], // Handle price properly
        type: "service",
      })),
    ];

    console.log("💾 Inserting details:", details);
    await SellPDetails.insertMany(details);
    console.log("✅ Details inserted successfully");

    console.log("📄 Generating PDF...");
    const buffer = await generatePDF(
      rProducts,
      rServices,
      client,
      total,
      billDate,
      billNo
    );

    console.log("✅ PDF generated successfully, returning response");
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=proforma-${Date.now()}.pdf`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("❌ PDF generation error:", error);
    console.error("❌ Error stack:", error.stack);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("validation")) {
        console.error("❌ Validation error detected");
        return NextResponse.json(
          { error: "Data validation failed" },
          { status: 400 }
        );
      }
      if (error.message.includes("duplicate")) {
        console.error("❌ Duplicate record error detected");
        return NextResponse.json(
          { error: "Duplicate record" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  console.log("🚀 GET request received for PDF recreation");
  
  try {
    const { searchParams } = new URL(req.url);
    const proformaId = searchParams.get("proformaId");
    console.log("🔍 Proforma ID:", proformaId);

    if (!proformaId) {
      console.error("❌ No proforma ID provided");
      return NextResponse.json(
        { error: "ProformaId is required" },
        { status: 400 }
      );
    }

    console.log("🔌 Connecting to database...");
    await connectDB();
    console.log("✅ Database connected");

    console.log("🔍 Finding proforma...");
    const proforma = await Proforma.findById(proformaId).populate("clientId");

    if (!proforma) {
      console.error("❌ Proforma not found");
      return NextResponse.json(
        { error: "Proforma not found" },
        { status: 404 }
      );
    }

    console.log("✅ Proforma found:", proforma._id);

    // Fetch proforma details (products and services)
    console.log("🔍 Finding proforma details...");
    const details = await SellPDetails.find({ proformaId });

    if (!details || details.length === 0) {
      console.error("❌ No proforma details found");
      return NextResponse.json(
        { error: "Proforma details not found" },
        { status: 404 }
      );
    }

    console.log("✅ Found", details.length, "detail records");

    const products: Product[] = details
      .filter((detail) => detail.type === "product")
      .map((detail) => ({
        prod_name: detail.name,
        quantity: detail.quantity,
        sellPrice: detail.price,
      }));

    const services: Service[] = details
      .filter((detail) => detail.type === "service")
      .map((detail) => ({
        name: detail.name,
        quantity: detail.quantity,
        sellPrice: detail.price,
      }));

    console.log("📊 Extracted:", products.length, "products,", services.length, "services");

    const client: Client = {
      name: proforma.clientId?.name,
      email: proforma.clientId?.email,
      phone: proforma.clientId?.phone,
      nif: proforma.clientId?.nif,
    };

    const total = details.reduce((sum, detail) => {
      return sum + detail.quantity * detail.price;
    }, 0);

    const billDate = proforma.date.toISOString().split("T")[0];
    const billNo = formatBillNo(proforma.proformaId);

    console.log("📄 Regenerating PDF...");
    const buffer = await generatePDF(
      products,
      services,
      client,
      total,
      billDate,
      billNo
    );

    console.log("✅ PDF regenerated successfully, returning response");
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=proforma-${billNo}.pdf`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("❌ PDF recreation error:", error);
    console.error("❌ Error stack:", error.stack);

    // Handle specific database errors
    if (error.name === "CastError") {
      console.error("❌ Cast error - invalid ID format");
      return NextResponse.json(
        { error: "Invalid proforma ID format" },
        { status: 400 }
      );
    }

    if (error.name === "ValidationError") {
      console.error("❌ Database validation error");
      return NextResponse.json(
        { error: "Database validation error" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}