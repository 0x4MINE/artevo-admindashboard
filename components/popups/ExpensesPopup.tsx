"use client";

import { useEffect, useMemo, useState } from "react";
import AddTextInput from "../forms/AddTextInput";
import { generate7DigitId, generateCustomId } from "@/lib/utils";
import AddButton from "../AddButton";
import { toast } from "sonner";
import { createExpense, updateExpense } from "@/lib/actions/expenseAction";
import { useUserStore } from "@/lib/store/useUser";
import type { Expense, ExpenseFormData } from "@/types/expense";

interface ExpensesPopupProps {
  setPopUp: (value: boolean) => void;
  setData: React.Dispatch<React.SetStateAction<Expense[]>>;
  editUser: Expense | null;
  setEdit: (value: Expense | null) => void;
}

function ExpensesPopup({
  setPopUp,
  setData,
  editUser,
  setEdit,
}: ExpensesPopupProps) {
  const isEditMode = !!editUser;
  const [form, setForm] = useState<ExpenseFormData>({
    id: "",
    name: "",
    price: "",
    isActive: true,
    createdAt: Date.now(),
  });

  const newExpenseId = useMemo(() => generateCustomId("E"), []);
  const { user: currentUser } = useUserStore();

  useEffect(() => {
    if (isEditMode && editUser) {
      setForm({
        id: editUser.id,
        name: editUser.name,
        price:
          typeof editUser.price === "number"
            ? editUser.price.toString()
            : editUser.price,
        createdAt:
          typeof editUser.createdAt === "number"
            ? editUser.createdAt
            : Date.now(),
      });
    } else {
      setForm((prev) => ({ ...prev, id: newExpenseId }));
    }
  }, [editUser, isEditMode, newExpenseId]);

  const handleSubmit = async () => {
    try {
      setPopUp(false);

      // Validate price
      const priceAsNumber = parseFloat(form.price);
      if (isNaN(priceAsNumber)) {
        toast.error("Please enter a valid price");
        return;
      }

      const expenseData = {
        ...form,
        price: priceAsNumber,
        user: currentUser?.id,
      };

      // Ensure we have the required data for edit mode
      if (isEditMode && (!editUser || !editUser._id)) {
        toast.error("Invalid expense data for editing");
        return;
      }

      const action = isEditMode
        ? updateExpense(editUser!._id, expenseData)
        : createExpense(expenseData);

      toast.promise(action, {
        loading: isEditMode ? "Updating expense..." : "Creating expense...",
        success: (response) => {
          if (!response?.data) {
            throw new Error("No data returned from server");
          }

          const updatedItem = {
            ...expenseData,
            _id: response.data._id || editUser?._id || "",
            by: currentUser?.name || "Unknown",
          };

          setData((prev) =>
            isEditMode
              ? prev.map((item) =>
                  item._id === editUser?._id ? updatedItem : item
                )
              : [...prev, updatedItem]
          );

          if (isEditMode) setEdit(null);
          return isEditMode
            ? `Expense ${form.id} updated successfully`
            : `Expense ${form.id} created successfully`;
        },
        error: (error: Error) => error.message || "An error occurred",
      });
    } catch (error) {
      toast.error("Failed to process expense");
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-center px-12">
      <h1 className="text-2xl font-bold text-title">
        {isEditMode ? "EDIT EXPENSE" : "ADD EXPENSE"}
      </h1>
      <AddTextInput isDisabled placeholder={form.id} />
      <AddTextInput
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Name"
        required
      />
      <AddTextInput
        value={form.price}
        onChange={(e) => setForm({ ...form, price: e.target.value })}
        placeholder="Price"
        type="number"
        required
      />
      <AddButton onClick={handleSubmit} />
    </div>
  );
}

export default ExpensesPopup;
