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

export const createSupplier = createOne(Supplier);
export const getSuppliers = getAll(Supplier);
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

    return JSON.parse(JSON.stringify(supplier));
  } catch (error) {
    console.error("Error in getSupplierById:", error);
    return null;
  }
}
export const updateSupplier = updateOne(Supplier);
export const deleteSupplier = deleteOne(Supplier);
