import mongoose, { Schema, Document } from "mongoose";
import { StringDecoder } from "string_decoder";

export interface IClientPaym extends Document {
  clientPay_id: number;
  date: Date;
  amount: number;
  user_id: mongoose.Types.ObjectId;
  client_id: mongoose.Types.ObjectId;
}

const ClientPaymSchema: Schema = new Schema<IClientPaym>(
  {
    clientPay_id: {
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
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
  },
  { timestamps: true }
);

export const ClientPaym =
  mongoose.models.ClientPaym ||
  mongoose.model<IClientPaym>("ClientPaym", ClientPaymSchema);
