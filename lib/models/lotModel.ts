import { Types } from "mongoose";
import mongoose, { Schema, model, models } from "mongoose";

export interface ILot {
  lot_id: string;
  buyPrice: number;
  date: Date;
  sellPrice: number;
  supp_id: Types.ObjectId;
  prod_id: Types.ObjectId;
  quantity: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const lotSchema = new Schema<ILot>(
  {
    lot_id: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    buyPrice: {
      type: Number,
      required: true,
    },
    sellPrice: {
      type: Number,
      required: true,
    },
    supp_id: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    prod_id: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Lot = models.Lot || model<ILot>("Lot", lotSchema);
