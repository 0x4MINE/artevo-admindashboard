"use server";

import { Client, IClient } from "../models/clientModel";
import {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} from "../factories/crudFactory";
import mongoose from "mongoose";
import connectDB from "../mongoConnect";
import { AwardIcon } from "lucide-react";
import { ClientPaym } from "../models/clientPayModel";
import { SellBon } from "../models/sellBonModel";
import FilterState from "@/types/FilterState";

export const createClient = createOne(Client);

export const getClients = async () => {
  try {
    await connectDB();

    // Fetch all clients
    const clients = await Client.find().lean();
    if (!clients || clients.length === 0) return [];

    // ---------- Aggregations ----------

    // 1. Sales totals (from SellBon + SellBDetails)
    const salesAgg = await SellBon.aggregate([
      {
        $lookup: {
          from: "sellbdetails",
          localField: "_id",
          foreignField: "sellBonId",
          as: "details",
        },
      },
      { $unwind: "$details" },
      {
        $group: {
          _id: "$clientId",
          totalSales: {
            $sum: { $multiply: ["$details.price", "$details.quantity"] },
          },
        },
      },
    ]);

    // 2. Payments totals (all-time)
    const paymentsAgg = await ClientPaym.aggregate([
      {
        $group: {
          _id: "$client_id",
          totalPaid: { $sum: "$amount" },
        },
      },
    ]);

    // 3. Payments totals (this month only)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyPaymentsAgg = await ClientPaym.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: "$client_id",
          total: { $sum: "$amount" },
        },
      },
    ]);

    // ---------- Build maps ----------
    const salesMap = salesAgg.reduce((acc, s) => {
      acc[s._id.toString()] = s.totalSales;
      return acc;
    }, {} as Record<string, number>);

    const payMap = paymentsAgg.reduce((acc, p) => {
      acc[p._id.toString()] = p.totalPaid;
      return acc;
    }, {} as Record<string, number>);

    const monthlyPayMap = monthlyPaymentsAgg.reduce((acc, p) => {
      acc[p._id.toString()] = p.total;
      return acc;
    }, {} as Record<string, number>);

    // ---------- Attach to clients ----------
    return clients.map((client) => {
      const clientId = client._id.toString();
      const totalSales = salesMap[clientId] || 0;
      const totalPaid = payMap[clientId] || 0;
      const spentThisMonth = monthlyPayMap[clientId] || 0;

      return {
        ...client,
        _id: clientId,
        totalSales,
        totalPaid,
        debt: totalSales - totalPaid,
        spentThisMonth,
        social:
          client.social?.map((s: any) => ({
            ...s,
            _id: s._id.toString(),
          })) || [],
        createdAt: client.createdAt?.toISOString(),
        updatedAt: client.updatedAt?.toISOString(),
      };
    });
  } catch (error: any) {
    console.error("❌ Error fetching clients with debt:", error);
    throw new Error("Failed to fetch clients with debt info");
  }
};

export async function getClientById(client_id: string) {
  try {
    if (!client_id || typeof client_id !== "string") {
      throw new Error("Invalid client_id");
    }

    await connectDB();

    let client = null;

    if (mongoose.Types.ObjectId.isValid(client_id)) {
      client = await Client.findById(client_id).lean();
    }

    if (!client) {
      client = await Client.findOne({ client_id }).lean();
    }

    if (!client) {
      return null;
    }

    return JSON.parse(JSON.stringify(client));
  } catch (error) {
    console.error("❌ Error in getClientById:", error);
    return null;
  }
}
export const updateClient = async (
  id: string,
  updateData: Partial<IClient>
) => {
  try {
    await connectDB();

    if (updateData.social) {
      updateData.social = updateData.social.map(({ platform, account }) => ({
        platform,
        account,
      }));
    }

    const updatedClient = await Client.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .lean()
      .exec();

    if (!updatedClient) {
      return { success: false, error: "Client not found" };
    }

    const clientToReturn = {
      ...updatedClient,
      _id: updatedClient._id.toString(),
      createdAt: updatedClient.createdAt.toISOString(),
      updatedAt: updatedClient.updatedAt.toISOString(),
      social:
        updatedClient.social?.map((social) => ({
          platform: social.platform,
          account: social.account,
          _id: social._id.toString(),
        })) || [],
    };

    return {
      success: true,
      data: clientToReturn,
    };
  } catch (error) {
    console.error("Error updating client:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update client",
    };
  }
};
export const deleteClient = deleteOne(Client);

export const getClientDebt = async (clientId: string) => {
  try {
    await connectDB();

    const sales = await SellBon.aggregate([
      { $match: { clientId: new mongoose.Types.ObjectId(clientId) } },
      {
        $lookup: {
          from: "sellbdetails",
          localField: "_id",
          foreignField: "sellBonId",
          as: "details",
        },
      },
      {
        $project: {
          total: {
            $sum: {
              $map: {
                input: "$details",
                as: "d",
                in: { $multiply: ["$$d.price", "$$d.quantity"] },
              },
            },
          },
        },
      },
      { $group: { _id: null, totalSales: { $sum: "$total" } } },
    ]);

    const totalSales = sales[0]?.totalSales || 0;

    const payments = await ClientPaym.aggregate([
      { $match: { client_id: new mongoose.Types.ObjectId(clientId) } },
      { $group: { _id: null, totalPaid: { $sum: "$amount" } } },
    ]);

    const totalPaid = payments[0]?.totalPaid || 0;

    return {
      totalSales,
      totalPaid,
      debt: totalSales - totalPaid,
    };
  } catch (error) {
    console.error("❌ Error calculating client debt:", error);
    throw new Error("Failed to calculate client debt");
  }
};

export const getPaginatedClients = async (
  page: number = 1,
  limit: number = 10,
  searchTerm: string = "",
  filters: Partial<FilterState> = {}
) => {
  try {
    await connectDB();

    const skip = (page - 1) * limit;
    const match: any = {};

    // --- Status ---
    if (filters.isActive !== null && filters.isActive !== undefined) {
      match.isActive = filters.isActive;
    }

    // --- Base aggregation pipeline for clients ---
    let pipeline: any[] = [
      { $match: match },
    ];

    // --- Search term ---
    if (searchTerm) {
      pipeline.push({
        $match: {
          $or: [
            { client_id: { $regex: searchTerm, $options: "i" } },
            { name: { $regex: searchTerm, $options: "i" } },
            { email: { $regex: searchTerm, $options: "i" } },
            { phone: { $regex: searchTerm, $options: "i" } },
          ],
        },
      });
    }

    // --- Sorting & pagination ---
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    );

    // --- Get paginated clients ---
    const [clients, totalResult] = await Promise.all([
      Client.aggregate(pipeline),
      Client.aggregate([...pipeline.slice(0, -3), { $count: "count" }]),
    ]);

    const totalCount = totalResult[0]?.count || 0;

    if (!clients || clients.length === 0) {
      return { clients: [], total: totalCount };
    }

    // --- Prepare for aggregations ---
    const clientIds = clients.map(c => c._id);

    // --- Sales totals (from SellBon + SellBDetails) ---
    const salesAgg = await SellBon.aggregate([
      { $match: { clientId: { $in: clientIds } } },
      {
        $lookup: {
          from: "sellbdetails",
          localField: "_id",
          foreignField: "sellBonId",
          as: "details",
        },
      },
      { $unwind: "$details" },
      {
        $group: {
          _id: "$clientId",
          totalSales: {
            $sum: { $multiply: ["$details.price", "$details.quantity"] },
          },
        },
      },
    ]);

    // --- Payments totals (all-time) ---
    const paymentsAgg = await ClientPaym.aggregate([
      { $match: { client_id: { $in: clientIds } } },
      {
        $group: {
          _id: "$client_id",
          totalPaid: { $sum: "$amount" },
        },
      },
    ]);

    // --- Payments totals (this month only) ---
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyPaymentsAgg = await ClientPaym.aggregate([
      {
        $match: {
          client_id: { $in: clientIds },
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: "$client_id",
          total: { $sum: "$amount" },
        },
      },
    ]);

    // --- Build maps ---
    const salesMap = salesAgg.reduce((acc, s) => {
      acc[s._id.toString()] = s.totalSales;
      return acc;
    }, {} as Record<string, number>);

    const payMap = paymentsAgg.reduce((acc, p) => {
      acc[p._id.toString()] = p.totalPaid;
      return acc;
    }, {} as Record<string, number>);

    const monthlyPayMap = monthlyPaymentsAgg.reduce((acc, p) => {
      acc[p._id.toString()] = p.total;
      return acc;
    }, {} as Record<string, number>);

    // --- Attach calculated data to clients ---
    let enrichedClients = clients.map((client) => {
      const clientId = client._id.toString();
      const totalSales = salesMap[clientId] || 0;
      const totalPaid = payMap[clientId] || 0;
      const spentThisMonth = monthlyPayMap[clientId] || 0;
      const debt = totalSales - totalPaid;

      return {
        _id: clientId,
        client_id: client.client_id || "",
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        company: client.company || "",
        notes: client.notes || "",
        isActive: client.isActive ?? null,
        totalSales,
        totalPaid,
        debt,
        spentThisMonth,
        social: client.social?.map((s: any) => ({
          ...s,
          _id: s._id?.toString(),
        })) || [],
        createdAt: client.createdAt ? client.createdAt.toISOString() : null,
        updatedAt: client.updatedAt ? client.updatedAt.toISOString() : null,
      };
    });

    // --- Apply filters after calculation ---
    if (filters.debtRange) {
      enrichedClients = enrichedClients.filter(client => 
        client.debt >= filters.debtRange![0] && client.debt <= filters.debtRange![1]
      );
    }

    if (filters.spentAmountRange) {
      enrichedClients = enrichedClients.filter(client => 
        client.spentThisMonth >= filters.spentAmountRange![0] && 
        client.spentThisMonth <= filters.spentAmountRange![1]
      );
    }

    return {
      clients: enrichedClients,
      total: totalCount,
    };
  } catch (error: any) {
    console.error("❌ Error in getPaginatedClients:", error);
    throw new Error("Failed to fetch paginated clients");
  }
};