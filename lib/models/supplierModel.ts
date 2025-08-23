import mongoose, { Schema, model, models } from "mongoose";

interface ISupplier {
  supp_id: string;
  name: string;
  phone?: string;
  email?: string;
  description?: string;
  type?: string;
  isActive: boolean;
  RC?: string;
  NIF?: string;
  NIS?: string;
  ART?: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    supp_id: { 
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 30
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 40,
      
    },
    description: {
      type: String,
      trim: true,
      maxlength: 150
    },
    type: {
      type: String,
      trim: true,
      maxlength: 80
    },
    isActive: {
      type: Boolean,
      default: true
    },
    RC: {
      type: String,
      trim: true,
      maxlength: 50
    },
    NIF: {
      type: String,
      trim: true,
      maxlength: 50
    },
    NIS: {
      type: String,
      trim: true,
      maxlength: 50
    },
    ART: {
      type: String,
      trim: true,
      maxlength: 50
    },
    address: {
      type: String,
      trim: true,
      maxlength: 100
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for better query performance
supplierSchema.index({ name: 1 });
supplierSchema.index({ supp_id: 1 }, { unique: true });
supplierSchema.index({ isActive: 1 });

export const Supplier = models.Supplier || model<ISupplier>("Supplier", supplierSchema);