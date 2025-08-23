"use client";

import { useEffect, useState } from "react";
import AddTextInput from "../forms/AddTextInput";
import { generate3DigitId, generateCustomId } from "@/lib/utils";
import AddButton from "../AddButton";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import SelectInput from "@/components/forms/SelectInput";
import { createService, updateService } from "@/lib/actions/serviceActions";
import { z } from "zod";

const serviceSchema = z.object({
  serv_id: z.string().min(3, "ID must be at least 3 characters"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(110, "Name cannot exceed 110 characters"),
  buyPrice: z.number().min(0, "Buy price cannot be negative"),
  sellPrice: z.number().min(0, "Sell price cannot be negative"),
  tva: z.number().min(0, "VAT rate cannot be negative"),
  isActive: z.boolean(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

type Props = {
  setPopUp: React.Dispatch<React.SetStateAction<boolean>>;
  setData: React.Dispatch<React.SetStateAction<any[]>>;
  editService?: {
    _id: string;
    serv_id: string;
    name: string;
    buyPrice: number | undefined;
    sellPrice: number | undefined;
    tva: number;
    isActive: boolean;
  };
  setEditService?: React.Dispatch<React.SetStateAction<any>>;
};

function useValidation(initialData: ServiceFormData) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [priceError, setPriceError] = useState("");

  const validateField = (field: keyof ServiceFormData, value: unknown) => {
    try {
      const fieldSchema = serviceSchema.pick({ [field]: true });
      fieldSchema.parse({ [field]: value });
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Safely handle Zod errors
        const errorMessage =
          error.issues?.find((issue) => issue.path.includes(field))?.message ||
          `Invalid ${field}`;

        setErrors((prev) => ({
          ...prev,
          [field]: errorMessage,
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          [field]: `Validation failed for ${field}`,
        }));
      }
    }
  };

  const validatePriceRelationship = (buyPrice: number, sellPrice: number) => {
    if (sellPrice < buyPrice) {
      setPriceError("Sell price must be greater than or equal to buy price");
    } else {
      setPriceError("");
    }
  };

  return {
    errors,
    priceError,
    validateField,
    validatePriceRelationship,
    setErrors,
  };
}

export default function ServicesPopup({
  setPopUp,
  setData,
  editService,
  setEditService,
}: Props) {
  const isEditMode = Boolean(editService);

  const [form, setForm] = useState<ServiceFormData>({
    serv_id: "",
    name: "",
    buyPrice: undefined,
    sellPrice: undefined,
    tva: 0,
    isActive: true,
  });

  const {
    errors,
    priceError,
    validateField,
    validatePriceRelationship,
    setErrors,
  } = useValidation(form);

  useEffect(() => {
    if (isEditMode && editService) {
      console.log(editService)
      setForm({
        serv_id: editService.serv_id,
        name: editService.name,
        buyPrice: editService.buyPrice,
        sellPrice: editService.sellPrice,
        tva: editService.tva,
        isActive: editService.isActive,
      });
    } else {
      setForm((prev) => ({ ...prev, serv_id: generateCustomId("SR") }));
    }
  }, [isEditMode, editService]);

  const handleChange = (
    field: keyof ServiceFormData,
    value: string | boolean | number
  ) => {
    const newValue =
      typeof value === "string" && !isNaN(Number(value)) && field !== "name"
        ? Number(value)
        : value;
    setForm((prev) => {
      const updated = { ...prev, [field]: newValue };

      validateField(field, newValue);

      if (field === "buyPrice" || field === "sellPrice") {
        validatePriceRelationship(updated.buyPrice, updated.sellPrice);
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.sellPrice < form.buyPrice) {
      toast.error("Sell price must be greater than or equal to buy price");
      return;
    }

    const validation = serviceSchema.safeParse(form);
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach(({ path, message }) => {
        if (path[0]) newErrors[path[0]] = message;
      });
      setErrors(newErrors);
      toast.error("Please fix the form errors");
      return;
    }

    setPopUp(false);

    try {
      const action =
        isEditMode && editService?._id
          ? updateService(editService._id, validation.data)
          : createService(validation.data);

      toast.promise(action, {
        loading: isEditMode ? "Updating service..." : "Creating service...",
        success: (response) => {
          if (!response?.success)
            throw new Error(response?.error || "Operation failed");

          const updatedService = {
            ...validation.data,
            _id: response.data?._id || editService?._id || "",
          };

          setData((prev) =>
            isEditMode
              ? prev.map((item) =>
                  item._id === editService?._id ? updatedService : item
                )
              : [...prev, updatedService]
          );

          if (isEditMode && setEditService) setEditService(null);

          return isEditMode
            ? `Service ${form.name} updated successfully`
            : `Service ${form.name} created successfully`;
        },
        error: (err) => err.message || "Operation failed",
      });
    } catch (error) {
      console.error("Error processing service:", error);
      toast.error("Failed to process service");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-center gap-4 text-center px-12"
    >
      <h1 className="text-2xl font-bold text-title">
        {isEditMode ? "EDIT SERVICE" : "ADD SERVICE"}
      </h1>

      <AddTextInput isDisabled placeholder={form.serv_id} />

      <AddTextInput
        value={form.name}
        onChange={(e) => handleChange("name", e.target.value)}
        placeholder="Service Name"
        error={errors.name || ""}
      />

      <AddTextInput
        value={form.buyPrice !== undefined ? form.buyPrice.toString() : ""}
        onChange={(e) => handleChange("buyPrice", e.target.value)}
        placeholder="Buy Price"
        error={errors.buyPrice}
        type="number"
      />

      <AddTextInput
        value={form.sellPrice !== undefined ? form.sellPrice.toString() : ""}
        onChange={(e) => handleChange("sellPrice", e.target.value)}
        placeholder="Sell Price"
        error={errors.sellPrice || priceError}
        type="number"
      />

      <SelectInput
        placeholder="TVA"
        options={["0", "9", "19"]}
        onSelect={(value) => handleChange("tva", parseInt(value))}
        error={errors.tva}
        value={form.tva || 0}
        label="VAT Rate (%)"
      />

      <div className="flex flex-col items-center">
        <p className="mb-2">Status</p>
        <div className="flex items-center">
          <p>Inactive</p>
          <Switch
            checked={form.isActive}
            onCheckedChange={(checked) => handleChange("isActive", checked)}
            className="scale-150 mx-4"
          />
          <p>Active</p>
        </div>
      </div>

      <AddButton type="submit" className="mt-4">
        {isEditMode ? "Update Service" : "Add Service"}
      </AddButton>
    </form>
  );
}
