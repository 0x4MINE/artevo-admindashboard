"use server";

import {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} from "../factories/crudFactory";
import { Service } from "../models/serviceModel";

export const createService = createOne(Service);
export const getService = getAll(Service);
export const getServiceById = getOne(Service);
export const updateService = updateOne(Service);
export const deleteService = deleteOne(Service);
