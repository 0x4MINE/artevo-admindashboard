// models/productModel.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { ICategory } from "./categoryModel";
import { number } from "zod";

export interface IProduct extends Document {
  prod_id: string;
  barcode_id: string;
  name: string;
  quantity: number;
  isActive: boolean;
  cat_id: Types.ObjectId | ICategory;
  tva: number;
}

const productSchema: Schema = new Schema<IProduct>({
  prod_id: {
    type: String,
    required: true,
    unique: true,
  },
  barcode_id: {
    type: String,
    unique: true,
  },
  quantity: {
    type: Number,
    default: 0,
  },
  name: {
    type: String,
    maxlength: 110,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  cat_id: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  tva: {
    type: Number,
    required: false,
    default: 0,
  },
});

export const Product =
  mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);
