"use server";

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

  const data = await Product.find().populate("cat_id", "name").lean();

  return data.map((product) => ({
    ...product,
    _id: product._id.toString(),
    cat_id: product.cat_id?._id?.toString() || null,
    categoryName: product.cat_id?.name || "-",
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
