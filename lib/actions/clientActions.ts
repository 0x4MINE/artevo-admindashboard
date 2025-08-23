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

export const createClient = createOne(Client);

export const getClients = async () => {
  await connectDB();

  const clients = await Client.find().lean();

  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  const endOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  );

  const payments = await ClientPaym.aggregate([
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

  const paymentMap = payments.reduce((acc, p) => {
    acc[p._id.toString()] = p.total;
    return acc;
  }, {} as Record<string, number>);

  return clients.map((c) => ({
    ...c,
    _id: c._id.toString(),
    spentThisMonth: paymentMap[c._id.toString()] || 0,
    social:
      c.social?.map((s) => ({
        ...s,
        _id: s._id.toString(),
      })) || [],
    createdAt: c.createdAt?.toISOString(),
    updatedAt: c.updatedAt?.toISOString(),
  }));
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
