"use client";

import { useEffect, useMemo, useState } from "react";
import AddTextInput from "../forms/AddTextInput";
import { generate3DigitId } from "@/lib/utils";
import AddButton from "../AddButton";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import SelectInput from "@/components/forms/SelectInput";
import { createUser, updateUser } from "@/lib/actions/userActions";
import { z } from "zod";

const userSchema = z.object({
  id: z.string().min(3, "ID must be at least 3 characters"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  role: z.string().min(1, "Please select a role"),
  isActive: z.boolean(),
});

interface Props {
  setData: React.Dispatch<React.SetStateAction<any[]>>;
  setPopUp: React.Dispatch<React.SetStateAction<boolean>>;
  editUser?: any | null;
  setEditUser?: React.Dispatch<React.SetStateAction<any | null>>;
}

function UsersPopup({ setPopUp, setData, editUser, setEditUser }: Props) {
  const newClientId = useMemo(() => generate3DigitId(), []);
  const [form, setForm] = useState({
    id: "",
    name: "",
    isActive: true,
    password: "",
    role: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editUser) {
      setForm({
        id: editUser.id,
        name: editUser.name,
        password: "",
        role: editUser.role,
        isActive: editUser.isActive,
      });
    } else {
      setForm((prev) => ({ ...prev, id: newClientId }));
    }
  }, [editUser, newClientId]);

  const handleRoleSelect = (selectedRole: string) => {
    setForm((prev) => ({ ...prev, role: selectedRole }));
    setErrors((prev) => ({ ...prev, role: "" }));
  };

  const validateField = (field: keyof typeof form, value: string | boolean) => {
    try {
      const fieldSchema = z.object({ [field]: userSchema.shape[field] });
      fieldSchema.parse({ [field]: value });
      setErrors((prev) => ({ ...prev, [field]: "" }));
    } catch (error: unknown) {
      const defaultMessage = `Invalid ${field.toString()}`;
      let errorMessage = defaultMessage;

      if (error instanceof z.ZodError) {
        errorMessage = error.errors?.[0]?.message ?? defaultMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message || defaultMessage;
      }

      setErrors((prev) => ({ ...prev, [field]: errorMessage }));
    }
  };

  const handleChange = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = userSchema.safeParse(form);
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors?.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
      toast.error("Please fix the form errors");
      return;
    }

    setPopUp(false);
    setEditUser?.(null);

    try {
      if (editUser) {
        // UPDATE
        await toast.promise(updateUser(editUser._id, validation.data), {
          loading: "Updating user...",
          success: () => {
            setData((prev) =>
              prev.map((u) =>
                u._id === editUser._id
                  ? { ...u, ...validation.data, updatedAt: new Date().toISOString() }
                  : u
              )
            );
            return `User ${form.id} has been updated`;
          },
          error: "Failed to update user",
        });
      } else {
        // CREATE
        await toast.promise(createUser(validation.data), {
          loading: "Saving user...",
          success: (response) => {
            if (!response?.success)
              throw new Error(response?.error || "Failed to save user");

            setData((prev) => [
              ...prev,
              {
                ...validation.data,
                _id: response.data?._id || "",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ]);
            return `User ${form.id} has been added`;
          },
          error: (err) => err.message || "Failed to add user",
        });
      }
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 text-center px-12"
    >
      <h1 className="text-2xl font-bold text-title">
        {editUser ? "EDIT USER" : "ADD A USER"}
      </h1>

      <AddTextInput
        isDisabled
        placeholder={"#" + form.id}
      />

      <AddTextInput
        value={form.name}
        onChange={(e) => handleChange("name", e.target.value)}
        placeholder="Username"
        name="name"
        error={errors.name}
      />

      <AddTextInput
        type="password"
        name="password"
        value={form.password}
        onChange={(e) => handleChange("password", e.target.value)}
        placeholder="Password (min 4 characters)"
        error={errors.password}
      />

      <SelectInput
        onSelect={handleRoleSelect}
        error={errors.role}
        value={form.role}
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

      <AddButton type="submit">
        {editUser ? "Update User" : "Add User"}
      </AddButton>
    </form>
  );
}

export default UsersPopup;
