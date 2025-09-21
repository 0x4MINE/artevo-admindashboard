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
import FilterState from "@/types/FilterState";

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


export const getSupplierPaymentsPaginated = async (
  page: number = 1,
  limit: number = 10,
  searchTerm: string = "",
  filters: any = {}
) => {
  try {
    await connectDB();
    const skip = (page - 1) * limit;
    const match: any = {};

    // --- Date range ---
    if (filters.dateRange?.[0] || filters.dateRange?.[1]) {
      const dateFilter: any = {};
      if (filters.dateRange[0])
        dateFilter.$gte = new Date(filters.dateRange[0]);
      if (filters.dateRange[1]) {
        const end = new Date(filters.dateRange[1]);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      match.$or = [{ date: dateFilter }, { createdAt: dateFilter }];
    }

    // --- Aggregation pipeline ---
    const pipeline: any[] = [
      { $match: match },

      // Convert refs to ObjectId
      {
        $addFields: {
          supplierId: {
            $cond: [
              { $ifNull: ["$supplier_id", false] },
              { $toObjectId: "$supplier_id" },
              null,
            ],
          },
          userId: {
            $cond: [
              { $ifNull: ["$user_id", false] },
              { $toObjectId: "$user_id" },
              null,
            ],
          },
        },
      },

      // Join supplier
      {
        $lookup: {
          from: "suppliers",
          localField: "supplier_id",
          foreignField: "_id",
          as: "supplier",
        },
      },
      { $unwind: { path: "$supplier", preserveNullAndEmptyArrays: true } },

      // Join user ("by")
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      // Derived fields
      {
        $addFields: {
          supplier_name: { $ifNull: ["$supplier.name", "Unknown Supplier"] },
          by: { $ifNull: ["$user.name", "System"] },
        },
      },
    ];

    // --- Search ---
    if (searchTerm) {
      pipeline.push({
        $match: {
          $or: [
            { supplierPay_id: { $regex: searchTerm, $options: "i" } },
            { supplier_name: { $regex: searchTerm, $options: "i" } },
            { by: { $regex: searchTerm, $options: "i" } },
          ],
        },
      });
    }

    // --- Amount filter ---
    if (filters.amountRange) {
      pipeline.push({
        $match: {
          amount: {
            $gte: filters.amountRange[0],
            $lte: filters.amountRange[1],
          },
        },
      });
    }

    // --- Sorting & pagination ---
    pipeline.push(
      { $sort: { date: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    );

    // --- Query + count ---
    const [payments, total] = await Promise.all([
      SupplierPaym.aggregate(pipeline),
      SupplierPaym.aggregate([...pipeline.slice(0, -3), { $count: "count" }]),
    ]);

    const totalCount = total[0]?.count || 0;

    // --- Serialize ---
    const serializedPayments = payments.map((p: any) => ({
      _id: p._id?.toString() || "",
      supplierPay_id: p.supplierPay_id || "",
      date: p.date ? p.date.toISOString() : null,
      amount: p.amount ?? 0,

      supplierId: p.supplierId?.toString() || null,
      supplier_name: p.supplier_name,

      by: p.by,
      userId: p.user?._id?.toString() || null,

      user: p.user
        ? {
            _id: p.user._id?.toString() || "",
            name: p.user.name || "",
            email: p.user.email || "",
          }
        : null,

      supplier: p.supplier
        ? {
            _id: p.supplier._id?.toString() || "",
            supp_id: p.supplier.supp_id || "",
            name: p.supplier.name || "",
            email: p.supplier.email || "",
            phone: p.supplier.phone || "",
            address: p.supplier.address || "",
          }
        : null,

      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
    }));

    return { payments: serializedPayments, total: totalCount };
  } catch (error: any) {
    console.error("❌ Error in getSupplierPaymentsPaginated:", error);
    throw new Error("Failed to fetch paginated supplier payments");
  }
};