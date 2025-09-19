import { BuyDetails, BuyFact } from "@/lib/models/buyFactureModel";
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

export async function GET(req: Request) {
  try {
    console.log("fetching dashboard ...");
    const [cards, topClients] = await Promise.all([
      getDashboardCards(),
      getTopClients(),
    ]);
    const [sell, buy, graphData] = await Promise.all([
      getSellStats(),
      getBuyStats(),
      getGraphData(),
    ]);

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
      graphData,
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
      { $match: { "bon.date": { $gte: date } } },
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

async function getBuyStats() {
  const now = new Date();
  const periods = {
    today: startOfDay(now),
    week: startOfWeek(now, { weekStartsOn: 0 }),
    month: startOfMonth(now),
    year: startOfYear(now),
  };

  async function sumSince(date: Date) {
    const res = await BuyDetails.aggregate([
      {
        $lookup: {
          from: "buyfacts",
          localField: "buyFactId",
          foreignField: "_id",
          as: "fact",
        },
      },
      { $unwind: "$fact" },
      { $match: { "fact.date": { $gte: date } } },
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

async function getTopClients(limit = 5) {
  const results = await SellBDetails.aggregate([
    {
      $lookup: {
        from: "sellbons",
        localField: "sellBonId",
        foreignField: "_id",
        as: "bon",
      },
    },
    { $unwind: "$bon" },
    {
      $group: {
        _id: "$bon.clientId",
        totalSpent: { $sum: { $multiply: ["$price", "$quantity"] } },
      },
    },
    {
      $lookup: {
        from: "clients",
        localField: "_id",
        foreignField: "_id",
        as: "client",
      },
    },
    {
      $project: {
        name: { $arrayElemAt: ["$client.name", 0] },
        totalSpent: 1,
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: limit },
  ]);

  return results.map((c, idx) => ({
    rank: `#${idx + 1}`,
    name: c.name || c._id?.toString(),
    spent: c.totalSpent,
    isActive: true,
  }));
}

async function getGraphData() {
  const now = new Date();
  const startOfCurrentYear = startOfYear(now);

  const sellAgg = await SellBDetails.aggregate([
    {
      $lookup: {
        from: "sellbons",
        localField: "sellBonId",
        foreignField: "_id",
        as: "bon",
      },
    },
    { $unwind: "$bon" },
    { $match: { "bon.date": { $gte: startOfCurrentYear, $lte: now } } },
    {
      $group: {
        _id: {
          year: { $year: "$bon.date" },
          month: { $month: "$bon.date" },
        },
        total: { $sum: { $multiply: ["$price", "$quantity"] } },
      },
    },
  ]);

  const buyAgg = await BuyDetails.aggregate([
    {
      $lookup: {
        from: "buyfacts",
        localField: "buyFactId",
        foreignField: "_id",
        as: "fact",
      },
    },
    { $unwind: "$fact" },
    { $match: { "fact.date": { $gte: startOfCurrentYear, $lte: now } } },
    {
      $group: {
        _id: {
          year: { $year: "$fact.date" },
          month: { $month: "$fact.date" },
        },
        total: { $sum: { $multiply: ["$price", "$quantity"] } },
      },
    },
  ]);

  const expenseAgg = await Expense.aggregate([
    { $match: { createdAt: { $gte: startOfCurrentYear, $lte: now } } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        total: { $sum: "$price" },
      },
    },
  ]);

  // 📌 Predefine months Jan → Dec
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const graphData = monthNames.map((month, idx) => {
    const sell = sellAgg.find((d) => d._id.month === idx + 1)?.total || 0;
    const buy = buyAgg.find((d) => d._id.month === idx + 1)?.total || 0;
    const expense = expenseAgg.find((d) => d._id.month === idx + 1)?.total || 0;
    const profit = sell - buy - expense;

    return { month, sell, buy, expense, profit };
  });

  return graphData;
}
