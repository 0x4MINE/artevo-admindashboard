"use client";

import { useEffect, useMemo, useState } from "react";
import AddTextInput from "../forms/AddTextInput";
import { generate3DigitId, generateCustomId } from "@/lib/utils";
import AddButton from "../AddButton";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { createCategory, updateCategory } from "@/lib/actions/categoryActions";

interface Props {
  setData: React.Dispatch<React.SetStateAction<any[]>>;
  setPopUp: React.Dispatch<React.SetStateAction<boolean>>;
  editCategory?: any | null;
  setEditCategory?: React.Dispatch<React.SetStateAction<any | null>>;
}

function CategoriesPopup({
  setPopUp,
  setData,
  editCategory,
  setEditCategory,
}: Props) {
  const newClientId = useMemo(() => generateCustomId("C"), []);
  const [form, setForm] = useState({
    id: "",
    name: "",
    isActive: true,
    spent: 0,
  });

  useEffect(() => {
    if (editCategory) {
      setForm({
        id: editCategory.id,
        name: editCategory.name,
        isActive: editCategory.isActive,
        spent: editCategory.spent || 0,
      });
    } else {
      setForm((prev) => ({ ...prev, id: newClientId }));
    }
  }, [editCategory, newClientId]);

  const handleChange = (
    field: keyof typeof form,
    value: string | boolean | number
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setPopUp(false);
    setEditCategory?.(null);

    try {
      if (editCategory) {
        // UPDATE CATEGORY
        await toast.promise(updateCategory(editCategory._id, form), {
          loading: "Updating category...",
          success: () => {
            setData((prev) =>
              prev.map((cat) =>
                cat._id === editCategory._id ? { ...cat, ...form } : cat
              )
            );
            return `${form.name} category has been updated`;
          },
          error: "Failed to update category",
        });
      } else {
        // CREATE CATEGORY
        await toast.promise(createCategory({ ...form, id: newClientId }), {
          loading: "Saving category...",
          success: (response) => {
            setData((prev) => [
              ...prev,
              {
                ...form,
                _id: response.data._id,
                id: newClientId,
              },
            ]);
            return `${response.data.name} category has been added`;
          },
          error: "Failed to add category",
        });
      }
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  return (
    <form className="flex flex-col gap-4 text-center px-12">
      <h1 className="text-2xl font-bold text-title">
        {editCategory ? "EDIT CATEGORY" : "ADD A CATEGORY"}
      </h1>

      <AddTextInput isDisabled placeholder={`${form.id}`} />

      <AddTextInput
        value={form.name}
        onChange={(e) => handleChange("name", e.target.value)}
        placeholder="Category Name"
      />

      <div className="flex flex-col items-center">
        <p>Status</p>
        <div className="flex items-center">
          <p>Inactive</p>
          <Switch
            checked={form.isActive}
            onCheckedChange={(e) => handleChange("isActive", e)}
            className="scale-150 m-4"
          />
          <p>Active</p>
        </div>
      </div>

      <AddButton
        type="button"
        onClick={handleSubmit}
        text={editCategory ? "Update Category" : "Add Category"}
      ></AddButton>
    </form>
  );
}

export default CategoriesPopup;
