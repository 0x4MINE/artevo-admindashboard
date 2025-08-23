"use server";

import {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} from "../factories/crudFactory";
import { Category } from "../models/categoryModel";

export const createCategory = createOne(Category);
export const getCategory = getAll(Category);
export const getCategoryById = getOne(Category);
export const updateCategory = updateOne(Category);
export const deleteCategory = deleteOne(Category);
