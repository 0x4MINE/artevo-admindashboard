"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createProduct, updateProduct } from "@/lib/actions/productsActions";
import { getCategory } from "@/lib/actions/categoryActions";
import AddTextInput from "@/components/forms/AddTextInput";
import SelectInput from "@/components/forms/SelectInput";
import AddButton from "@/components/AddButton";
import { Switch } from "../ui/switch";
import { generate3DigitId, generate7DigitId, generateCustomId } from "@/lib/utils";

type ProductForm = {
  prod_id: string;
  barcode_id: string;
  name: string;
  cat_id: string;
  categoryName?: string;
  tva: number;
  isActive: boolean;
  _id?: string;
};

type ProductPopupProps = {
  setData: React.Dispatch<React.SetStateAction<any[]>>;
  setPopUp: React.Dispatch<React.SetStateAction<boolean>>;
  editProduct?: any;
  setEditProduct: React.Dispatch<React.SetStateAction<any>>;
};

export default function ProductPopup({
  setData,
  setPopUp,
  editProduct,
  setEditProduct,
}: ProductPopupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [form, setForm] = useState<ProductForm>({
    prod_id: generate3DigitId(),
    barcode_id: generate7DigitId(),
    name: "",
    cat_id: "",
    tva: 0,
    isActive: true,
  });
  const [errors, setErrors] = useState<Partial<ProductForm>>({});

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await getCategory();
        setCategories(res || []);
      } catch (error) {
        toast.error("Failed to fetch categories");
        console.error(error);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editProduct && editProduct._id) {
      console.log("Processing editProduct...");
      console.log("editProduct full object:", JSON.stringify(editProduct, null, 2));

      const newForm = {
        prod_id: editProduct.prod_id || generate3DigitId(),
        barcode_id: editProduct.barcode_id || editProduct.barcode || generate7DigitId(),
        name: editProduct.name || "",
        cat_id: editProduct.cat_id || "",
        categoryName: editProduct.categoryName || "",
        tva: editProduct.tva || 0,
        isActive: editProduct.isActive ?? true,
        _id: editProduct._id,
      };
      
      console.log("Setting product form with:", newForm);
      setForm(newForm);
    } else {
      console.log("Creating new product form");
      const newForm = {
        prod_id: generateCustomId("P"),
        barcode_id: generate7DigitId(),
        name: "",
        cat_id: "",
        tva: 0,
        isActive: true,
      };
      console.log("New product form:", newForm);
      setForm(newForm);
    }
  }, [editProduct]);

  const handleChange = (
    field: keyof ProductForm,
    value: string | number | boolean
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const requiredFields: Array<keyof ProductForm> = [
      "prod_id",
      "barcode_id",
      "name",
      "cat_id",
    ];
    let isValid = true;
    const newErrors: Partial<ProductForm> = {};

    requiredFields.forEach((field) => {
      if (!form[field]) {
        newErrors[field] = `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } is required`;
        isValid = false;
      }
    });

    // Additional validation
    if (form.name && form.name.length < 2) {
      newErrors.name = "Product name must be at least 2 characters";
      isValid = false;
    }

    if (form.barcode_id && form.barcode_id.length < 3) {
      newErrors.barcode_id = "Barcode must be at least 3 characters";
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
      const result = editProduct
        ? await updateProduct(editProduct._id, form)
        : await createProduct(form);

      if (!result?.success) {
        throw new Error(result?.error || "Operation failed");
      }

      toast.success(
        `Product ${editProduct ? "updated" : "created"} successfully`
      );

      setData((prev) => {
        if (editProduct) {
          return prev.map((item) =>
            item._id === editProduct._id ? { ...item, ...result.data } : item
          );
        }
        return [result.data, ...prev];
      });

      setPopUp(false);
      setEditProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (selectedName: string) => {
    const selected = categories.find((c) => c.name === selectedName);
    handleChange("cat_id", selected ? selected._id : "");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 text-center max-h-[80vh] w-xl overflow-y-auto px-12"
    >
      <h1 className="text-2xl font-bold text-title">
        {editProduct ? "EDIT PRODUCT" : "ADD PRODUCT"}
      </h1>

      {/* Debug info */}
      <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
        <div>Edit Mode: {editProduct ? 'Yes' : 'No'}</div>
        <div>Product ID: {form.prod_id}</div>
        <div>Barcode: {form.barcode_id}</div>
        <div>EditProduct ID: {editProduct?._id || 'N/A'}</div>
      </div>

      {/* Product ID (disabled) */}
      <AddTextInput 
        isDisabled 
        placeholder={form.prod_id}
      />

      {/* Barcode */}
      <AddTextInput
        name="barcode_id"
        placeholder={form.barcode_id}
        onChange={(e) => handleChange("barcode_id", e.target.value)}
        error={errors.barcode_id}
        isDisabled
        required
        controlled={true}
      />

      {/* Product Name */}
      <AddTextInput
        name="name"
        value={form.name}
        onChange={(e) => handleChange("name", e.target.value)}
        placeholder="Product Name"
        error={errors.name}
        required
        controlled={true}
      />

      {/* Category */}
      <SelectInput
        placeholder="Category"
        options={categories.map((c) => c.name)}
        defaultValue={
          categories.find((c) => c._id === form.cat_id)?.name ||
          form.categoryName ||
          ""
        }
        onSelect={handleCategorySelect}
        error={errors.cat_id}
      />

      {/* TVA */}
      <SelectInput
        placeholder="TVA"
        options={["0", "9", "19"]}
        defaultValue={form.tva.toString()}
        onSelect={(val) => handleChange("tva", Number(val))}
        error={errors.tva}
      />

      {/* Status Switch */}
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

      {/* Submit Button */}
      <AddButton
        type="submit"
        disabled={isLoading || !form.prod_id || !form.name}
        className="mt-4"
        text={
          isLoading
            ? "Processing..."
            : editProduct
            ? "Update Product"
            : "Create Product"
        }
      />
    </form>
  );
}