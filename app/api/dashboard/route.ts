import { Client } from "@/lib/models/clientModel";
import { Product } from "@/lib/models/productModel";
import { Service } from "@/lib/models/serviceModel";
import { Supplier } from "@/lib/models/supplierModel";
import connectDB from "@/lib/mongoConnect";
import { NextResponse } from "next/server";

// Example: Replace these with real DB/service calls
async function getDashboardCards() {
  await connectDB();
  const [clients, suppliers, products, services] = await Promise.all([
    Client.countDocuments({ isActive: true }),
    Supplier.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true }),
    Service.countDocuments({ isActive: true }),
  ]);

  return {
    clients: Number(clients),
    suppliers: Number(suppliers),
    products: Number(products),
    services: Number(services),
  };
}

async function getStats() {
  return {
    profit: {
      Today: "12,450",
      "This Week": "87,320",
      "This Month": "173,500",
      "This Year": "2,456,780",
      Overall: "8,945,230",
    },
    expenses: {
      Today: "9,320",
      "This Week": "53,210",
      "This Month": "127,000",
      "This Year": "1,900,450",
      Overall: "7,230,000",
    },
    sell: {
      Today: "7,120",
      "This Week": "65,430",
      "This Month": "143,200",
      "This Year": "2,120,890",
      Overall: "9,320,110",
    },
    buy: {
      Today: "5,600",
      "This Week": "48,000",
      "This Month": "100,000",
      "This Year": "1,720,000",
      Overall: "6,500,000",
    },
  };
}

async function getTopClients() {
  return [
    { rank: "#1", name: "Amir Hamdi", spent: "20000" },
    { rank: "#2", name: "Walid Zebbiche", spent: "18000" },
    { rank: "#3", name: "Balota", spent: "9000" },
  ];
}

export async function GET(req: Request) {
  try {
    console.log("fetching dashboard ...");
    const [cards, stats, topClients] = await Promise.all([
      getDashboardCards(),
      getStats(),
      getTopClients(),
    ]);

    return NextResponse.json({ cards, stats, topClients });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
