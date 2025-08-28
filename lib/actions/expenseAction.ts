"use server";

import {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} from "../factories/crudFactory";
import { Expense } from "../models/expenseModel";
import connectDB from "../mongoConnect";

export const createExpense = async (data: {
  id: string;
  name: string;
  price: number;
  user: string;
}) => {
  await connectDB();

  const newExpense = await Expense.create({
    id: data.id,
    name: data.name,
    price: data.price,
    user: data.user,
  });

  const populated = await newExpense.populate("user");
  const plain = populated.toObject();
  const plainDoc = {
    ...plain,
    _id: plain._id.toString(),
    user: {
      ...plain.user,
      _id: plain.user._id.toString(),
    },
    by: plain.user.name,
  };

  return { success: true, data: plainDoc };
};
export const getExpense = async () => {
  await connectDB();

  const expenses = await Expense.find()
    .populate({
      path: "user",
      select: "name",
    })
    .lean();

  const cleaned = expenses.map((e) => ({
    ...e,
    _id: e._id.toString(),
    user: {
      ...e.user,
      _id: e.user._id.toString(),
    },
    isActive: true,
  }));

  return cleaned;
};
export const getExpenseById = getOne(Expense);
export const updateExpense = async (id: string, data: any) => {
  await connectDB();

  const updatedExpense = await Expense.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  })
    .populate("user")
    .lean();

  if (!updatedExpense) throw new Error("Expense not found");

  const result = JSON.parse(JSON.stringify(updatedExpense));

  return { success: true, data: result };
};

export const deleteExpense = deleteOne(Expense);
