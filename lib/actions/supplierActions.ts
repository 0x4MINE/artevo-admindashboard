"use server";

import { Supplier } from "../models/supplierModel";
import {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} from "../factories/crudFactory";
import connectDB from "../mongoConnect";
import mongoose from "mongoose";
import FilterState from "@/types/FilterState";
import { BuyFact } from "../models/buyFactureModel";
import { SupplierPaym } from "../models/supplierPaymModel";

export const createSupplier = createOne(Supplier);
export const getSuppliers = getAll(Supplier);
export async function getSupplierDebt(supplier_id: string): Promise<number> {
  try {
    if (!supplier_id || typeof supplier_id !== "string") {
      throw new Error("Invalid supplier_id");
    }

    await connectDB();

    let supplierObjectId = null;

    // Check by Mongo ObjectId
    if (mongoose.Types.ObjectId.isValid(supplier_id)) {
      const supplier = await Supplier.findById(supplier_id)
        .select("_id")
        .lean();
      supplierObjectId = supplier?._id;
    }

    // Check by custom supplier_id field if not found
    if (!supplierObjectId) {
      const supplier = await Supplier.findOne({ supp_id: supplier_id })
        .select("_id")
        .lean();
      supplierObjectId = supplier?._id;
    }

    if (!supplierObjectId) {
      return 0;
    }

    // Get purchase total
    const purchasesAgg = await BuyFact.aggregate([
      { $match: { suppId: supplierObjectId } },
      {
        $lookup: {
          from: "buydetails",
          localField: "_id",
          foreignField: "buyFactId",
          as: "details",
        },
      },
      { $unwind: "$details" },
      {
        $group: {
          _id: null,
          totalPurchases: {
            $sum: {
              $multiply: [
                "$details.price",
                { $ifNull: ["$details.quantity", 1] },
              ],
            },
          },
        },
      },
    ]);

    // Get payment total
    const paymentsAgg = await SupplierPaym.aggregate([
      { $match: { supp_id: supplierObjectId } },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$amount" },
        },
      },
    ]);

    const totalPurchases = purchasesAgg[0]?.totalPurchases || 0;
    const totalPaid = paymentsAgg[0]?.totalPaid || 0;

    return totalPurchases - totalPaid;
  } catch (error) {
    console.error("Error in getSupplierDebt:", error);
    return 0;
  }
}
export async function getSupplierById(supplier_id: string) {
  try {
    if (!supplier_id || typeof supplier_id !== "string") {
      throw new Error("Invalid supplier_id");
    }

    await connectDB();

    let supplier = null;

    // Check by Mongo ObjectId
    if (mongoose.Types.ObjectId.isValid(supplier_id)) {
      supplier = await Supplier.findById(supplier_id).lean();
    }

    // Check by custom supplier_id field if not found
    if (!supplier) {
      supplier = await Supplier.findOne({ supp_id: supplier_id }).lean();
    }

    if (!supplier) {
      return null;
    }
    const debt =await getSupplierDebt(supplier_id);
    console.log(debt);
    return JSON.parse(JSON.stringify({ ...supplier, debt }));
  } catch (error) {
    console.error("Error in getSupplierById:", error);
    return null;
  }
}
export const updateSupplier = updateOne(Supplier);
export const deleteSupplier = deleteOne(Supplier);
export const getPaginatedSuppliers = async (
  page: number = 1,
  limit: number = 10,
  searchTerm: string = "",
  filters: Partial<FilterState> = {}
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

    // --- Status ---
    if (filters.isActive !== null && filters.isActive !== undefined) {
      match.isActive = filters.isActive;
    }

    // --- Base aggregation pipeline for suppliers ---
    let pipeline: any[] = [{ $match: match }];

    // --- Search term ---
    if (searchTerm) {
      pipeline.push({
        $match: {
          $or: [
            { supp_id: { $regex: searchTerm, $options: "i" } },
            { name: { $regex: searchTerm, $options: "i" } },
            { email: { $regex: searchTerm, $options: "i" } },
            { phone: { $regex: searchTerm, $options: "i" } },
            { RC: { $regex: searchTerm, $options: "i" } },
            { NIF: { $regex: searchTerm, $options: "i" } },
            { NIS: { $regex: searchTerm, $options: "i" } },
            { ART: { $regex: searchTerm, $options: "i" } },
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

    // --- Get paginated suppliers ---
    const [suppliers, totalResult] = await Promise.all([
      Supplier.aggregate(pipeline),
      Supplier.aggregate([...pipeline.slice(0, -3), { $count: "count" }]),
    ]);

    const totalCount = totalResult[0]?.count || 0;

    if (!suppliers || suppliers.length === 0) {
      return { suppliers: [], total: totalCount };
    }

    // --- Prepare for aggregations ---
    const supplierIds = suppliers.map((s) => s._id);

    // --- Purchase totals (from BuyFact + BuyDetails) ---
    const purchasesAgg = await BuyFact.aggregate([
      { $match: { suppId: { $in: supplierIds } } },
      {
        $lookup: {
          from: "buydetails",
          localField: "_id",
          foreignField: "buyFactId", // Correct field name
          as: "details",
        },
      },
      { $unwind: "$details" },
      {
        $group: {
          _id: "$suppId",
          totalPurchases: {
            $sum: {
              $multiply: [
                "$details.price",
                { $ifNull: ["$details.quantity", 1] }, // Handle services with quantity 1
              ],
            },
          },
          purchaseCount: { $sum: 1 },
        },
      },
    ]);

    // --- Payments totals (all-time) ---
    const paymentsAgg = await SupplierPaym.aggregate([
      { $match: { supp_id: { $in: supplierIds } } },
      {
        $group: {
          _id: "$supp_id",
          totalPaid: { $sum: "$amount" },
          paymentCount: { $sum: 1 },
        },
      },
    ]);

    // --- Payments totals (this month only) ---
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyPaymentsAgg = await SupplierPaym.aggregate([
      {
        $match: {
          supp_id: { $in: supplierIds },
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: "$supp_id",
          total: { $sum: "$amount" },
          monthlyPaymentCount: { $sum: 1 },
        },
      },
    ]);

    // --- Build maps ---
    const purchasesMap = purchasesAgg.reduce((acc, p) => {
      acc[p._id.toString()] = {
        totalPurchases: p.totalPurchases,
        purchaseCount: p.purchaseCount,
      };
      return acc;
    }, {} as Record<string, { totalPurchases: number; purchaseCount: number }>);

    const payMap = paymentsAgg.reduce((acc, p) => {
      acc[p._id.toString()] = {
        totalPaid: p.totalPaid,
        paymentCount: p.paymentCount,
      };
      return acc;
    }, {} as Record<string, { totalPaid: number; paymentCount: number }>);

    const monthlyPayMap = monthlyPaymentsAgg.reduce((acc, p) => {
      acc[p._id.toString()] = {
        paidThisMonth: p.total,
        monthlyPaymentCount: p.monthlyPaymentCount,
      };
      return acc;
    }, {} as Record<string, { paidThisMonth: number; monthlyPaymentCount: number }>);

    // --- Attach calculated data to suppliers ---
    let enrichedSuppliers = suppliers.map((supplier) => {
      const supplierId = supplier._id.toString();
      const purchaseData = purchasesMap[supplierId] || {
        totalPurchases: 0,
        purchaseCount: 0,
      };
      const paymentData = payMap[supplierId] || {
        totalPaid: 0,
        paymentCount: 0,
      };
      const monthlyPaymentData = monthlyPayMap[supplierId] || {
        paidThisMonth: 0,
        monthlyPaymentCount: 0,
      };

      const totalPurchases = purchaseData.totalPurchases;
      const totalPaid = paymentData.totalPaid;
      const paidThisMonth = monthlyPaymentData.paidThisMonth;
      const debt = totalPurchases - totalPaid;

      return {
        _id: supplierId,
        supp_id: supplier.supp_id || "",
        name: supplier.name || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        description: supplier.description || "",
        type: supplier.type || "",
        RC: supplier.RC || "",
        NIF: supplier.NIF || "",
        NIS: supplier.NIS || "",
        ART: supplier.ART || "",
        isActive: supplier.isActive ?? null,
        totalPurchases,
        totalPaid,
        debt,
        paidThisMonth,
        purchaseCount: purchaseData.purchaseCount,
        paymentCount: paymentData.paymentCount,
        monthlyPaymentCount: monthlyPaymentData.monthlyPaymentCount,
        createdAt: supplier.createdAt ? supplier.createdAt.toISOString() : null,
        updatedAt: supplier.updatedAt ? supplier.updatedAt.toISOString() : null,
      };
    });

    // --- Apply filters after calculation ---
    if (filters.debtRange) {
      enrichedSuppliers = enrichedSuppliers.filter(
        (supplier) =>
          supplier.debt >= filters.debtRange![0] &&
          supplier.debt <= filters.debtRange![1]
      );
    }

    if (filters.amountRange) {
      enrichedSuppliers = enrichedSuppliers.filter(
        (supplier) =>
          supplier.paidThisMonth >= filters.amountRange![0] &&
          supplier.paidThisMonth <= filters.amountRange![1]
      );
    }

    if (filters.buyAmountRange) {
      enrichedSuppliers = enrichedSuppliers.filter(
        (supplier) =>
          supplier.totalPurchases >= filters.buyAmountRange![0] &&
          supplier.totalPurchases <= filters.buyAmountRange![1]
      );
    }

    return {
      suppliers: enrichedSuppliers,
      total: totalCount,
    };
  } catch (error: any) {
    console.error("❌ Error in getPaginatedSuppliers:", error);
    throw new Error("Failed to fetch paginated suppliers");
  }
};
