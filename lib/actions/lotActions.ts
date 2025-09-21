"use server";
import "../models/supplierModel";
import "../models/productModel";
import { Lot, ILot } from "../models/lotModel";
import { Product } from "../models/productModel";
import {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} from "../factories/crudFactory";
import connectDB from "../mongoConnect";
import FilterState from "@/types/FilterState";

export const createLot = async (data: Partial<ILot>) => {
  await connectDB();

  const payload: any = { ...data };
  if (typeof payload.date === "string") payload.date = new Date(payload.date);

  const lot = await Lot.create(payload);

  if (payload.prod_id && typeof payload.quantity === "number") {
    await Product.findByIdAndUpdate(payload.prod_id, {
      $inc: { quantity: payload.quantity },
    });
  }

  await lot.populate([
    { path: "supp_id", select: "name" },
    { path: "prod_id", select: "name prod_id" },
  ]);

  const obj = lot.toObject();
  console.log(obj);
  return {
    success: true,
    data: {
      ...obj,
      _id: obj._id.toString(),
      supp_id: obj.supp_id?._id?.toString() || null,
      supp_name: obj.supp_id?.name || "",
      prod_id: obj.prod_id
        ? { ...obj.prod_id, _id: obj.prod_id._id.toString() }
        : null,
      date: obj.date ? obj.date.toISOString() : null,
      createdAt: obj.createdAt?.toISOString() || null,
      updatedAt: obj.updatedAt?.toISOString() || null,
    },
  };
};

export const getLots = async () => {
  await connectDB();

  const lots = await Lot.find()
    .sort({ date: -1 })
    .populate("supp_id", "name")
    .populate("prod_id", "name")
    .lean()
    .exec();

  return lots.map((lot: any) => ({
    ...lot,
    _id: lot._id.toString(),
    supp_id: lot.supp_id.supp_id,
    supp_name: lot.supp_id.name,
    prod_id: lot.prod_id
      ? { ...lot.prod_id, _id: lot.prod_id._id.toString() }
      : null,
    date: lot.date ? lot.date.toISOString() : null,
    createdAt: lot.createdAt?.toISOString() || null,
    updatedAt: lot.updatedAt?.toISOString() || null,
  }));
};

export const getLotById = async (id: string) => {
  await connectDB();

  const lot = await Lot.findById(id)
    .populate("supp_id", "name")
    .populate("prod_id", "name")
    .lean()
    .exec();

  if (!lot) return null;

  return {
    ...lot,
    _id: lot._id.toString(),
    supp_id: lot.supp_id?._id?.toString() || null,
    supp_name: lot.supp_id?.name || "",
    prod_id: lot.prod_id
      ? { ...lot.prod_id, _id: lot.prod_id._id.toString() }
      : null,
    date: lot.date ? lot.date.toISOString() : null,
    createdAt: lot.createdAt?.toISOString() || null,
    updatedAt: lot.updatedAt?.toISOString() || null,
  };
};
export const updateLot = async (id: string, data: Partial<ILot>) => {
  await connectDB();

  const oldLot = await Lot.findById(id).lean();
  if (!oldLot) {
    return { success: false, error: "Lot not found" };
  }

  const updatedLot = await Lot.findByIdAndUpdate(id, data, { new: true })
    .populate("supp_id", "name")
    .populate("prod_id", "name")
    .lean();

  // --- Stock adjustments ---
  if (oldLot.prod_id) {
    let qtyChange = 0;

    // Quantity changed (while active)
    if (data.quantity !== undefined && oldLot.isActive && updatedLot.isActive) {
      qtyChange = data.quantity - oldLot.quantity;
    }

    // Lot deactivated
    if (oldLot.isActive && updatedLot.isActive === false) {
      qtyChange = -oldLot.quantity;
    }

    // Lot re-activated
    if (oldLot.isActive === false && updatedLot.isActive) {
      qtyChange = oldLot.quantity;
    }

    // If quantity changed + activation toggle
    if (
      data.quantity !== undefined &&
      oldLot.isActive === false &&
      updatedLot.isActive
    ) {
      // In this case, use the *new* quantity
      qtyChange = data.quantity;
    }

    if (qtyChange !== 0) {
      await Product.findByIdAndUpdate(oldLot.prod_id, {
        $inc: { quantity: qtyChange },
      });
    }
  }

  return {
    success: true,
    data: {
      ...updatedLot,
      _id: updatedLot._id.toString(),
      supp_id:
        typeof updatedLot.supp_id === "object"
          ? updatedLot.supp_id._id.toString()
          : updatedLot.supp_id,
      supp_name:
        typeof updatedLot.supp_id === "object" ? updatedLot.supp_id.name : null,
      prod_id:
        typeof updatedLot.prod_id === "object"
          ? updatedLot.prod_id._id.toString()
          : updatedLot.prod_id,
      prod_name:
        typeof updatedLot.prod_id === "object" ? updatedLot.prod_id.name : null,
      date: updatedLot.date ? updatedLot.date.toISOString() : null,
      createdAt: updatedLot.createdAt?.toISOString() || null,
      updatedAt: updatedLot.updatedAt?.toISOString() || null,
    },
  };
};

export const deleteLot = async (id: string) => {
  await connectDB();

  const lot = await Lot.findById(id).lean();
  if (!lot) return { success: false, error: "Lot not found" };

  await Lot.findByIdAndDelete(id);

  if (lot.prod_id && typeof lot.quantity === "number") {
    await Product.findByIdAndUpdate(lot.prod_id, {
      $inc: { quantity: -lot.quantity },
    });
  }

  return { success: true };
};

export const getLotsByProductId = async (productId: string) => {
  await connectDB();

  const lots = await Lot.find({ prod_id: productId })
    .populate("supp_id", "name")
    .populate("prod_id", "name prod_id tva")
    .lean()
    .exec();

  return lots.map((lot: any) => ({
    ...lot,
    _id: lot._id.toString(),
    supp_id: lot.supp_id?._id?.toString() || null,
    supp_name: lot.supp_id?.name || "",
    prod_id: lot.prod_id
      ? { ...lot.prod_id, _id: lot.prod_id._id.toString() }
      : null,
    date: lot.date ? lot.date.toISOString() : null,
    createdAt: lot.createdAt?.toISOString() || null,
    updatedAt: lot.updatedAt?.toISOString() || null,
  }));
};

export const getLotsPaginated = async (
  page: number = 1,
  limit: number = 5,
  searchTerm: string = "",
  filters: Partial<FilterState> = {}
) => {
  await connectDB();

  const skip = (page - 1) * limit;

  const match: any = {};

  // --- Date range ---
  if (filters.dateRange?.[0] || filters.dateRange?.[1]) {
    match.createdAt = {};
    if (filters.dateRange[0]) {
      // start of day
      const startDate = new Date(filters.dateRange[0]);
      startDate.setHours(0, 0, 0, 0);
      match.createdAt.$gte = startDate;
    }
    if (filters.dateRange[1]) {
      // end of day
      const endDate = new Date(filters.dateRange[1]);
      endDate.setHours(23, 59, 59, 999);
      match.createdAt.$lte = endDate;
    }
  }

  // --- Quantity range ---
  if (filters.quantityRange) {
    match.quantity = {
      $gte: filters.quantityRange[0],
      $lte: filters.quantityRange[1],
    };
  }

  // --- Buy amount range ---
  if (filters.buyAmountRange) {
    match.buyPrice = {
      $gte: filters.buyAmountRange[0],
      $lte: filters.buyAmountRange[1],
    };
  }

  // --- Sell amount range ---
  if (filters.sellAmountRange) {
    match.sellPrice = {
      $gte: filters.sellAmountRange[0],
      $lte: filters.sellAmountRange[1],
    };
  }

  // --- Status ---
  if (filters.isActive !== null && filters.isActive !== undefined) {
    match.isActive = filters.isActive;
  }

  // --- Aggregation pipeline ---
  const pipeline: any[] = [
    { $match: match },

    // supplier join
    {
      $lookup: {
        from: "suppliers",
        localField: "supp_id",
        foreignField: "_id",
        as: "supplier",
      },
    },
    { $unwind: { path: "$supplier", preserveNullAndEmptyArrays: true } },

    // product join
    {
      $lookup: {
        from: "products",
        localField: "prod_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
  ];

  // --- Search term ---
  if (searchTerm) {
    pipeline.push({
      $match: {
        $or: [
          { lot_id: { $regex: searchTerm, $options: "i" } },
          { "supplier.name": { $regex: searchTerm, $options: "i" } },
          { "product.name": { $regex: searchTerm, $options: "i" } },
        ],
      },
    });
  }

  // --- Sorting & pagination ---
  pipeline.push({ $sort: { date: -1 } }, { $skip: skip }, { $limit: limit });

  // --- Count for pagination ---
  const [lots, total] = await Promise.all([
    Lot.aggregate(pipeline),
    Lot.aggregate([...pipeline.slice(0, -3), { $count: "count" }]),
  ]);

  const totalCount = total[0]?.count || 0;

  // --- Serialize safely ---
  const serializedLots = lots.map((lot: any) => ({
    _id: lot._id.toString(),
    lot_id: lot.lot_id,
    date: lot.date ? lot.date.toISOString() : null,
    buyPrice: lot.buyPrice,
    sellPrice: lot.sellPrice,
    quantity: lot.quantity,
    isActive: lot.isActive,

    // supplier
    supplier: lot.supplier
      ? {
          _id: lot.supplier._id?.toString(),
          supp_id: lot.supplier.supp_id || "",
          name: lot.supplier.name || "",
          phone: lot.supplier.phone || "",
          email: lot.supplier.email || "",
          description: lot.supplier.description || "",
          type: lot.supplier.type || "",
          isActive: lot.supplier.isActive ?? null,
          RC: lot.supplier.RC || "",
          NIF: lot.supplier.NIF || "",
          NIS: lot.supplier.NIS || "",
          ART: lot.supplier.ART || "",
          address: lot.supplier.address || "",
          createdAt: lot.supplier.createdAt
            ? new Date(lot.supplier.createdAt).toISOString()
            : null,
          updatedAt: lot.supplier.updatedAt
            ? new Date(lot.supplier.updatedAt).toISOString()
            : null,
        }
      : null,

    // product
    product: lot.product
      ? {
          _id: lot.product._id?.toString(),
          prod_id: lot.product.prod_id || "",
          barcode_id: lot.product.barcode_id || "",
          name: lot.product.name || "",
          isActive: lot.product.isActive ?? null,
          cat_id: lot.product.cat_id?.toString() || null,
          tva: lot.product.tva ?? null,
        }
      : null,

    supp_id: lot.supplier?._id?.toString() || null,
    supp_name: lot.supplier?.name || "",

    createdAt: lot.createdAt ? lot.createdAt.toISOString() : null,
    updatedAt: lot.updatedAt ? lot.updatedAt.toISOString() : null,
  }));

  return {
    lots: serializedLots,
    total: totalCount,
  };
};
