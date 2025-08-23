import mongoose, { Schema, model, models } from "mongoose";
import { ClientPaym } from "./clientPayModel";

export interface IClient {
  client_id: string;
  name: string;
  phone?: string;
  email?: string;
  social?: Array<{ platform: string; account: string }>;
  isActive: boolean;
  rc?: string;
  nif?: string;
  nis?: string;
  art?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const clientSchema = new Schema<IClient>(
  {
    client_id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 40,
    },
    social: [
      {
        platform: {
          type: String,
          required: true,
          trim: true,
        },
        account: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    rc: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    nif: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    nis: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    art: {
      type: String,
      trim: true,
      maxlength: 50,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

clientSchema.index({ name: 1 });
clientSchema.index({ client_id: 1 }, { unique: true });

export const Client = models.Client || model<IClient>("Client", clientSchema);
