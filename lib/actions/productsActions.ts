"use server";

import FilterState from "@/types/FilterState";
import {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} from "../factories/crudFactory";
import { Category } from "../models/categoryModel";
import { Product } from "../models/productModel";
import connectDB from "../mongoConnect";

export const createProduct = async (data: any) => {
  try {
    await connectDB();

    const product = await Product.create(data);

    const populatedProduct = await product.populate("cat_id", "name");

    const plainProduct = {
      ...populatedProduct.toObject(),
      _id: populatedProduct._id.toString(),
      cat_id: populatedProduct.cat_id?._id?.toString() || null,
      categoryName: populatedProduct.cat_id?.name || "-",
      createdAt: populatedProduct.createdAt?.toISOString(),
      updatedAt: populatedProduct.updatedAt?.toISOString(),
    };

    return { success: true, data: plainProduct };
  } catch (error: any) {
    console.error("Error creating product:", error);
    return { success: false, error: error.message };
  }
};

export const getProduct = async () => {
  await connectDB();

  const data = await Product.find()
    .populate("lots")
    .populate("cat_id", "name")
    .lean({ virtuals: true });

  return data.map((product: any) => ({
    _id: product._id.toString(),
    prod_id: product.prod_id,
    barcode_id: product.barcode_id,
    name: product.name,
    isActive: product.isActive,
    tva: product.tva,
    cat_id: product.cat_id?._id?.toString() || null,
    categoryName: product.cat_id?.name || "-",
    lots:
      product.lots?.map((lot: any) => ({
        _id: lot._id.toString(),
        lot_id: lot.lot_id,
        buyPrice: lot.buyPrice,
        sellPrice: lot.sellPrice,
        quantity: lot.quantity,
        isActive: lot.isActive,
        date: lot.date?.toISOString() || null,
        createdAt: lot.createdAt?.toISOString() || null,
        updatedAt: lot.updatedAt?.toISOString() || null,
        supp_id: lot.supp_id?.toString(),
        prod_id: lot.prod_id?.toString(),
      })) ?? [],
    quantity:
      product.lots?.reduce(
        (sum: number, lot: any) => sum + (lot.quantity || 0),
        0
      ) || 0,
  }));
};

export const getProductById = getOne(Product);

export const updateProduct = async (id: string, data: any) => {
  await connectDB();

  try {
    const updated = await Product.findByIdAndUpdate(id, data, { new: true });

    if (!updated) {
      return { success: false, error: "Product not found" };
    }

    const plainProduct = JSON.parse(JSON.stringify(updated));

    return { success: true, data: plainProduct };
  } catch (error: any) {
    console.error("Update product error:", error);
    return {
      success: false,
      error: error.message || "Failed to update product",
    };
  }
};
export const deleteProduct = deleteOne(Product);

export const getPaginatedProducts = async (
  page: number = 1,
  limit: number = 10,
  searchTerm: string = "",
  filters: Partial<FilterState> = {}
) => {
  await connectDB();

  const skip = (page - 1) * limit;
  const match: any = {};

  // --- Status ---
  if (filters.isActive !== null && filters.isActive !== undefined) {
    match.isActive = filters.isActive;
  }

  // --- Aggregation pipeline ---
  const pipeline: any[] = [
    { $match: match },

    // --- Category join ---
    {
      $lookup: {
        from: "categories",
        localField: "cat_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

    // --- Lots join ---
    {
      $lookup: {
        from: "lots",
        localField: "_id",
        foreignField: "prod_id",
        as: "lots",
      },
    },

    // --- Calculate total quantity from lots ---
    {
      $addFields: {
        quantity: {
          $sum: "$lots.quantity",
        },
        categoryName: {
          $ifNull: ["$category.name", "-"],
        },
      },
    },
  ];

  // --- Search term ---
  if (searchTerm) {
    pipeline.push({
      $match: {
        $or: [
          { prod_id: { $regex: searchTerm, $options: "i" } },
          { barcode_id: { $regex: searchTerm, $options: "i" } },
          { name: { $regex: searchTerm, $options: "i" } },
          { categoryName: { $regex: searchTerm, $options: "i" } },
        ],
      },
    });
  }

  // --- Quantity range filter (after calculating quantity) ---
  if (filters.quantityRange) {
    pipeline.push({
      $match: {
        quantity: {
          $gte: filters.quantityRange[0],
          $lte: filters.quantityRange[1],
        },
      },
    });
  }

  // --- Sorting & pagination ---
  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit }
  );

  // --- Count for pagination ---
  const [products, total] = await Promise.all([
    Product.aggregate(pipeline),
    Product.aggregate([...pipeline.slice(0, -3), { $count: "count" }]),
  ]);

  const totalCount = total[0]?.count || 0;

  // --- Serialize safely ---
  const serializedProducts = products.map((product: any) => ({
    _id: product._id.toString(),
    prod_id: product.prod_id || "",
    barcode_id: product.barcode_id || "",
    name: product.name || "",
    isActive: product.isActive ?? null,
    tva: product.tva ?? null,
    cat_id: product.cat_id?.toString() || null,
    categoryName: product.categoryName || "-",
    quantity: product.quantity || 0,

    lots:
      product.lots?.map((lot: any) => ({
        _id: lot._id.toString(),
        lot_id: lot.lot_id,
        buyPrice: lot.buyPrice,
        sellPrice: lot.sellPrice,
        quantity: lot.quantity,
        isActive: lot.isActive,
        date: lot.date?.toISOString() || null,
        createdAt: lot.createdAt?.toISOString() || null,
        updatedAt: lot.updatedAt?.toISOString() || null,
        supp_id: lot.supp_id?.toString() || null,
        prod_id: lot.prod_id?.toString() || null,
      })) || [],

    createdAt: product.createdAt ? product.createdAt.toISOString() : null,
    updatedAt: product.updatedAt ? product.updatedAt.toISOString() : null,
  }));

  return {
    products: serializedProducts,
    total: totalCount,
  };
};
