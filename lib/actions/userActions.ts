"use server";

import { User } from "../models/userModel";
import {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} from "../factories/crudFactory";

export const createUser = createOne(User);
export const getUsers = getAll(User);
export const getUserById = getOne(User);
export const updateUser = updateOne(User);
export const deleteUser = deleteOne(User);
