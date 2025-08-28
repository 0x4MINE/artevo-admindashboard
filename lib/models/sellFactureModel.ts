import mongoose, { Schema, Document, Types } from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

// ----------------- Interfaces -----------------
export interface ISellFact extends Document {
  _id: Types.ObjectId;
  sellFactId: number;
  date: Date;
  userId: Types.ObjectId;
  clientId: Types.ObjectId;
  reglement: string;
  originalCode?: string;
  type: "sale" | "return";
  createdAt: Date;
  updatedAt: Date;
  sellDetails?: ISellFDetails[];
}

export interface ISellFDetails extends Document {
  _id: Types.ObjectId;
  sellFactId: Types.ObjectId;
  name: string;
  price: number;
  tva: number;
  quantity: number;
  type: "product" | "service" | "discount" | "tax" | "other";
  createdAt: Date;
  updatedAt: Date;
  sellFact?: ISellFact;
}

// ----------------- SellFact Schema -----------------
const SellFactSchema = new Schema<ISellFact>(
  {
    sellFactId: { type: Number, unique: true, index: true },
    date: { type: Date, default: Date.now, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    reglement: { type: String, required: true, trim: true },
    originalCode: { type: String, trim: true }, 
    type: {
      type: String,
      required: true,
      enum: ["sale", "return"],
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

SellFactSchema.plugin(AutoIncrement, { inc_field: "sellFactId", start_seq: 1 });

SellFactSchema.virtual("sellDetails", {
  ref: "SellFDetails",
  localField: "_id",
  foreignField: "sellFactId",
});

SellFactSchema.pre("findOneAndDelete", async function (next) {
  const doc: any = await this.model.findOne(this.getQuery());
  if (doc?._id) {
    await mongoose.model("SellFDetails").deleteMany({ sellFactId: doc._id });
  }
  next();
});

// ----------------- SellDetails Schema -----------------
const SellFDetailsSchema = new Schema<ISellFDetails>(
  {
    sellFactId: {
      type: Schema.Types.ObjectId,
      ref: "SellFact",
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 255 },
    quantity: { type: Number, min: 1, default: 1 },
    price: { type: Number, required: true, min: 0 },
    tva: { type: Number, default: 0, min: 0, max: 100 },
    type: {
      type: String,
      required: true,
      enum: ["product", "service", "discount", "tax", "other"],
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual back reference
SellFDetailsSchema.virtual("sellFact", {
  ref: "SellFact",
  localField: "sellFactId",
  foreignField: "_id",
  justOne: true,
});

// ----------------- Export Models -----------------
export const SellFact =
  mongoose.models.SellFact || mongoose.model<ISellFact>("SellFact", SellFactSchema);

export const SellFDetails =
  mongoose.models.SellFDetails ||
  mongoose.model<ISellFDetails>("SellFDetails", SellFDetailsSchema);
