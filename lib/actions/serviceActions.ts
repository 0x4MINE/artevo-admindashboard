"use server";

import FilterState from "@/types/FilterState";
import {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} from "../factories/crudFactory";
import { Service } from "../models/serviceModel";
import connectDB from "../mongoConnect";

export const createService = createOne(Service);
export const getService = getAll(Service);
export const getServiceById = getOne(Service);
export const updateService = updateOne(Service);
export const deleteService = deleteOne(Service);

export const getPaginatedServices = async (
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

  // --- Buy price range ---
  if (filters.buyAmountRange) {
    match.buyPrice = {
      $gte: filters.buyAmountRange[0],
      $lte: filters.buyAmountRange[1],
    };
  }

  // --- Sell price range ---
  if (filters.sellAmountRange) {
    match.sellPrice = {
      $gte: filters.sellAmountRange[0],
      $lte: filters.sellAmountRange[1],
    };
  }

  // --- Aggregation pipeline ---
  const pipeline: any[] = [
    { $match: match },
  ];

  // --- Search term ---
  if (searchTerm) {
    pipeline.push({
      $match: {
        $or: [
          { serv_id: { $regex: searchTerm, $options: "i" } },
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
  const [services, total] = await Promise.all([
    Service.aggregate(pipeline),
    Service.aggregate([...pipeline.slice(0, -3), { $count: "count" }]),
  ]);

  const totalCount = total[0]?.count || 0;

  // --- Serialize safely ---
  const serializedServices = services.map((service: any) => ({
    _id: service._id.toString(),
    serv_id: service.serv_id || "",
    name: service.name || "",
    buyPrice: service.buyPrice ?? null,
    sellPrice: service.sellPrice ?? null,
    isActive: service.isActive ?? null,
    tva: service.tva ?? null,

    createdAt: service.createdAt ? service.createdAt.toISOString() : null,
    updatedAt: service.updatedAt ? service.updatedAt.toISOString() : null,
  }));

  return {
    services: serializedServices,
    total: totalCount,
  };
};