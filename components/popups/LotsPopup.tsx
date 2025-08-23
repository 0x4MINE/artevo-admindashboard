"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createLot, updateLot } from "@/lib/actions/lotActions";
import { getSuppliers } from "@/lib/actions/supplierActions";
import AddTextInput from "@/components/forms/AddTextInput";
import SelectInput from "@/components/forms/SelectInput";
import AddButton from "@/components/AddButton";
import { generate3DigitId, generateCustomId } from "@/lib/utils";
import { Switch } from "../ui/switch";

type LotForm = {
  lot_id: string;
  buyPrice: number;
  sellPrice: number;
  supp_id: string;
  prod_id: string;
  date: string;
  quantity: number;
  isActive: boolean;
  _id?: string;
};

type LotPopupProps = {
  setData: React.Dispatch<React.SetStateAction<any[]>>;
  setPopUp: React.Dispatch<React.SetStateAction<boolean>>;
  editLot?: any;
  setEditLot: React.Dispatch<React.SetStateAction<any>>;
  productId: string;
};

// Helper function to format date for input field
const formatDateForInput = (dateValue: any): string => {
  console.log(
    "formatDateForInput called with:",
    dateValue,
    "type:",
    typeof dateValue
  );

  if (!dateValue) {
    console.log("No date value provided, using today");
    return new Date().toISOString().split("T")[0];
  }

  try {
    const date = new Date(dateValue);
    console.log("Created Date object:", date);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date provided:", dateValue);
      return new Date().toISOString().split("T")[0];
    }

    // Format as YYYY-MM-DD for input field
    const formatted = date.toISOString().split("T")[0];
    console.log("Final formatted date:", formatted);
    return formatted;
  } catch (error) {
    console.error("Error formatting date:", error);
    return new Date().toISOString().split("T")[0];
  }
};

export default function LotPopup({
  setData,
  setPopUp,
  editLot,
  setEditLot,
  productId,
}: LotPopupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [form, setForm] = useState<LotForm>({
    lot_id: "",
    buyPrice: 0,
    sellPrice: 0,
    quantity: 0,
    supp_id: "",
    prod_id: "",
    date: new Date().toISOString().split("T")[0],
    isActive: true,
  });
  const [errors, setErrors] = useState<Partial<LotForm>>({});

  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const res = await getSuppliers();
        setSuppliers(res || []);
      } catch (error) {
        toast.error("Failed to fetch suppliers");
        console.error(error);
      }
    }
    fetchSuppliers();
  }, []);

  useEffect(() => {
    console.log("useEffect triggered - editLot:", editLot);
    console.log("editLot exists:", !!editLot);

    if (editLot && editLot._id) {
      // More specific check
      console.log("Processing editLot...");
      console.log("editLot full object:", JSON.stringify(editLot, null, 2));
      console.log("editLot.date raw value:", editLot.date);
      console.log("editLot.date type:", typeof editLot.date);

      const formattedDate = formatDateForInput(editLot.date);
      console.log("formatted date result:", formattedDate);

      const newForm = {
        lot_id: editLot.lot_id ,
        buyPrice: editLot.buyPrice || 0,
        quantity: editLot.quantity || 0,
        sellPrice: editLot.sellPrice || 0,
        supp_id: editLot.supp_id?._id || editLot.supp_id || "",
        prod_id: editLot.prod_id || "",
        date: formattedDate,
        isActive: editLot.isActive ?? true,
        _id: editLot._id,
      };

      console.log("Setting form with:", newForm);
      setForm(newForm);
    } else {
      console.log("Creating new lot form");
      const newForm = {
        lot_id: generateCustomId("L"),
        buyPrice: 0,
        sellPrice: 0,
        quantity: 0,
        supp_id: "",
        prod_id: productId,
        date: new Date().toISOString().split("T")[0],
        isActive: true,
      };
      console.log("New lot form:", newForm);
      setForm(newForm);
    }
  }, [editLot, productId]);

  const handleChange = (
    field: keyof LotForm,
    value: string | number | boolean
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const requiredFields: Array<keyof LotForm> = [
      "lot_id",
      "buyPrice",
      "sellPrice",
      "supp_id",
      "date",
    ];
    let isValid = true;
    const newErrors: Partial<LotForm> = {};

    requiredFields.forEach((field) => {
      if (!form[field]) {
        newErrors[field] = `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } is required`;
        isValid = false;
      }
    });

    // Additional validation for numeric fields
    if (form.buyPrice < 0) {
      newErrors.buyPrice = "Buy price cannot be negative";
      isValid = false;
    }

    if (form.sellPrice < 0) {
      newErrors.sellPrice = "Sell price cannot be negative";
      isValid = false;
    }

    if (form.quantity < 0) {
      newErrors.quantity = "Quantity cannot be negative";
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
      const result = editLot
        ? await updateLot(editLot._id, form)
        : await createLot(form);

      if (!result?.success) {
        throw new Error(result?.error || "Operation failed");
      }

      toast.success(`Lot ${editLot ? "updated" : "created"} successfully`);

      setData((prev) => {
        if (editLot) {
          return prev.map((item) =>
            item._id === editLot._id ? { ...item, ...result.data } : item
          );
        }
        return [result.data, ...prev];
      });

      setPopUp(false);
      setEditLot(null);
    } catch (error) {
      console.error("Error saving lot:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupplierSelect = (selectedName: string) => {
    const selected = suppliers.find((s) => s.name === selectedName);
    handleChange("supp_id", selected ? selected._id : "");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 text-center max-h-[80vh] w-xl overflow-y-auto px-12"
    >
      <h1 className="text-2xl font-bold text-title">
        {editLot ? "EDIT LOT" : "ADD LOT"}
      </h1>

      {/* Debug info - remove this in production */}
      <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
        <h1>DEBUGGING TAB</h1>
        <div>Edit Mode: {editLot ? "Yes" : "No"}</div>
        <div>Form Date: {form.date}</div>
        <div>EditLot Date: {editLot?.date || "N/A"}</div>
        <div>EditLot ID: {editLot?._id || "N/A"}</div>
      </div>

      <AddTextInput isDisabled placeholder={form.lot_id} />

      <AddTextInput
        name="buyPrice"
        type="number"
        value={form.buyPrice || ""}
        onChange={(e) => handleChange("buyPrice", Number(e.target.value))}
        placeholder="Buy Price"
        error={errors.buyPrice}
        required
      />

      <AddTextInput
        name="sellPrice"
        type="number"
        value={form.sellPrice || ""}
        onChange={(e) => handleChange("sellPrice", Number(e.target.value))}
        placeholder="Sell Price"
        error={errors.sellPrice}
        required
      />

      <AddTextInput
        name="quantity"
        type="number"
        value={form.quantity || 0}
        onChange={(e) => handleChange("quantity", Number(e.target.value))}
        placeholder="Quantity"
        error={errors.quantity}
      />

      {/* Supplier Select */}
      <SelectInput
        placeholder="Supplier"
        options={suppliers.map((s) => s.name)}
        defaultValue={suppliers.find((s) => s._id === form.supp_id)?.name || ""}
        onSelect={handleSupplierSelect}
        error={errors.supp_id}
      />

      <AddTextInput
        name="date"
        type="date"
        value={form.date}
        onChange={(e) => handleChange("date", e.target.value)}
        placeholder="Date"
        error={errors.date}
      />

      <div className="flex flex-col items-center py-2">
        <label className="block font-medium mb-2">Status</label>
        <div className="flex items-center">
          <span className={`mr-2 ${!form.isActive ? "font-semibold" : ""}`}>
            Inactive
          </span>
          <Switch
            checked={form.isActive}
            onCheckedChange={(checked) => handleChange("isActive", checked)}
            className="scale-110 mx-2"
          />
          <span className={`ml-2 ${form.isActive ? "font-semibold" : ""}`}>
            Active
          </span>
        </div>
      </div>

      <AddButton
        type="submit"
        disabled={isLoading || !form.lot_id}
        className="mt-4"
        text={
          isLoading ? "Processing..." : editLot ? "Update Lot" : "Create Lot"
        }
      />
    </form>
  );
}
