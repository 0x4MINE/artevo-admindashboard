// This is a simplified version of your database schema converted to Mongoose models
// Some relationships and advanced indexing can be added later

import mongoose from 'mongoose';
const { Schema } = mongoose;

// ===== Users =====
const userSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
});

// ===== Clients =====
const clientSchema = new Schema({
  name: String,
  regDate: Date,
  phone: String,
  email: String,
  social: String,
  isActive: Boolean,
  type: Number,
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
});

// ===== Suppliers =====
const supplierSchema = new Schema({
  name: String,
  regDate: Date,
  phone: String,
  email: String,
  desc: String,
  rc: String,
  nif: String,
  nis: String,
  art: String,
  address: String,
  type: String,
  isActive: Boolean,
});

// ===== Products =====
const productSchema = new Schema({
  name: String,
  catId: { type: Schema.Types.ObjectId, ref: 'Category' },
  tva: Number,
  isActive: Boolean,
});

// ===== Lots =====
const lotSchema = new Schema({
  date: Date,
  buyPrice: Number,
  sellPrice: Number,
  quantity: Number,
  suppId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  prodId: { type: Schema.Types.ObjectId, ref: 'Product' },
  isActive: Boolean,
});

// ===== Categories =====
const categorySchema = new Schema({
  name: String,
});

// ===== Expenses =====
const expenseSchema = new Schema({
  name: String,
  price: Number,
  date: Date,
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
});

// ===== SellFact =====
const sellFactSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  date: Date,
});

// ===== SellFDetails =====
const sellFDetailSchema = new Schema({
  sellFId: { type: Schema.Types.ObjectId, ref: 'SellFact' },
  name: String,
  price: Number,
  type: String, // product/service
});

// ===== SellBon / SellBDetails (Quote system) =====
const sellBonSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  date: Date,
});

const sellBDetailSchema = new Schema({
  sellBId: { type: Schema.Types.ObjectId, ref: 'SellBon' },
  name: String,
  price: Number,
  type: String,
});

// ===== BuyFact =====
const buyFactSchema = new Schema({
  suppId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  date: Date,
  reglement: String,
  type: String,
});

// ===== BuyDetails =====
const buyDetailSchema = new Schema({
  buyFId: { type: Schema.Types.ObjectId, ref: 'BuyFact' },
  text: String,
  price: Number,
  quantity: Number,
  originalCode: String,
});

// ===== Payments =====
const clientPaymSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  date: Date,
  amount: Number,
});

const suppPaymSchema = new Schema({
  suppId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  date: Date,
  amount: Number,
});

// ===== Bonus =====
const bonusSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  doneDate: Date,
  totalBonus: Number,
  percent: Number,
});

// ===== History =====
const historySchema = new Schema({
  operation: String,
  relation: String,
});

// ===== TrackBills =====
const trackBillSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  date: Date,
  format: String,
  type: String,
});

// ===== Export Models =====
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);
export const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);
export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export const Lot = mongoose.models.Lot || mongoose.model('Lot', lotSchema);
export const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
export const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
export const SellFact = mongoose.models.SellFact || mongoose.model('SellFact', sellFactSchema);
export const SellFDetail = mongoose.models.SellFDetail || mongoose.model('SellFDetail', sellFDetailSchema);
export const SellBon = mongoose.models.SellBon || mongoose.model('SellBon', sellBonSchema);
export const SellBDetail = mongoose.models.SellBDetail || mongoose.model('SellBDetail', sellBDetailSchema);
export const BuyFact = mongoose.models.BuyFact || mongoose.model('BuyFact', buyFactSchema);
export const BuyDetail = mongoose.models.BuyDetail || mongoose.model('BuyDetail', buyDetailSchema);
export const ClientPaym = mongoose.models.ClientPaym || mongoose.model('ClientPaym', clientPaymSchema);
export const SuppPaym = mongoose.models.SuppPaym || mongoose.model('SuppPaym', suppPaymSchema);
export const Bonus = mongoose.models.Bonus || mongoose.model('Bonus', bonusSchema);
export const History = mongoose.models.History || mongoose.model('History', historySchema);
export const TrackBill = mongoose.models.TrackBill || mongoose.model('TrackBill', trackBillSchema);
