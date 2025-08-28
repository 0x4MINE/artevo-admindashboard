import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import connectDB from "@/lib/mongoConnect";
import { SellBon, SellBDetails } from "@/lib/models/sellBonModel";
import { getInfo } from "@/lib/actions/infoActions";
import {
  calculateSubtotal,
  formatBillNo,
  formatPhone,
  formatTableData,
} from "@/lib/utils";
import path from "path";
import fs from "fs/promises";
import { Lot } from "@/lib/models/lotModel";
import mongoose from "mongoose";

// Types for better type safety
interface LogoData {
  base64: string;
  format: string;
}

interface CompanyInfo {
  companyName?: string;
  companyDesc?: string;
  phone?: string;
  logoUrl?: string;
}

interface Client {
  name?: string;
  phone?: string;
  email?: string;
  _id: string;
}

interface ProductService {
  _id?: string;
  lot_id?: string;
  prod_name?: string;
  name?: string;
  quantity: number;
  sellPrice: number;
  tva: number;
}

interface LotDeduction {
  lotId: string;
  productId: string;
  quantityDeducted: number;
  previousQuantity: number;
  newQuantity: number;
}

// Error types for better frontend handling
const ERROR_TYPES = {
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  LOT_NOT_FOUND: "LOT_NOT_FOUND",
  INVALID_LOT_ID: "INVALID_LOT_ID",
  CLIENT_REQUIRED: "CLIENT_REQUIRED",
  PRODUCTS_REQUIRED: "PRODUCTS_REQUIRED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  PDF_GENERATION_ERROR: "PDF_GENERATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  INSUFFICIENT_STOCK: "Insufficient stock for one or more products",
  LOT_NOT_FOUND: "One or more product lots were not found",
  INVALID_LOT_ID: "Invalid product lot reference",
  CLIENT_REQUIRED: "Please select a client",
  PRODUCTS_REQUIRED: "Please add at least one product or service",
  VALIDATION_ERROR: "Invalid form data provided",
  DATABASE_ERROR: "Database operation failed",
  PDF_GENERATION_ERROR: "Failed to generate PDF document",
  INTERNAL_ERROR: "An unexpected error occurred",
};

// Helper function to create user-friendly error responses
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

// Check stock availability for all products
async function checkStockAvailability(
  products: ProductService[]
): Promise<void> {
  const stockErrors: {
    productName: string;
    available: number;
    required: number;
  }[] = [];

  for (const product of products) {
    if (product._id && product.quantity > 0) {
      const lot = await Lot.findById(product._id);

      if (!lot) {
        throw new Error(
          `Product "${product.prod_name || "Unknown"}": Lot not found`
        );
      }

      if (!lot.isActive) {
        throw new Error(
          `Product "${product.prod_name || "Unknown"}": Lot is inactive`
        );
      }

      if (lot.quantity < product.quantity) {
        stockErrors.push({
          productName: product.prod_name || "Unknown Product",
          available: lot.quantity,
          required: product.quantity,
        });
      }
    }
  }

  // If any stock errors, throw with detailed information
  if (stockErrors.length > 0) {
    const error = new Error("Insufficient stock for some products");
    (error as any).stockErrors = stockErrors;
    throw error;
  }
}

// Update inventory for products
async function updateInventory(
  products: ProductService[]
): Promise<LotDeduction[]> {
  const deductions: LotDeduction[] = [];

  for (const product of products) {
    if (product._id && product.quantity > 0) {
      // Get current lot data
      const currentLot = await Lot.findById(product._id);
      if (!currentLot) {
        throw new Error(
          `Lot not found for product: ${product.prod_name || "Unknown"}`
        );
      }

      // Update the lot quantity
      const updatedLot = await Lot.findByIdAndUpdate(
        product._id,
        {
          $inc: { quantity: -product.quantity },
          $set: { updatedAt: new Date() },
        },
        { new: true }
      );

      if (!updatedLot) {
        throw new Error(
          `Failed to update inventory for product: ${
            product.prod_name || "Unknown"
          }`
        );
      }

      // If quantity becomes 0, mark as inactive
      if (updatedLot.quantity === 0) {
        await Lot.findByIdAndUpdate(product._id, { isActive: false });
      }

      deductions.push({
        lotId: currentLot.lot_id || product._id,
        productId: product._id,
        quantityDeducted: product.quantity,
        previousQuantity: currentLot.quantity,
        newQuantity: updatedLot.quantity,
      });
    }
  }

  return deductions;
}

// Validation function
function validateBonData(data: any): asserts data is {
  products: ProductService[];
  services: ProductService[];
  client: Client;
  total: number;
  billDate: string;
  billNo: string;
  userId: string;
} {
  const { products, services, client, total, billDate, billNo, userId } = data;

  if (!userId) {
    throw new Error("User authentication required");
  }

  if (!billDate || isNaN(Date.parse(billDate))) {
    throw new Error("Valid bill date is required");
  }

  if (!billNo) {
    throw new Error("Bill number is required");
  }

  if (typeof total !== "number" || total < 0) {
    throw new Error("Valid total amount is required");
  }

  if (!client || !client._id) {
    throw new Error("Client selection is required");
  }

  if (
    (!products || products.length === 0) &&
    (!services || services.length === 0)
  ) {
    throw new Error("At least one product or service is required");
  }

  // Validate products
  if (products) {
    products.forEach((product, index) => {
      if (!product._id) {
        throw new Error(`Product ${index + 1}: Lot reference is required`);
      }

      if (typeof product.quantity !== "number" || product.quantity <= 0) {
        throw new Error(
          `Product ${index + 1}: Quantity must be a positive number`
        );
      }

      if (typeof product.sellPrice !== "number" || product.sellPrice < 0) {
        throw new Error(
          `Product ${index + 1}: Price must be a positive number`
        );
      }

      if (!mongoose.Types.ObjectId.isValid(product._id)) {
        throw new Error(`Product ${index + 1}: Invalid lot reference format`);
      }
    });
  }

  // Validate services
  if (services) {
    services.forEach((service) => {
      if (typeof service.sellPrice !== "number" || service.sellPrice < 0) {
        throw new Error(
          `Service "${service.name}": Price must be a positive number`
        );
      }
    });
  }
}

// Image path validation
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

// Logo loading function
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

const CONFIG = {
  colors: {
    header: "#FFFFFF",
    text: "#000000",
    border: "#000000",
  },
  fonts: {
    default: "Helvetica",
  },
  formats: {
    a5: {
      margins: {
        right: 30,
        left: 30,
        top: 50,
      },
      fonts: {
        title: 20,
        normal: 12,
        small: 9,
      },
      spacing: {
        lineHeight: 20,
        sectionGap: 30,
      },
      table: {
        columnWidths: {
          designation: "auto" as const,
          quantity: 40,
          unitPrice: 85,
          amount: 90,
        },
        cellPadding: 10.9,
      },
      logo: {
        maxWidth: 80,
        maxHeight: 80,
        xPosition: (pageWidth: number) => pageWidth - 120,
        yPosition: 65,
      },
    },
    a6: {
      margins: {
        right: 15,
        left: 15,
        top: 40,
      },
      fonts: {
        title: 12,
        normal: 10,
        small: 6,
      },
      spacing: {
        lineHeight: 15,
        sectionGap: 20,
      },
      table: {
        columnWidths: {
          designation: "auto" as const,
          quantity: 30,
          unitPrice: 65,
          amount: 70,
        },
        cellPadding: 8,
      },
      logo: {
        maxWidth: 60,
        maxHeight: 60,
        xPosition: (pageWidth: number) => pageWidth - 90,
        yPosition: 50,
      },
    },
  },
} as const;

// PDF generation function
async function generateBonPDFCommon(
  products: ProductService[],
  services: ProductService[],
  client: Client,
  total: number,
  billDate: string,
  billNo: string,
  format: "a5" | "a6"
): Promise<ArrayBuffer> {
  const doc = new jsPDF({ unit: "pt", format });
  const formatConfig = CONFIG.formats[format];

  try {
    const formattedProducts = formatTableData(products);
    const formattedServices = formatTableData(services);
    const productsSubtotal = calculateSubtotal(formattedProducts);
    const servicesSubtotal = calculateSubtotal(formattedServices);

    const createTableData = (formattedData: any[], subtotal: string) => [
      ...formattedData,
      ...(formattedData.length > 0
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
                  lineWidth: 0.8,
                  lineColor: CONFIG.colors.border,
                },
              },
              {
                content: subtotal,
                styles: { fontStyle: "bold", halign: "center" },
              },
            ],
          ]
        : []),
    ];

    const productsTableData = createTableData(
      formattedProducts,
      productsSubtotal
    );
    const servicesTableData = createTableData(
      formattedServices,
      servicesSubtotal
    );

    const companyInfo: CompanyInfo = await getInfo();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(formatConfig.fonts.title);
    doc.text("Bon de livraison", pageWidth / 2, 30, { align: "center" });

    // Bon number
    doc.setFontSize(formatConfig.fonts.normal);
    doc.setFont(CONFIG.fonts.default, "bold");
    doc.text(
      `Bon No ${billNo}`,
      formatConfig.margins.left,
      format === "a5" ? 75 : 60
    );
    doc.setFont(CONFIG.fonts.default, "normal");

    // Company information
    let yPosition = format === "a5" ? 95 : 75;
    if (companyInfo?.companyName) {
      doc.text(companyInfo.companyName, formatConfig.margins.left, yPosition);
      yPosition += formatConfig.spacing.lineHeight;
    }
    if (companyInfo?.companyDesc) {
      doc.text(companyInfo.companyDesc, formatConfig.margins.left, yPosition);
      yPosition += formatConfig.spacing.lineHeight;
    }
    if (companyInfo?.phone) {
      doc.text(
        `Tel: ${formatPhone(companyInfo.phone)}`,
        formatConfig.margins.left,
        yPosition
      );
    }

    // Logo
    if (companyInfo?.logoUrl) {
      const logoData = await loadLogoAsBase64(companyInfo.logoUrl);
      if (logoData) {
        try {
          doc.addImage(
            logoData.base64,
            logoData.format,
            formatConfig.logo.xPosition(pageWidth),
            formatConfig.logo.yPosition,
            formatConfig.logo.maxWidth,
            formatConfig.logo.maxHeight
          );
        } catch (err) {
          // Silently fail if logo can't be added
        }
      }
    }

    // Client information
    doc.setFont(CONFIG.fonts.default, "bold");
    doc.text(
      "Client: ",
      formatConfig.margins.left,
      format === "a5" ? 170 : 130
    );
    doc.setFont(CONFIG.fonts.default, "normal");
    doc.text(
      `${client?.name || "N/A"}`,
      formatConfig.margins.left + 5 + doc.getTextWidth("Client: "),
      format === "a5" ? 170 : 130
    );

    let startY = format === "a5" ? 200 : 155;

    // Helper function to create tables
    const createTable = (
      title: string,
      tableData: any[],
      currentY: number
    ): number => {
      doc.setFont(CONFIG.fonts.default, "italic");
      doc.text(title, formatConfig.margins.left, currentY);

      autoTable(doc, {
        margin: {
          left: formatConfig.margins.left,
          right: formatConfig.margins.right,
        },
        startY: currentY + 10,
        head: [["Désignation", "Qte", "Prix", "Montant"]],
        body: tableData,
        bodyStyles: {
          valign: "middle",
          halign: "center",
          lineWidth: 0.8,
          lineColor: CONFIG.colors.border,
        },
        theme: "plain",
        columnStyles: {
          0: {
            cellWidth: formatConfig.table.columnWidths.designation,
            cellPadding: formatConfig.table.cellPadding,
            valign: "middle",
            halign: "left",
          },
          1: { cellWidth: formatConfig.table.columnWidths.quantity },
          2: { cellWidth: formatConfig.table.columnWidths.unitPrice },
          3: { cellWidth: formatConfig.table.columnWidths.amount },
        },
        styles: {
          fontSize: formatConfig.fonts.small,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: CONFIG.colors.header,
          textColor: CONFIG.colors.text,
          fontStyle: "normal",
          valign: "middle",
          halign: "center",
          lineWidth: 0.8,
          lineColor: CONFIG.colors.border,
        },
      });

      return (
        (doc as any).lastAutoTable.finalY + formatConfig.spacing.sectionGap
      );
    };

    // Products table
    if (products && products.length > 0) {
      startY = createTable("Produits", productsTableData, startY);
    }

    // Services table
    if (services && services.length > 0) {
      startY = createTable("Services", servicesTableData, startY);
    }

    // Total
    doc.setFont(CONFIG.fonts.default, "bold");
    doc.setFontSize(formatConfig.fonts.normal);
    doc.text(`Total: ${total.toFixed(2)} DA`, pageWidth - 150, startY);

    return doc.output("arraybuffer");
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error(`Failed to generate PDF: ${error}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const requestData = await req.json();
    validateBonData(requestData);

    const {
      products = [],
      services = [],
      client,
      total,
      billDate,
      billNo,
      userId,
    } = requestData;

    await connectDB();

    let lotDeductions: LotDeduction[] = [];

    // Step 1: Check stock availability
    if (products.length > 0) {
      try {
        await checkStockAvailability(products);
      } catch (stockError: any) {
        if (stockError.stockErrors) {
          return createErrorResponse(
            ERROR_TYPES.INSUFFICIENT_STOCK,
            "Insufficient stock for some products",
            stockError.stockErrors
          );
        }
        return createErrorResponse(
          ERROR_TYPES.LOT_NOT_FOUND,
          stockError.message
        );
      }
    }

    // Step 2: Update inventory
    if (products.length > 0) {
      try {
        lotDeductions = await updateInventory(products);
        console.log(`✅ Successfully updated ${lotDeductions.length} lots`);
      } catch (inventoryError: any) {
        return createErrorResponse(
          ERROR_TYPES.DATABASE_ERROR,
          `Inventory update failed: ${inventoryError.message}`
        );
      }
    }

    // Step 3: Create bon record
    try {
      const bon = await SellBon.create({
        date: new Date(billDate),
        userId,
        clientId: client._id,
      });

      // Step 4: Create detail records
      const details = [
        ...products.map((p: ProductService) => ({
          sellBonId: bon._id,
          name: p.prod_name || p.name || "Unknown Product",
          quantity: p.quantity || 1,
          price: p.sellPrice || 0,
          type: "product",
          tva: p.tva,
          lotId: p.lot_id || null,
          originalLotDocumentId: p._id || null,
        })),
        ...services.map((s: ProductService) => ({
          sellBonId: bon._id,
          name: s.name || "Unknown Service",
          quantity: s.quantity || 1,
          tva: s.tva,
          price: s.sellPrice || 0,
          type: "service",
        })),
      ];

      if (details.length > 0) {
        await SellBDetails.insertMany(details);
      }

      return NextResponse.json(
        {
          message: "Bon created successfully",
          bonId: bon._id,
          lotDeductions: lotDeductions.length > 0 ? lotDeductions : undefined,
          deductionSummary:
            lotDeductions.length > 0
              ? {
                  totalLotsAffected: lotDeductions.length,
                  totalQuantityDeducted: lotDeductions.reduce(
                    (sum, d) => sum + d.quantityDeducted,
                    0
                  ),
                }
              : undefined,
        },
        { status: 201 }
      );
    } catch (bonError: any) {
      console.error("Bon creation failed:", bonError);
      return createErrorResponse(
        ERROR_TYPES.DATABASE_ERROR,
        "Failed to create bon record"
      );
    }
  } catch (error: any) {
    console.error("POST request error:", error);

    if (error.message.includes("Client selection is required")) {
      return createErrorResponse(ERROR_TYPES.CLIENT_REQUIRED, error.message);
    }

    if (error.message.includes("At least one product or service is required")) {
      return createErrorResponse(ERROR_TYPES.PRODUCTS_REQUIRED, error.message);
    }

    if (
      error.message.includes("Lot reference is required") ||
      error.message.includes("Invalid lot reference format") ||
      error.message.includes("must be a positive number")
    ) {
      return createErrorResponse(ERROR_TYPES.VALIDATION_ERROR, error.message);
    }

    return createErrorResponse(
      ERROR_TYPES.INTERNAL_ERROR,
      "An unexpected error occurred while processing your request"
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bonId = searchParams.get("bonId");
    const format = searchParams.get("format") || "a5";

    if (!bonId) {
      return createErrorResponse(
        ERROR_TYPES.VALIDATION_ERROR,
        "Bon ID is required"
      );
    }

    if (!["a5", "a6"].includes(format)) {
      return createErrorResponse(
        ERROR_TYPES.VALIDATION_ERROR,
        "Invalid format. Must be 'a5' or 'a6'"
      );
    }

    await connectDB();

    const bon = await SellBon.findById(bonId).populate("clientId");
    if (!bon) {
      return createErrorResponse(ERROR_TYPES.VALIDATION_ERROR, "Bon not found");
    }

    const details = await SellBDetails.find({ sellBonId: bonId });
    if (!details.length) {
      return createErrorResponse(
        ERROR_TYPES.VALIDATION_ERROR,
        "Bon details not found"
      );
    }

    const products = details
      .filter((d) => d.type === "product")
      .map((d) => ({
        prod_name: d.name,
        quantity: d.quantity,
        sellPrice: d.price,
        tva: d.tva,
      }));

    const services = details
      .filter((d) => d.type === "service")
      .map((d) => ({
        name: d.name,
        quantity: d.quantity,
        sellPrice: d.price,
        tva: d.tva,
      }));

    const client: Client = {
      name: bon.clientId?.name || "N/A",
      phone: bon.clientId?.phone,
      email: bon.clientId?.email,
      _id: bon.clientId?._id,
    };

    const total = details.reduce((sum, d) => sum + d.price * d.quantity, 0);
    const billDate = bon.date.toISOString().split("T")[0];
    const billNo = formatBillNo(bon.sellBonId);

    const buffer = await generateBonPDFCommon(
      products,
      services,
      client,
      total,
      billDate,
      billNo,
      format as "a5" | "a6"
    );

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=bon-${billNo}-${format}.pdf`,
        "Cache-Control": "public, max-age=3600",
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error("Bon regeneration error:", error);
    return createErrorResponse(
      ERROR_TYPES.PDF_GENERATION_ERROR,
      "Failed to generate PDF document"
    );
  }
}
