// models/productModel.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { ICategory } from "./categoryModel";

export interface IProduct extends Document {
  prod_id: string;
  barcode_id: string;
  name: string;
  quantity: number; // virtual (computed)
  isActive: boolean;
  cat_id: Types.ObjectId | ICategory;
  tva: number;
}

const productSchema: Schema = new Schema<IProduct>(
  {
    prod_id: { type: String, required: true, unique: true },
    barcode_id: { type: String, unique: true },
    name: { type: String, maxlength: 110, required: true },
    isActive: { type: Boolean, default: true },
    cat_id: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    tva: { type: Number, default: 0 },
  },
  { 
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true } 
  }
);

productSchema.virtual("lots", {
  ref: "Lot",
  localField: "_id",
  foreignField: "prod_id",
});

productSchema.virtual("quantity").get(function (this: any) {
  if (!this.lots) return 0;
  return this.lots.reduce((sum: number, lot: any) => sum + lot.quantity, 0);
});

export const Product =
  mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);
