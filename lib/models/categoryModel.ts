import mongoose, { model, models } from "mongoose";

export interface ICategory extends Document {
  id: string;
  name: string;
  isActive: boolean;
}

const categorySchema = new mongoose.Schema<ICategory>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Category =
  models.Category || model<ICategory>("Category", categorySchema);
