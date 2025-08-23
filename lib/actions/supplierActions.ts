"use server";

import { Supplier } from "../models/supplierModel";
import {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} from "../factories/crudFactory";

export const createSupplier = createOne(Supplier);
export const getSuppliers = getAll(Supplier);
export const getSupplierById = getOne(Supplier);
export const updateSupplier = updateOne(Supplier);
export const deleteSupplier = deleteOne(Supplier);
