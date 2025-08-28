import mongoose, { Schema, Document, Types } from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

// ----------------- Interfaces -----------------
export interface IBuyFact extends Document {
  _id: Types.ObjectId;
  buyFactId: number;
  date: Date;
  userId: Types.ObjectId;
  suppId: Types.ObjectId;
  reglement: string;
  originalCode?: string;
  type: "purchase" | "return";
  createdAt: Date;
  updatedAt: Date;
  buyDetails?: IBuyDetails[];
}

export interface IBuyDetails extends Document {
  _id: Types.ObjectId;
  buyFactId: Types.ObjectId;
  tva: number;
  name: string;
  quantity: number;
  price: number;
  type: "product" | "service" | "discount" | "tax" | "other";
  createdAt: Date;
  updatedAt: Date;
  buyFact?: IBuyFact;
}

// ----------------- BuyFact Schema -----------------
const BuyFactSchema = new Schema<IBuyFact>(
  {
    buyFactId: { type: Number, unique: true, index: true },
    date: { type: Date, default: Date.now, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    suppId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    reglement: { type: String, required: true, trim: true },
    originalCode: { type: String, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["purchase", "return"],
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Auto-increment numeric ID
BuyFactSchema.plugin(AutoIncrement, { inc_field: "buyFactId", start_seq: 1 });

// Virtual relation with details
BuyFactSchema.virtual("buyDetails", {
  ref: "BuyDetails",
  localField: "_id",
  foreignField: "buyFactId",
});

// Cascade delete details
BuyFactSchema.pre("findOneAndDelete", async function (next) {
  const doc: any = await this.model.findOne(this.getQuery());
  if (doc?._id) {
    await mongoose.model("BuyDetails").deleteMany({ buyFactId: doc._id });
  }
  next();
});

// ----------------- BuyDetails Schema -----------------
const BuyDetailsSchema = new Schema<IBuyDetails>(
  {
    buyFactId: {
      type: Schema.Types.ObjectId,
      ref: "BuyFact",
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 255 },
    quantity: { type: Number, min: 1, default: 1 },
    price: { type: Number, required: true, min: 0 },
    tva: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    type: {
      type: String,
      required: true,
      enum: ["product", "service", "discount", "tax", "other"],
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual back reference
BuyDetailsSchema.virtual("buyFact", {
  ref: "BuyFact",
  localField: "buyFactId",
  foreignField: "_id",
  justOne: true,
});

// ----------------- Export Models -----------------
export const BuyFact =
  mongoose.models.BuyFact || mongoose.model<IBuyFact>("BuyFact", BuyFactSchema);

export const BuyDetails =
  mongoose.models.BuyDetails ||
  mongoose.model<IBuyDetails>("BuyDetails", BuyDetailsSchema);
