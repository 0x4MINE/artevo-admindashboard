import mongoose, { models } from "mongoose";

export interface IService extends Document {
  serv_id: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  isActive: boolean;
  tva: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const serviceSchema = new mongoose.Schema<IService>(
  {
    serv_id: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 110,
    },
    buyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tva: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

serviceSchema.index({ name: 1 }); 
serviceSchema.index({ isActive: 1 }); 
export const Service = models.Service || mongoose.model<IService>("Service", serviceSchema);

