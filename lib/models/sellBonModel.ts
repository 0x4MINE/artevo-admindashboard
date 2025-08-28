import mongoose, { Schema, Document, Types } from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

export interface ISellBon extends Document {
  _id: Types.ObjectId;
  sellBonId: number;
  date: Date;
  userId: Types.ObjectId;
  clientId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  sellDetails?: ISellBDetails[];
}

export interface ISellBDetails extends Document {
  _id: Types.ObjectId;
  sellBonId: Types.ObjectId;
  name: string;
  price: number;
  tva: number;
  quantity: number;
  type: "product" | "service" | "discount" | "tax" | "other";
  createdAt: Date;
  updatedAt: Date;
  sellBon?: ISellBon;
}

const SellBonSchema = new Schema<ISellBon>(
  {
    sellBonId: { type: Number, unique: true, index: true },
    date: { type: Date, default: Date.now, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

SellBonSchema.plugin(AutoIncrement, { inc_field: "sellBonId", start_seq: 1 });

SellBonSchema.virtual("sellDetails", {
  ref: "SellBDetails",
  localField: "_id",
  foreignField: "sellBonId",
});
SellBonSchema.pre("findOneAndDelete", async function (next) {
  const doc: any = await this.model.findOne(this.getQuery());
  if (doc?._id) {
    await mongoose.model("SellBDetails").deleteMany({ sellBonId: doc._id });
  }
  next();
});

const SellBDetailsSchema = new Schema<ISellBDetails>(
  {
    sellBonId: {
      type: Schema.Types.ObjectId,
      ref: "SellBon",
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 255 },
    quantity: {
      type: Number,

      min: 1,
      default: 1,
    },
    tva: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    price: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      required: true,
      enum: ["product", "service", "discount", "tax", "other"],
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

SellBDetailsSchema.virtual("sellBon", {
  ref: "SellBon",
  localField: "sellBonId",
  foreignField: "_id",
  justOne: true,
});

export const SellBon =
  mongoose.models.SellBon || mongoose.model<ISellBon>("SellBon", SellBonSchema);

export const SellBDetails =
  mongoose.models.SellBDetails ||
  mongoose.model<ISellBDetails>("SellBDetails", SellBDetailsSchema);
