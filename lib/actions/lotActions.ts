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
  filters: Partial<{
    dateRange: [string, string];
    quantityRange: [number, number];
    isActive: boolean | null;
  }> = {}
) => {
  await connectDB();

  const skip = (page - 1) * limit;

  const match: any = {};

  // --- Normal filters ---
  if (filters.dateRange?.[0] && filters.dateRange?.[1]) {
    match.date = {
      $gte: new Date(filters.dateRange[0]),
      $lte: new Date(filters.dateRange[1]),
    };
  }

  if (filters.quantityRange) {
    match.quantity = {
      $gte: filters.quantityRange[0],
      $lte: filters.quantityRange[1],
    };
  }

  if (filters.isActive !== null && filters.isActive !== undefined) {
    match.isActive = filters.isActive;
  }

  // --- Aggregation ---
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

  // --- Search term across lot_id, supplier.name, product.name ---
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

  // --- Sorting and pagination ---
  pipeline.push(
    { $sort: { date: -1 } },
    { $skip: skip },
    { $limit: limit }
  );

  // --- Count for pagination ---
  const [lots, total] = await Promise.all([
    Lot.aggregate(pipeline),
    Lot.aggregate([...pipeline.slice(0, -3), { $count: "count" }]),
  ]);

  const totalCount = total[0]?.count || 0;

  return {
    lots: lots.map((lot: any) => ({
      ...lot,
      _id: lot._id.toString(),
      supp_id: lot.supplier?._id?.toString() || null,
      supp_name: lot.supplier?.name || "",
      prod_id: lot.product
        ? { ...lot.product, _id: lot.product._id.toString() }
        : null,
      date: lot.date ? lot.date.toISOString() : null,
      createdAt: lot.createdAt?.toISOString() || null,
      updatedAt: lot.updatedAt?.toISOString() || null,
    })),
    total: totalCount,
  };
};
