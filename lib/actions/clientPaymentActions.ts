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

export const getClientPaymentsPaginated = async (
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
          clientId: {
            $cond: [
              { $ifNull: ["$clientId", false] },
              { $toObjectId: "$clientId" },
              null,
            ],
          },
          by: {
            $cond: [{ $ifNull: ["$by", false] }, { $toObjectId: "$by" }, null],
          },
        },
      },

      // Join client
      {
        $lookup: {
          from: "clients",
          localField: "client_id",
          foreignField: "_id",
          as: "client",
        },
      },
      { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },

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
          client_name: { $ifNull: ["$client.name", "Walk-in Customer"] },
          by: { $ifNull: ["$user.name", "System"] },
        },
      },
    ];

    // --- Search ---
    if (searchTerm) {
      pipeline.push({
        $match: {
          $or: [
            { clientPay_id: { $regex: searchTerm, $options: "i" } },
            { client_name: { $regex: searchTerm, $options: "i" } },
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
      ClientPaym.aggregate(pipeline),
      ClientPaym.aggregate([...pipeline.slice(0, -3), { $count: "count" }]),
    ]);

    const totalCount = total[0]?.count || 0;

    // --- Serialize ---
    const serializedPayments = payments.map((p: any) => ({
      _id: p._id?.toString() || "",
      clientPay_id: p.clientPay_id || "",
      date: p.date ? p.date.toISOString() : null,
      amount: p.amount ?? 0,

      clientId: p.clientId?.toString() || null,
      client_name: p.client_name,

      by: p.by,
      userId: p.user?._id?.toString() || null,

      user: p.user
        ? {
            _id: p.user._id?.toString() || "",
            name: p.user.name || "",
            email: p.user.email || "",
          }
        : null,

      client: p.client
        ? {
            _id: p.client._id?.toString() || "",
            client_id: p.client.client_id || "",
            name: p.client.name || "",
            email: p.client.email || "",
            phone: p.client.phone || "",
          }
        : null,

      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
    }));

    return { payments: serializedPayments, total: totalCount };
  } catch (error: any) {
    console.error("❌ Error in getClientPaymentsPaginated:", error);
    throw new Error("Failed to fetch paginated client payments");
  }
};
