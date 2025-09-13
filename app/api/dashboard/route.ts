import { BuyFact } from "@/lib/models/buyFactureModel";
import { Client } from "@/lib/models/clientModel";
import { Expense } from "@/lib/models/expenseModel";
import { Product } from "@/lib/models/productModel";
import { SellBDetails, SellBon } from "@/lib/models/sellBonModel";
import { Service } from "@/lib/models/serviceModel";
import { Supplier } from "@/lib/models/supplierModel";
import connectDB from "@/lib/mongoConnect";
import { getStatsForModel } from "@/lib/utils/dashboardUtils";
import { NextResponse } from "next/server";

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
    const [cards, topClients] = await Promise.all([
      getDashboardCards(),
      getTopClients(),
    ]);
    const [sell] = await Promise.all([
      getSellStats(),

    ]);

    const buy = await getStatsForModel(BuyFact, "price");
    const expenses = await getStatsForModel(Expense, "price");

    const profit = {
      today: sell.today - buy.today - expenses.today,
      week: sell.week - buy.week - expenses.week,
      month: sell.month - buy.month - expenses.month,
      year: sell.year - buy.year - expenses.year,
      overall: sell.overall - buy.overall - expenses.overall,
    };
    const stats = {
      sell,
      buy,
      expenses,
      profit,
    };
    console.log(stats);
    return NextResponse.json({
      cards,
      stats,
      topClients,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

import { startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";

async function getSellStats() {
  const now = new Date();
  const periods = {
    today: startOfDay(now),
    week: startOfWeek(now, { weekStartsOn: 0 }),
    month: startOfMonth(now),
    year: startOfYear(now),
  };

  async function sumSince(date: Date) {
    const res = await SellBDetails.aggregate([
      {
        $lookup: {
          from: "sellbons",
          localField: "sellBonId",
          foreignField: "_id",
          as: "bon",
        },
      },
      { $unwind: "$bon" },
      { $match: { "bon.createdAt": { $gte: date } } },
      {
        $project: {
          lineTotal: {
            $multiply: ["$price", "$quantity"],
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$lineTotal" } } },
    ]);
    return res[0]?.total || 0;
  }

  const [today, week, month, year, overall] = await Promise.all([
    sumSince(periods.today),
    sumSince(periods.week),
    sumSince(periods.month),
    sumSince(periods.year),
    sumSince(new Date(0)),
  ]);

  return { today, week, month, year, overall };
}
