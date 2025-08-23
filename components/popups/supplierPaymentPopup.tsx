"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import AddTextInput from "@/components/forms/AddTextInput";
import AddButton from "@/components/AddButton";
import {
  createSupplierPaym,
  updateSupplierPaym,
} from "@/lib/actions/supplierPaymActions";
import { generateCustomId } from "@/lib/utils";
import { useUserStore } from "@/lib/store/useUser";
import clsx from "clsx";
import SelectSupplier from "../select/selectSupplier";

type PaymentForm = {
  supplierPay_id: string;
  date: string;
  amount: number;
  user_id: string;
  by: string;
  supplier_id: string;
  supplier_name?: string;
  _id?: string;
};

type PaymentPopupProps = {
  setData: React.Dispatch<React.SetStateAction<any[]>>;
  setPopUp: React.Dispatch<React.SetStateAction<boolean>>;
  editPayment?: any;
  setEditPayment: React.Dispatch<React.SetStateAction<any>>;
};

export default function SupplierPaymentPopup({
  setData,
  setPopUp,
  editPayment,
  setEditPayment,
}: PaymentPopupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUserStore();
  const [selectSupplierOpen, setSelectSupplierOpen] = useState(false);

  const [form, setForm] = useState<PaymentForm>({
    supplierPay_id: generateCustomId("SPM"),
    date: new Date().toISOString().slice(0, 16),
    amount: 0,
    user_id: user.id,
    supplier_id: "",
    supplier_name: "",
    by: user?.name || "System",
  });

  const [errors, setErrors] = useState<Partial<PaymentForm>>({});

  useEffect(() => {
    if (editPayment && editPayment._id) {
      setForm({
        supplierPay_id: editPayment.supplierPay_id || generateCustomId("SP"),
        date: editPayment.date
          ? new Date(editPayment.date).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        amount: editPayment.amount || 0,
        user_id: editPayment.user_id || "",
        supplier_id: editPayment.supplier_id || "",
        supplier_name: editPayment.supplier_name || "",
        _id: editPayment._id,
        by: editPayment.by || user?.name || "System",
      });
    }
  }, [editPayment, user]);

  const handleChange = (field: keyof PaymentForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: Partial<PaymentForm> = {};

    if (!form.amount || form.amount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
      isValid = false;
    }
    if (!form.user_id) {
      newErrors.user_id = "User is required";
      isValid = false;
    }
    if (!form.supplier_id) {
      newErrors.supplier_id = "Supplier is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const paymentData = {
        ...form,
        by: user?.name || "System",
      };

      const result = editPayment
        ? await updateSupplierPaym(editPayment._id, paymentData)
        : await createSupplierPaym(paymentData);

      if (!result?.success) {
        throw new Error(result?.error || "Operation failed");
      }

      toast.success(
        `Supplier Payment ${editPayment ? "updated" : "created"} successfully`
      );

      // ✅ Update local state consistently
      setData((prev) => {
        if (editPayment) {
          return prev.map((item) =>
            item._id === editPayment._id
              ? { ...item, ...paymentData, ...result.data }
              : item
          );
        }
        return [paymentData, ...prev];
      });

      setPopUp(false);
      setEditPayment(null);
    } catch (error) {
      console.error("Error saving supplier payment:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 text-center max-h-[80vh] w-xl overflow-y-auto px-12"
      >
        <h1 className="text-2xl font-bold text-title">
          {editPayment ? "EDIT SUPPLIER PAYMENT" : "ADD SUPPLIER PAYMENT"}
        </h1>

        {/* Payment ID (disabled) */}
        <AddTextInput isDisabled placeholder={form.supplierPay_id} />

        {/* Date */}
        {/* <AddTextInput
          placeholder=""
          type="datetime-local"
          name="date"
          value={form.date}
          onChange={(e) => handleChange("date", e.target.value)}
          required
        /> */}

        {/* Amount */}
        <AddTextInput
          name="amount"
          type="number"
          value={form.amount.toString()}
          onChange={(e) => handleChange("amount", parseFloat(e.target.value))}
          placeholder="Amount"
          error={errors.amount}
          required
          controlled
        />

        {/* ✅ Supplier Picker */}
        <div className="flex flex-col gap-1">
          {errors.supplier_id && (
            <p className="text-red-500 text-sm" role="alert">
              {errors.supplier_id}
            </p>
          )}

          <button
            type="button"
            onClick={() => setSelectSupplierOpen(true)}
            className={clsx(
              "bg-secondary text-title p-4 rounded-2xl text-center placeholder:text-center w-full",
              "border border-transparent transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              errors.supplier_id && "border-red-500 focus:ring-red-500",
              !form.supplier_name && "text-gray-400" // placeholder style
            )}
          >
            {form.supplier_name || "Select a Supplier"}
          </button>
        </div>

        {/* Submit */}
        <AddButton
          type="submit"
          disabled={
            isLoading || !form.amount || !form.user_id || !form.supplier_id
          }
          className="mt-4"
          text={
            isLoading
              ? "Processing..."
              : editPayment
              ? "Update Payment"
              : "Create Payment"
          }
        />
      </form>

      {/* ✅ Supplier Popup */}
      <SelectSupplier
        isOpen={selectSupplierOpen}
        onClose={() => setSelectSupplierOpen(false)}
        onSelect={(supplier) => {
          handleChange("supplier_id", supplier._id);
          handleChange("supplier_name", supplier.name);
        }}
      />
    </>
  );
}
