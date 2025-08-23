import { Lot } from "@/lib/models/lotModel";
import { Product } from "@/lib/models/productModel";
import connectDB from "@/lib/mongoConnect";
import { NextResponse } from "next/server";

export async function GET() {
  await connectDB();
  const user = new Lot({
    lot_id: "041",
    buyPrice: 220,
    sellPrice: 280,
    supp_id: "689b2867f807e1006730c744",
    prod_id: "6899dd9b602214f0e7b4c475",
  });

  await user.save();

  return NextResponse.json({ user, status: 201 });
}
