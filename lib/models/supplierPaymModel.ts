import mongoose, { Schema, Document } from "mongoose";

export interface ISupplierPaym extends Document {
  supplierPay_id: number;
  date: Date;
  amount: number;
  user_id: mongoose.Types.ObjectId;
  supplier_id: mongoose.Types.ObjectId;
}

const SupplierPaymSchema: Schema = new Schema<ISupplierPaym>(
  {
    supplierPay_id: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
  },
  { timestamps: true }
);

export const SupplierPaym =
  mongoose.models.SupplierPaym ||
  mongoose.model<ISupplierPaym>("SupplierPaym", SupplierPaymSchema);
