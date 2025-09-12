"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { createClient, updateClient } from "@/lib/actions/clientActions";
import AddTextInput from "../forms/AddTextInput";
import { Switch } from "../ui/switch";
import { generateCustomId } from "@/lib/utils";
import AddButton from "../AddButton";
import { X } from "lucide-react";

interface SocialMedia {
  platform: string;
  account: string;
}

interface ClientFormData {
  client_id: string;
  name: string;
  email: string;
  phone: string;
  nif: string;
  nis: string;
  rc: string;
  art: string;
  isActive: boolean;
  social: SocialMedia[];
}

type FormErrors = Partial<Record<keyof ClientFormData, string>> & {
  social?: Array<{ platform?: string; account?: string }>;
};

interface ClientPopupProps {
  setData: React.Dispatch<React.SetStateAction<any[]>>;
  setPopUp: React.Dispatch<React.SetStateAction<boolean>>;
  editClient?: ClientFormData & { _id: string };
  setEditClient: React.Dispatch<React.SetStateAction<any>>;
}

const ClientPopup: React.FC<ClientPopupProps> = ({
  setData,
  setPopUp,
  editClient,
  setEditClient,
}) => {
  const [form, setForm] = useState<ClientFormData>({
    client_id: generateCustomId("C"),
    name: "",
    email: "",
    phone: "",
    nif: "",
    nis: "",
    rc: "",
    art: "",
    isActive: true,
    social: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editClient) {
      setForm({
        client_id: editClient.client_id,
        name: editClient.name || "",
        email: editClient.email || "",
        phone: editClient.phone || "",
        nif: editClient.nif || "",
        nis: editClient.nis || "",
        rc: editClient.rc || "",
        art: editClient.art || "",
        isActive: editClient.isActive ?? true,
        social: editClient.social || [],
      });
    }
  }, [editClient]);

  // ----------------- MANUAL VALIDATION -----------------
  const validateField = (field: keyof ClientFormData, value: any) => {
    let error = "";

    switch (field) {
      case "client_id":
        if (!value || value.length < 7)
          error = "Client ID must be at least 7 characters";
        break;
      case "name":
        if (!value || value.length < 2)
          error = "Name must be at least 2 characters";
        break;
      case "email":
        if (value && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
          error = "Invalid email format";
        }
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error || undefined }));
    return !error;
  };

  const validateSocial = (index: number) => {
    const sm = form.social[index];
    const newErrors = { platform: "", account: "" };

    if (!sm.platform) newErrors.platform = "Platform is required";
    if (sm.account && sm.account.length < 2)
      newErrors.account = "Account must be at least 2 characters";

    setErrors((prev) => {
      const socialErrors = [...(prev.social || [])];
      socialErrors[index] = newErrors;
      return { ...prev, social: socialErrors };
    });

    return !newErrors.platform && !newErrors.account;
  };

  const validateForm = () => {
    let valid = true;

    valid = validateField("client_id", form.client_id) && valid;
    valid = validateField("name", form.name) && valid;
    valid = validateField("email", form.email) && valid;

    form.social.forEach((_, i) => {
      valid = validateSocial(i) && valid;
    });

    return valid;
  };

  // ----------------- HANDLERS -----------------
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | { name: string; value: any }
  ) => {
    const name = "target" in e ? e.target.name : e.name;
    const value = "target" in e ? e.target.value : e.value;

    setForm((prev) => ({ ...prev, [name]: value }));
    validateField(name as keyof ClientFormData, value);
  };

  const handleSocialChange = (
    index: number,
    field: "platform" | "account",
    value: string
  ) => {
    const updatedSocial = [...form.social];
    updatedSocial[index] = { ...updatedSocial[index], [field]: value };

    setForm((prev) => ({ ...prev, social: updatedSocial }));
    validateSocial(index);
  };

  const addSocial = () => {
    setForm((prev) => ({
      ...prev,
      social: [...prev.social, { platform: "", account: "" }],
    }));
  };

  const removeSocial = (index: number) => {
    const updatedSocial = [...form.social];
    updatedSocial.splice(index, 1);

    setForm((prev) => ({ ...prev, social: updatedSocial }));
    setErrors((prev) => ({
      ...prev,
      social: prev.social?.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      toast.error("Please fix the form errors");
      setIsSubmitting(false);
      return;
    }

    try {
      let res;
      if (editClient) {
        res = await updateClient(editClient._id, form);
      } else {
        res = await createClient(form);
      }

      if (!res?.success) throw new Error(res?.error || "Failed to save client");

      setData((prev) =>
        editClient
          ? prev.map((item) => (item._id === editClient._id ? res.data : item))
          : [...prev, res.data]
      );

      setPopUp(false);
      setEditClient(null);
      toast.success(
        `Client ${editClient ? "updated" : "created"} successfully`
      );
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 w-xl p-6 max-h-[80vh] overflow-y-auto"
    >
      <h2 className="text-2xl text-center font-bold text-title">
        {editClient ? "Edit Client" : "Add Client"}
      </h2>

      <AddTextInput isDisabled placeholder={form.client_id} />

      <AddTextInput
        name="name"
        placeholder="Full Name"
        value={form.name}
        onChange={handleChange}
        error={errors.name}
      />

      <AddTextInput
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        error={errors.email}
      />

      <AddTextInput
        name="phone"
        placeholder="Phone"
        value={form.phone}
        onChange={handleChange}
        error={errors.phone}
      />

      <div className="grid grid-cols-2 gap-2">
        <AddTextInput
          name="nif"
          placeholder="NIF"
          value={form.nif}
          onChange={handleChange}
        />
        <AddTextInput
          name="nis"
          placeholder="NIS"
          value={form.nis}
          onChange={handleChange}
        />
        <AddTextInput
          name="rc"
          placeholder="RC"
          value={form.rc}
          onChange={handleChange}
        />
        <AddTextInput
          name="art"
          placeholder="ART"
          value={form.art}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col items-center py-2">
        <label className="block font-medium mb-2">Status</label>
        <div className="flex items-center">
          <span className={`mr-2 ${!form.isActive ? "font-semibold" : ""}`}>
            Inactive
          </span>
          <Switch
            checked={form.isActive}
            onCheckedChange={(checked) =>
              handleChange({ name: "isActive", value: checked })
            }
            className="scale-110 mx-2"
          />
          <span className={`ml-2 ${form.isActive ? "font-semibold" : ""}`}>
            Active
          </span>
        </div>
      </div>

      <div className="mt-2">
        <label className="block font-medium mb-2">Social Media</label>
        {form.social.map((sm, index) => (
          <div key={index} className="flex gap-2 mb-3 items-center w-3/4">
            <div className="flex-1">
              <AddTextInput
                className="text-[.68rem]"
                placeholder="Platform (e.g. Facebook)"
                value={sm.platform}
                onChange={(e) =>
                  handleSocialChange(index, "platform", e.target.value)
                }
                error={errors.social?.[index]?.platform}
              />
            </div>
            <div className="flex-1">
              <AddTextInput
                className="text-[.68rem]"
                placeholder="Account"
                value={sm.account}
                onChange={(e) =>
                  handleSocialChange(index, "account", e.target.value)
                }
                error={errors.social?.[index]?.account}
              />
            </div>
            <button
              type="button"
              onClick={() => removeSocial(index)}
              className="mt-2 text-red-500 hover:text-red-700"
            >
              <X size={18} className="cursor-pointer" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addSocial}
          className="px-3 py-1.5 text-sm bg-secondary rounded hover:bg-secondary/65 cursor-pointer flex items-center gap-1"
        >
          <span>+</span> Add Social Media
        </button>
      </div>

      <AddButton
        type="submit"
        text={
          isSubmitting
            ? "Processing..."
            : editClient
            ? "Update Client"
            : "Create Client"
        }
      />
    </form>
  );
};

export default ClientPopup;
