"use server";
import mongoose from "mongoose";
import { createOne, deleteOne, getAll } from "../factories/crudFactory";
import { Proforma } from "../models/sellProformaModel";
import connectDB from "../mongoConnect";

export const getProformas = async () => {
  try {
    await connectDB();

    const proformas = await Proforma.find()
      .populate("clientId", "name email phone")
      .populate("userId", "name email")
      .populate("sellDetails")
      .sort({ createdAt: -1 })
      .lean();

    return proformas.map((p: any) => ({
      _id: p._id.toString(),
      sell_id: p.proformaId,
      date: p.date?.toISOString(),
      client_name: p.clientId?.name ?? "N/A",
      amount:
        p.sellDetails?.reduce((sum: number, s: any) => sum + s.price, 0) ?? 0,
      by: p.userId?.name ?? "System",
      isActive: true,
    }));
  } catch (error) {
    console.error("❌ Error fetching proformas:", error);
    return [];
  }
};

export const createProforma = createOne(Proforma);
export const deleteProforma = deleteOne(Proforma);
export async function getNextProformaNumber() {
  const Counter = mongoose.connection.collection("counters");
  const counter = await Counter.findOne({ id: "proformaId" });

  const nextSeq = counter ? counter.seq + 1 : 1;

  const year = new Date().getFullYear();
  const formatted = `${String(nextSeq).padStart(5, "0")}/${year}`;
  return formatted;
}
