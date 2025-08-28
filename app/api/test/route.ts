import { Lot } from "@/lib/models/lotModel";
import { Product } from "@/lib/models/productModel";
import { User } from "@/lib/models/userModel";
import connectDB from "@/lib/mongoConnect";
import { NextResponse } from "next/server";

export async function GET() {
  await connectDB();
  const user = new User({
    id:'U2025-001',
    name:"tester",
    password:"tester123",

  });

  await user.save();

  return NextResponse.json({ user, status: 201 });
}
