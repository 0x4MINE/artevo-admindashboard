// models/expenseModel.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IExpense extends Document {
  id: string;
  name: string;
  price: number;
  user: mongoose.Types.ObjectId;
  isActive: boolean;
}

const ExpenseSchema: Schema = new Schema<IExpense>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 110,
    },
    price: {
      type: Number,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Expense =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);
