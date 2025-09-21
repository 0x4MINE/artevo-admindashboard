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
import connectDB from "../mongoConnect";

export const createCategory = createOne(Category);
export const getCategory = getAll(Category);
export const getCategoryById = getOne(Category);
export const updateCategory = updateOne(Category);
export const deleteCategory = deleteOne(Category);

export const getPaginatedCategories = async (
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

    // --- Products join to count products in category ---
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "cat_id",
        as: "products",
      },
    },

    // --- Add calculated fields ---
    {
      $addFields: {
        productCount: { $size: "$products" },
      },
    },
  ];

  // --- Search term ---
  if (searchTerm) {
    pipeline.push({
      $match: {
        $or: [
          { cat_id: { $regex: searchTerm, $options: "i" } },
          { name: { $regex: searchTerm, $options: "i" } },
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

  // --- Count for pagination ---
  const [categories, total] = await Promise.all([
    Category.aggregate(pipeline),
    Category.aggregate([...pipeline.slice(0, -3), { $count: "count" }]),
  ]);

  const totalCount = total[0]?.count || 0;

  // --- Serialize safely ---
  const serializedCategories = categories.map((category: any) => ({
    _id: category._id.toString(),
    cat_id: category.id || "",
    name: category.name || "",
    isActive: category.isActive ?? null,
    productCount: category.productCount || 0,

    products:
      category.products?.map((product: any) => ({
        _id: product._id.toString(),
        prod_id: product.prod_id || "",
        name: product.name || "",
        isActive: product.isActive ?? null,
      })) || [],

    createdAt: category.createdAt ? category.createdAt.toISOString() : null,
    updatedAt: category.updatedAt ? category.updatedAt.toISOString() : null,
  }));

  return {
    categories: serializedCategories,
    total: totalCount,
  };
};
