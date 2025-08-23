import mongoose, { Schema, Document } from "mongoose";

export interface IInfo extends Document {
  companyName?: string;
  companyDesc?: string;
  address?: string;
  phone?: string;
  fax?: string;
  rc?: string;
  nif?: string;
  nis?: string;
  art?: string;
  rib?: string;
  banque?: string;
  logoUrl?: string;
}

const InfoSchema = new Schema<IInfo>(
  {
    companyName: String,
    companyDesc: String,
    address: String,
    phone: String,
    fax: String,
    rc: String,
    nif: String,
    nis: String,
    art: String,
    rib: String,
    banque: String,
    logoUrl: String,
  },
  { timestamps: true }
);

export const Info =
  mongoose.models.Info || mongoose.model<IInfo>("Info", InfoSchema);
