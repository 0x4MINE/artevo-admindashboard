"use server";

import { SupplierPaym, ISupplierPaym } from "../models/supplierPaymModel";
import {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} from "../factories/crudFactory";
import connectDB from "../mongoConnect";

export const createSupplierPaym = async (data: Partial<ISupplierPaym>) => {
  await connectDB();

  const payment = await SupplierPaym.create(data);
  await payment.populate("supplier_id", "name");
  await payment.populate("user_id", "name");

  const obj = payment.toObject();

  return {
    success: true,
    data: {
      ...obj,
      _id: obj._id.toString(),
      supplier_id:
        obj.supplier_id?._id?.toString() || obj.supplier_id?.toString() || null,
      supplier_name: obj.supplier_id?.name || "",
      user_id: obj.user_id?._id?.toString() || obj.user_id?.toString() || null,
      user_name: obj.user_id?.name || "",
      date: obj.date ? new Date(obj.date).toISOString() : null,
      createdAt: obj.createdAt ? obj.createdAt.toISOString() : null,
      updatedAt: obj.updatedAt ? obj.updatedAt.toISOString() : null,
    },
  };
};
export async function getSupplierPayms() {
  try {
    await connectDB();
    const payments = await SupplierPaym.find({})
      .populate("supplier_id", "name")
      .populate("user_id", "name")
      .sort({ date: -1 })
      .lean();

    console.log(payments);
    return payments.map((p) => ({
      ...p,
      supplier_name: p.supplier_id?.name || "Unknown",
      by: p.user_id?.name || p.by || "System",
      supplier_id: p.supplier_id?._id?.toString(),
      user_id: p.user_id?._id?.toString(),
      _id: p._id.toString(),
      date: p.date?.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching payments:", error);
    return [];
  }
}
export const getSupplierPaymById = getOne(SupplierPaym);

export async function updateSupplierPaym(id: string, data: any) {
  try {
    await connectDB();

    const payment = await SupplierPaym.findByIdAndUpdate(id, data, {
      new: true,
    })
      .populate("supplier_id", "name")
      .populate("user_id", "name")
      .lean();
    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    const formatted = {
      ...payment,
      _id: payment._id.toString(),
      supplier_id: payment.supplier_id?._id?.toString(),
      supplier_name: payment.supplier_id?.name || "Unknown",
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
export const deleteSupplierPaym = deleteOne(SupplierPaym);
