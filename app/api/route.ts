import { NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import path from "path";
import fs from "fs";

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

export async function GET() {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

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

  const billInfo = [
    "FACTURE No 00002/2025",
    "Date: 03/04/2025",
    "Reglement: Cheque",
  ];

  const clientInfo = [
    "Addressee a: Zebbiche Mohamed Amine ",
    "Address: Cite 616 logts, Ain Oulmene",
    "Tel: 06 96 93 22 80",
    "NIF: 198182806331464",
  ];

  const [generalInfoX, generalInfoY] = [40, 70];
  const [billInfoX, billInfoY] = [40, 70 + generalInfo.length * 16];
  const [imgX, imgY, imgW, imgH] = [360, 10, 160, 120];

  // TODO : CHECK Y VALUE
  const [clientInfoX, clientInfoY] = [350, 70 + generalInfo.length * 16];

  const [billType, billTypeX, billTypeY] = [
    "Facture",
    imgX + 40, // 400
    imgY + imgH + 42, // 172
  ];

  const headColor = "#BFDEFF";

  const [table, tableX, tableY] = ["Products", 40, billTypeY + 120];

  doc.setFontSize(22);
  doc.setFont("", "", "bold");
  doc.text("ARTEVO", 40, 50);

  doc.setFont("", "", "regular");
  doc.setFontSize(9);

  generalInfo.map((item, index) => {
    doc.text(item, generalInfoX, generalInfoY + index * 14);
  });

  doc.setFont("", "", "bold");

  billInfo.map((info, index) => {
    doc.text(info, billInfoX, billInfoY + index * 14);
  });

  clientInfo.map((info, index) => {
    doc.text(info, clientInfoX, clientInfoY + index * 14);
  });

  const filePath = path.join(process.cwd(), "public", "minilogo.png");
  const imageBuffer = fs.readFileSync(filePath);
  const base64Image = imageBuffer.toString("base64");

  doc.addImage(
    `data:image/png;base64,${base64Image}`,
    "PNG",
    imgX, // x
    imgY, // y
    imgW, // width
    imgH // height
  );

  doc.setFontSize(20);
  doc.text(billType, billTypeX, billTypeY);

  doc.rect(380, 150, 115, 30);
  // drawTopRightBottomLeftRounded(doc, 380, 150, 115, 30, 35, 22);
  const products = [
    [
      "Product B Adipisci voluptas est. Asperiores non updatedAt officia.",
      "2",
      "$150,000,000",
      "9%",
      "$327,000,000,000",
    ],

    [
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
      { content: "580.00", styles: { fontStyle: "bold", halign: "center" } },
    ],
  ];
  const services = [
    ["Service ", "2", "$150,000,000", "9%", "$327,000,000,000"],

    [
      "Service B Adipisci voluptas est. Asperiores non updatedAt sofficia.",
      "1",
      "$100",
      "19%",
      "$119",
    ],
    [
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
      { content: "580.00", styles: { fontStyle: "bold", halign: "center" } },
    ],
  ];

  const productsHeaders = [["Product", "Qty", "Price", "TVA", "Total"]];
  const servicesHeaders = [["Services", "Qty", "Price", "TVA", "Total"]];

  if (products.length > 0) {
    doc.setFont("", "", "regular");
    doc.setFontSize(14);
    doc.text(table, tableX, tableY);
    autoTable(doc, {
      startY: tableY + 10,

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
  }

  if (services.length > 0) {
    doc.text(
      "Services",
      tableX,
      doc.lastAutoTable?.finalY !== undefined
        ? doc.lastAutoTable.finalY + 35
        : tableY + 10
    );
    autoTable(doc, {
      startY:
        doc.lastAutoTable?.finalY !== undefined
          ? doc.lastAutoTable.finalY + 45
          : tableY + 10,
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
  }

  if (services || products) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const totalTableWidth = 100 + 85 + 85;
    const rightPadding = 40;
    autoTable(doc, {
      margin: { left: pageWidth - totalTableWidth - rightPadding },
      startY:
        doc.lastAutoTable?.finalY !== undefined
          ? doc.lastAutoTable.finalY + 40
          : tableY + 10,
      head: [["Total hors taxes", "TVA", "Total T.T.C"]],
      body: [["900,000,000.00", "260.00", "900,900,900.00"]],
      bodyStyles: {
        valign: "middle",
        halign: "center",
        lineWidth: 1.2,
        lineColor: "black",
      },
      theme: "plain",

      columnStyles: {
        0: {
          cellPadding: 10.5,
          cellWidth: 100,
        },
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
    doc.setFont("helvetica", "bold");
    drawRightAlignedText(
      doc,
      "Net a payer: 1,999,160,999.00 DZD",
      doc.lastAutoTable.finalY + 30,
      { fontStyle: "bold", rightMargin: 45 }
    );
    doc.text(
      "La presente facture est arretee en TTC a la somme de:",
      40,
      doc.lastAutoTable.finalY + 80
    );
    doc.setFont("", "normal");
    doc.text(
      "Sept Mille Sept Cent Trente Cinq Dinars et Zero CTS.",
      40,
      doc.lastAutoTable.finalY + 92
    );
  }
  console.log(doc.getFontList());
  const buffer = doc.output("arraybuffer");
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=facture.pdf",
    },
  });
}
