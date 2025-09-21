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

export const getExpensesPaginated = async (
  page: number = 1,
  limit: number = 10,
  searchTerm: string = "",
  filters: any = {}
) => {
  await connectDB();

  const skip = (page - 1) * limit;

  const match: any = {};

  // --- Date range ---
  if (filters.dateRange?.[0] || filters.dateRange?.[1]) {
    const dateFilter: any = {};

    if (filters.dateRange[0]) {
      dateFilter.$gte = new Date(filters.dateRange[0]);
    }

    if (filters.dateRange[1]) {
      const end = new Date(filters.dateRange[1]);
      end.setHours(23, 59, 59, 999); 
      dateFilter.$lte = end;
    }

    match.createdAt = dateFilter;
  }

  // --- Amount range ---
  if (filters.amountRange) {
    match.price = {
      $gte: filters.amountRange[0],
      $lte: filters.amountRange[1],
    };
  }

  // --- Status ---
  if (filters.isActive !== null && filters.isActive !== undefined) {
    match.isActive = filters.isActive;
  }

  // --- Aggregation pipeline ---
  const pipeline: any[] = [
    { $match: match },

    // user join
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userData",
      },
    },
    { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
  ];

  // --- Search term ---
  if (searchTerm) {
    pipeline.push({
      $match: {
        $or: [
          { id: { $regex: searchTerm, $options: "i" } },
          { name: { $regex: searchTerm, $options: "i" } },
          { "userData.name": { $regex: searchTerm, $options: "i" } },
        ],
      },
    });
  }

  // --- Count total before pagination ---
  const countPipeline = [...pipeline];
  countPipeline.push({ $count: "count" });

  const totalResult = await Expense.aggregate(countPipeline);
  const totalCount = totalResult[0]?.count || 0;

  // --- Add pagination to main pipeline ---
  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit }
  );

  // --- Get paginated results ---
  const expenses = await Expense.aggregate(pipeline);

  // --- Serialize safely ---
  const serializedExpenses = expenses.map((expense: any) => ({
    _id: expense._id.toString(),
    expense_id: expense.id,
    name: expense.name,
    price: expense.price,
    description: expense.description || "",
    isActive: expense.isActive !== undefined ? expense.isActive : true,
    userId: expense.user?.toString() || null,

    // user info
    user: expense.userData
      ? {
          _id: expense.userData._id?.toString(),
          name: expense.userData.name || "",
          email: expense.userData.email || "",
        }
      : null,
    by: expense.userData?.name || "Unknown",

    createdAt: expense.createdAt
      ? new Date(expense.createdAt).toISOString()
      : null,
    updatedAt: expense.updatedAt
      ? new Date(expense.updatedAt).toISOString()
      : null,
  }));

  return {
    expenses: serializedExpenses,
    total: totalCount,
  };
};
