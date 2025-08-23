import mongoose, { Schema, Document, Types } from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

export interface IProforma extends Document {
  _id: Types.ObjectId;
  proformaId: number;
  date: Date;
  userId: Types.ObjectId;
  clientId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  sellDetails?: ISellPDetails[];
}

export interface ISellPDetails extends Document {
  _id: Types.ObjectId;
  proformaId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  type: "product" | "service" | "discount" | "tax" | "other";
  createdAt: Date;
  updatedAt: Date;
  proforma?: IProforma;
}

const ProformaSchema = new Schema<IProforma>(
  {
    proformaId: { type: Number, unique: true, index: true },
    date: { type: Date, default: Date.now, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

ProformaSchema.plugin(AutoIncrement, { inc_field: "proformaId", start_seq: 1 });

ProformaSchema.virtual("sellDetails", {
  ref: "SellPDetails",
  localField: "_id",
  foreignField: "proformaId",
});
ProformaSchema.pre("findOneAndDelete", async function (next) {
  const doc: any = await this.model.findOne(this.getQuery());
  if (doc?._id) {
    await mongoose.model("SellPDetails").deleteMany({ proformaId: doc._id });
  }
  next();
});

const SellPDetailsSchema = new Schema<ISellPDetails>(
  {
    proformaId: {
      type: Schema.Types.ObjectId,
      ref: "Proforma",
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 255 },
    quantity: {
      type: Number,

      min: 1,
      default: 1,
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

SellPDetailsSchema.virtual("proforma", {
  ref: "Proforma",
  localField: "proformaId",
  foreignField: "_id",
  justOne: true,
});

export const Proforma =
  mongoose.models.Proforma ||
  mongoose.model<IProforma>("Proforma", ProformaSchema);

export const SellPDetails =
  mongoose.models.SellPDetails ||
  mongoose.model<ISellPDetails>("SellPDetails", SellPDetailsSchema);
