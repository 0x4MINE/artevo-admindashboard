"use server";

import { ClientPaym, IClientPaym } from "../models/clientPayModel";
import {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} from "../factories/crudFactory";
import connectDB from "../mongoConnect";

export const createClientPaym = async (data: Partial<IClientPaym>) => {
  await connectDB();

  const payment = await ClientPaym.create(data);
  await payment.populate("client_id", "name");
  await payment.populate("user_id", "name");

  const obj = payment.toObject();

  return {
    success: true,
    data: {
      ...obj,
      _id: obj._id.toString(),
      client_id:
        obj.client_id?._id?.toString() || obj.client_id?.toString() || null,
      client_name: obj.client_id?.name || "",
      user_id: obj.user_id?._id?.toString() || obj.user_id?.toString() || null,
      user_name: obj.user_id?.name || "",
      date: obj.date ? new Date(obj.date).toISOString() : null,
      createdAt: obj.createdAt ? obj.createdAt.toISOString() : null,
      updatedAt: obj.updatedAt ? obj.updatedAt.toISOString() : null,
    },
  };
};
export async function getClientPayms() {
  try {
    await connectDB();
    const payments = await ClientPaym.find({})
      .populate("client_id", "name")
      .populate("user_id", "name")
      .sort({ date: -1 })
      .lean();

    console.log(payments);
    return payments.map((p) => ({
      ...p,
      client_name: p.client_id?.name || "Unknown",
      by: p.user_id?.name || p.by || "System",
      client_id: p.client_id?._id?.toString(),
      user_id: p.user_id?._id?.toString(),
      _id: p._id.toString(),
      date: p.date?.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching payments:", error);
    return [];
  }
}
export const getClientPaymById = getOne(ClientPaym);

export async function updateClientPaym(id: string, data: any) {
  try {
    await connectDB();

    const payment = await ClientPaym.findByIdAndUpdate(id, data, {
      new: true,
    })
      .populate("client_id", "name")
      .populate("user_id", "name")
      .lean();
    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    const formatted = {
      ...payment,
      _id: payment._id.toString(),
      client_id: payment.client_id?._id?.toString(),
      client_name: payment.client_id?.name || "Unknown",
      user_id: payment.user_id?._id?.toString(),
      by: payment.user_id?.name || payment.by || "System",
      date: payment.date?.toISOString(),
      createdAt: payment.createdAt?.toISOString(),
      updatedAt: payment.updatedAt?.toISOString(),
    };
    console.log({ formatted });
    return { success: true, data: formatted };
  } catch (error) {
    console.error("Error updating payment:", error);
    return { success: false, error: "Failed to update payment" };
  }
}
export const deleteClientPaym = deleteOne(ClientPaym);
