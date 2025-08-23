"use server";

import { IInfo, Info } from "../models/infoModel";
import connectDB from "../mongoConnect";



export async function getInfo() {
  await connectDB();
  const info = await Info.findOne().lean(); 
  if (!info) return null;

  return {
    ...info,
    _id: info._id.toString(),
    createdAt: info.createdAt?.toISOString(),
    updatedAt: info.updatedAt?.toISOString(),
  };
}

export async function saveInfo(data: any) {
  try {
    await connectDB();

    const info = await Info.findOneAndUpdate({}, data, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }).lean();

    return {
      success: true,
      data: {
        ...info,
        _id: info._id.toString(),
        createdAt: info.createdAt?.toISOString(),
        updatedAt: info.updatedAt?.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error saving info:", error);
    return { success: false, error: "Failed to save info" };
  }
}
