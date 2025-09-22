"use client";

import { useEffect, useMemo, useState } from "react";
import AddTextInput from "../forms/AddTextInput";
import AddButton from "../AddButton";
import SelectInput from "@/components/forms/SelectInput";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { generate3DigitId } from "@/lib/utils";
import { createUser, updateUser } from "@/lib/actions/userActions";
import { useUserStore } from "@/lib/store/useUser";

interface Props {
  setData: React.Dispatch<React.SetStateAction<any[]>>;
  setPopUp: React.Dispatch<React.SetStateAction<boolean>>;
  editUser?: any | null;
  setEditUser?: React.Dispatch<React.SetStateAction<any | null>>;
}

function UsersPopup({ setPopUp, setData, editUser, setEditUser }: Props) {
  const newClientId = useMemo(() => generate3DigitId(), []);
  const { user } = useUserStore();

  const [form, setForm] = useState({
    id: "",
    name: "",
    password: "",
    role: "",
    isActive: true,
  });

  useEffect(() => {
    if (editUser) {
      setForm({
        id: editUser.id,
        name: editUser.name,
        role: editUser.role,
        isActive: editUser.isActive,
        password: "",
      });
    } else {
      setForm((prev) => ({ ...prev, id: newClientId }));
    }
  }, [editUser, newClientId]);

  const handleChange = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (user?.role !== "admin") {
      toast.error("You do not have permission to perform this action");
      return;
    }

    const payload = { ...form };

    setPopUp(false);
    setEditUser?.(null);

    try {
      if (editUser) {
        await toast.promise(updateUser(editUser._id, payload), {
          loading: "Updating user...",
          success: () => {
            setData((prev) =>
              prev.map((u) =>
                u._id === editUser._id
                  ? {
                      ...u,
                      ...payload,
                      updatedAt: new Date().toISOString(),
                    }
                  : u
              )
            );
            return `User ${form.id} updated`;
          },
          error: "Failed to update user",
        });
      } else {
        await toast.promise(createUser(payload), {
          loading: "Saving user...",
          success: (response) => {
            if (!response?.success)
              throw new Error(response?.error || "Failed to save user");

            setData((prev) => [
              ...prev,
              {
                ...payload,
                _id: response.data?._id || "",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ]);
            return `User ${form.id} added`;
          },
          error: (err) => err.message || "Failed to add user",
        });
      }
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="p-8 text-center text-red-500 font-semibold">
        You are not authorized to access this feature.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 text-center px-12"
    >
      <h1 className="text-2xl font-bold text-title">
        {editUser ? "EDIT USER" : "ADD A USER"}
      </h1>

      <AddTextInput isDisabled placeholder={"#" + form.id} />

      <AddTextInput
        value={form.name}
        onChange={(e) => handleChange("name", e.target.value)}
        placeholder="Username"
        name="name"
      />

      <AddTextInput
        type="password"
        name="password"
        value={form.password}
        onChange={(e) => handleChange("password", e.target.value)}
        placeholder={
          editUser
            ? "Password (leave blank to keep unchanged)"
            : "Password (min 4 characters)"
        }
      />

      <SelectInput
        onSelect={(role) => handleChange("role", role)}
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

      <AddButton type="submit" text={editUser ? "Update User" : "Add User"} />
    </form>
  );
}

export default UsersPopup;
