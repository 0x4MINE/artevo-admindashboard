"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createSupplier, updateSupplier } from "@/lib/actions/supplierActions";
import AddTextInput from "@/components/forms/AddTextInput";
import AddButton from "@/components/AddButton";
import { generate3DigitId, generateCustomId } from "@/lib/utils";
import { Switch } from "../ui/switch";

type SupplierForm = {
  supp_id: string;
  name: string;
  phone: string;
  email: string;
  description: string;
  type: string;
  RC: string;
  NIF: string;
  NIS: string;
  ART: string;
  address: string;
  isActive: boolean;
  _id?: string;
};

type SupplierPopupProps = {
  setData: React.Dispatch<React.SetStateAction<any[]>>;
  setPopUp: React.Dispatch<React.SetStateAction<boolean>>;
  editSupplier?: any;
  setEditSupplier: React.Dispatch<React.SetStateAction<any>>;
};

export default function SupplierPopup({
  setData,
  setPopUp,
  editSupplier,
  setEditSupplier,
}: SupplierPopupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<SupplierForm>({
    supp_id: "",
    name: "",
    phone: "",
    email: "",
    description: "",
    type: "",
    RC: "",
    NIF: "",
    NIS: "",
    ART: "",
    address: "",
    isActive: true,
  });
  const [errors, setErrors] = useState<Partial<SupplierForm>>({});

  useEffect(() => {
    if (editSupplier) {
      setForm({
        supp_id: editSupplier.supp_id,
        name: editSupplier.name || "",
        phone: editSupplier.phone || "",
        email: editSupplier.email || "",
        description: editSupplier.description || "",
        type: editSupplier.type || "",
        RC: editSupplier.RC || "",
        NIF: editSupplier.NIF || "",
        NIS: editSupplier.NIS || "",
        ART: editSupplier.ART || "",
        address: editSupplier.address || "",
        isActive:
          editSupplier.isActive !== undefined ? editSupplier.isActive : true,
        _id: editSupplier._id,
      });
    } else {
      setForm({
        supp_id: generateCustomId("SP"),
        name: "",
        phone: "",
        email: "",
        description: "",
        type: "",
        RC: "",
        NIF: "",
        NIS: "",
        ART: "",
        address: "",
        isActive: true,
      });
    }
  }, [editSupplier]);

  const validateField = (
    field: keyof SupplierForm,
    value: string | boolean
  ): boolean => {
    let isValid = true;
    let errorMessage = "";

    if (typeof value === "string") {
      switch (field) {
        case "name":
          if (!value.trim()) {
            isValid = false;
            errorMessage = "Name is required";
          } else if (value.trim().length < 2) {
            isValid = false;
            errorMessage = "Name must be at least 2 characters";
          }
          break;
        case "email":
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            isValid = false;
            errorMessage = "Invalid email format";
          }
          break;
        case "phone":
          if (value && !/^[\d\s+-]+$/.test(value)) {
            isValid = false;
            errorMessage = "Invalid phone number";
          }
          break;
      }
    }

    setErrors((prev) => ({
      ...prev,
      [field]: isValid ? undefined : errorMessage,
    }));
    return isValid;
  };

  const handleChange = (field: keyof SupplierForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (typeof value === "string") {
      validateField(field, value);
    }
  };

  const validateForm = (): boolean => {
    const requiredFields: Array<keyof SupplierForm> = ["name"];
    let isValid = true;
    const newErrors: Partial<SupplierForm> = {};

    requiredFields.forEach((field) => {
      if (!form[field].toString().trim()) {
        newErrors[field] = `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } is required`;
        isValid = false;
      }
    });

    if (form.email && !validateField("email", form.email)) {
      isValid = false;
    }

    if (form.phone && !validateField("phone", form.phone)) {
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
      const result = editSupplier
        ? await updateSupplier(editSupplier._id, form)
        : await createSupplier(form);

      if (!result?.success) {
        throw new Error(result?.error || "Operation failed");
      }

      toast.success(
        `Supplier ${editSupplier ? "updated" : "created"} successfully`
      );

      setData((prev) => {
        if (editSupplier) {
          return prev.map((item) =>
            item._id === editSupplier._id ? { ...item, ...result.data } : item
          );
        }
        return [result.data, ...prev];
      });

      setPopUp(false);
      setEditSupplier(null);
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formFields = [
    { name: "name", placeholder: "Name", required: true },
    { name: "phone", placeholder: "Phone" },
    { name: "email", placeholder: "Email" },
    { name: "address", placeholder: "Address" },
    { name: "type", placeholder: "Type" },
  ];

  const documentFields = [
    { name: "RC", placeholder: "RC" },
    { name: "NIF", placeholder: "NIF" },
    { name: "NIS", placeholder: "NIS" },
    { name: "ART", placeholder: "ART" },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 text-center max-h-[80vh] w-xl overflow-y-auto px-12"
    >
      <h1 className="text-2xl font-bold text-title">
        {editSupplier ? "EDIT SUPPLIER" : "ADD SUPPLIER"}
      </h1>

      <AddTextInput isDisabled placeholder={form.supp_id} />

      {formFields.map((field) => (
        <AddTextInput
          key={field.name}
          name={field.name}
          value={form[field.name as keyof SupplierForm].toString()}
          onChange={(e) =>
            handleChange(field.name as keyof SupplierForm, e.target.value)
          }
          placeholder={field.placeholder}
          error={errors[field.name as keyof SupplierForm]}
          required={field.required}
        />
      ))}

      <textarea
        className="bg-secondary text-title px-4 py-4 rounded-2xl text-center placeholder:text-center min-h-[100px] resize-y"
        value={form.description}
        onChange={(e) => handleChange("description", e.target.value)}
        placeholder="Description"
        rows={50}
      />

      <div className="grid grid-cols-2 gap-4">
        {documentFields.map((field) => (
          <AddTextInput
            key={field.name}
            name={field.name}
            value={form[field.name as keyof SupplierForm].toString()}
            onChange={(e) =>
              handleChange(field.name as keyof SupplierForm, e.target.value)
            }
            placeholder={field.placeholder}
          />
        ))}
      </div>

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
        disabled={isLoading || !form.name}
        className="mt-4"
        text={
          isLoading
            ? "Processing..."
            : editSupplier
            ? "Update Supplier"
            : "Create Supplier"
        }
      ></AddButton>
    </form>
  );
}
