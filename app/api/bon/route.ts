import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { NextResponse } from "next/server";

const ficheDetatA5 = () => {
  const doc = new jsPDF({ unit: "pt", format: "a5" });

  const font = (type) => {
    return doc.setFont("times", type);
  };

  const [pageW, pageH] = [
    doc.internal.pageSize.width, //420
    doc.internal.pageSize.height, // 595
  ];
  const rPadding = 30;
  doc.setFontSize(16);
  font("bold");
  doc.text("Fiche d'état", 155, 30);

  //
  doc.text("ARTEVO", rPadding, 80);

  doc.setFontSize(7);
  font("normal");
  doc.text("Agence publicitaire", rPadding, 95);
  doc.text("Tel: 07 78 50 99 97", rPadding, 105);

  font("bold");
  doc.text("Client:", rPadding, 135);
  font("normal");
  doc.text(
    "Zebbiche Mohamed Amine",
    doc.getTextWidth("Client:") + rPadding + 6,
    135
  );

  doc.text("De 11/04/2025", rPadding, 190);
  doc.text("a 11/04/2025", 300, 190);

  autoTable(doc, {
    margin: rPadding,
    startY: 200,
    styles: {
      fontSize: 5.8,
      valign: "middle",
      halign: "center",
      lineWidth: 0.8,
      lineColor: "black",
      cellPadding: 6,
    },
    theme: "plain",
    head: [["Date", "Operation", "Montant", "Versee", "Reste", "Sous Total"]],
    headStyles: {
      fillColor: "white",
      textColor: "black",
      cellPadding: 6,
    },
    body: [
      [
        "12/12/2012",
        "facture no= 015/2025",
        "5498.00 DA",
        "5482.00 DA",
        "458.00 DA",
        "1214.50 DA",
      ],
      [
        "12/12/2012",
        "RETURN no= 025/2025",
        "5498.00 DA",
        "5482.00 DA",
        "458.00 DA",
        "1214.50 DA",
      ],
      [
        "12/12/2012",
        "Payment no= 077/2025",
        "548,888,882.00 DA",
        "548,888,882.00 DA",
        "548,888,882.00 DA",
        "548,888,882.00 DA",
      ],
    ],
    columnStyles: {
      0: { cellWidth: 41 },
      1: { cellWidth: "wrap" },
      // 2: { cellWidth: 85 },
      // 3: { cellWidth: 50 },
      // 4: { cellWidth: 90 },
      // 5: { cellWidth: 90 },
    },
  });

  const totalTableWidth = 60 * 3;

  autoTable(doc, {
    margin: { left: pageW - totalTableWidth - rPadding },
    startY:
      doc.lastAutoTable?.finalY !== undefined
        ? doc.lastAutoTable.finalY + 10
        : tableY + 10,
    head: [["A payer", "Versee", "Reste"]],
    body: [["900,000,000.00 DA", "260.00 DA", "900,900,900.00 DA"]],
    bodyStyles: {
      valign: "middle",
      halign: "center",
      lineWidth: 0.8,
      lineColor: "black",
    },
    theme: "plain",

    tableWidth: "wrap",
    styles: {
      fontSize: 5.8,
      overflow: "linebreak",
      cellWidth: 60,
      // cellPadding: 8,
    },
    headStyles: {
      fillColor: "white",
      textColor: "black",
      valign: "middle",
      halign: "center",
      lineWidth: 0.8,
      lineColor: "black",
    },
  });
  return doc;
};

const ficheDetatA4 = () => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const font = (type) => {
    return doc.setFont("times", type);
  };

  const [pageW, pageH] = [
    doc.internal.pageSize.width, //420
    doc.internal.pageSize.height, // 595
  ];
  const rPadding = 30;
  doc.setFontSize(18);
  font("bold");
  doc.text("Fiche d'état", 240, 30);

  //
  doc.text("ARTEVO", rPadding, 80);

  doc.setFontSize(7);
  font("normal");
  doc.text("Agence publicitaire", rPadding, 95);
  doc.text("Tel: 07 78 50 99 97", rPadding, 105);

  font("bold");
  doc.text("Client:", rPadding, 135);
  font("normal");
  doc.text(
    "Zebbiche Mohamed Amine",
    doc.getTextWidth("Client:") + rPadding + 6,
    135
  );

  doc.text("De 11/04/2025", rPadding, 190);
  doc.text("a 11/04/2025", 300, 190);

  autoTable(doc, {
    margin: rPadding,
    startY: 200,
    styles: {
      fontSize: 5.8,
      valign: "middle",
      halign: "center",
      lineWidth: 0.8,
      lineColor: "black",
      cellPadding: 6,
    },
    theme: "plain",
    head: [["Date", "Operation", "Montant", "Versee", "Reste", "Sous Total"]],
    headStyles: {
      fillColor: "white",
      textColor: "black",
      cellPadding: 6,
    },
    body: [
      [
        "12/12/2012",
        "facture no= 015/2025",
        "5498.00 DA",
        "5482.00 DA",
        "458.00 DA",
        "1214.50 DA",
      ],
      [
        "12/12/2012",
        "RETURN no= 025/2025",
        "5498.00 DA",
        "5482.00 DA",
        "458.00 DA",
        "1214.50 DA",
      ],
      [
        "12/12/2012",
        "Payment no= 077/2025",
        "548,888,882.00 DA",
        "548,888,882.00 DA",
        "548,888,882.00 DA",
        "548,888,882.00 DA",
      ],
    ],
    columnStyles: {
      0: { cellWidth: 41 },
      1: { cellWidth: "wrap" },
      // 2: { cellWidth: 85 },
      // 3: { cellWidth: 50 },
      // 4: { cellWidth: 90 },
      // 5: { cellWidth: 90 },
    },
  });

  const totalTableWidth = 60 * 3;

  autoTable(doc, {
    margin: { left: pageW - totalTableWidth - rPadding },
    startY:
      doc.lastAutoTable?.finalY !== undefined
        ? doc.lastAutoTable.finalY + 10
        : tableY + 10,
    head: [["A payer", "Versee", "Reste"]],
    body: [["900,000,000.00 DA", "260.00 DA", "900,900,900.00 DA"]],
    bodyStyles: {
      valign: "middle",
      halign: "center",
      lineWidth: 0.8,
      lineColor: "black",
    },
    theme: "plain",

    tableWidth: "wrap",
    styles: {
      fontSize: 5.8,
      overflow: "linebreak",
      cellWidth: 60,
      // cellPadding: 8,
    },
    headStyles: {
      fillColor: "white",
      textColor: "black",
      valign: "middle",
      halign: "center",
      lineWidth: 0.8,
      lineColor: "black",
    },
  });
  return doc;
};

export async function GET() {
  const doc = ficheDetatA4();
  const buffer = doc.output("arraybuffer");
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=facture.pdf",
    },
  });
}
