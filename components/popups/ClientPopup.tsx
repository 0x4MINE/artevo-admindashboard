"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { createClient, updateClient } from "@/lib/actions/clientActions";
import AddTextInput from "../forms/AddTextInput";
import { Switch } from "../ui/switch";
import { generate7DigitId, generateCustomId } from "@/lib/utils";
import AddButton from "../AddButton";
import { X } from "lucide-react";

// Define Zod schema for validation
const clientSchema = z.object({
  client_id: z.string().min(7, "Client ID must be at least 7 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional(),
  nif: z.string().optional(),
  nis: z.string().optional(),
  rc: z.string().optional(),
  art: z.string().optional(),
  isActive: z.boolean(),
  social: z.array(
    z.object({
      platform: z.string().min(1, "Platform is required"),
      account: z.string().optional().or(z.literal("")),
    })
  ),
});

// Define types based on schema
type ClientFormData = z.infer<typeof clientSchema>;
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

  const validateField = (field: keyof ClientFormData, value: any) => {
    try {
      const fieldSchema = clientSchema.pick({ [field]: true });
      fieldSchema.parse({ [field]: value });
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errorMessage = err.issues[0]?.message || `Invalid ${field}`;
        setErrors(prev => ({ ...prev, [field]: errorMessage }));
      }
      return false;
    }
  };

  const validateSocialMedia = (index: number) => {
    try {
      const socialSchema = clientSchema.shape.social.element;
      socialSchema.parse(form.social[index]);
      
      setErrors(prev => ({
        ...prev,
        social: prev.social?.map((item, i) => 
          i === index ? { platform: undefined, account: undefined } : item
        ) || []
      }));
      
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors = { platform: undefined, account: undefined };
        
        err.issues.forEach(issue => {
          if (issue.path[0] === "platform") newErrors.platform = issue.message;
          if (issue.path[0] === "account") newErrors.account = issue.message;
        });
        
        setErrors(prev => ({
          ...prev,
          social: prev.social?.map((item, i) => 
            i === index ? newErrors : item
          ) || [newErrors]
        }));
      }
      return false;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | { name: string; value: any }
  ) => {
    const name = "target" in e ? e.target.name : e.name;
    const value = "target" in e ? e.target.value : e.value;
    
    setForm(prev => ({ ...prev, [name]: value }));
    validateField(name as keyof ClientFormData, value);
  };

  const handleSocialChange = (index: number, field: "platform" | "account", value: string) => {
    const updatedSocialMedia = [...form.social];
    updatedSocialMedia[index] = { ...updatedSocialMedia[index], [field]: value };
    
    setForm(prev => ({ ...prev, social: updatedSocialMedia }));
    validateSocialMedia(index);
  };

  const addSocialMedia = () => {
    setForm(prev => ({
      ...prev,
      social: [...prev.social, { platform: "", account: "" }]
    }));
  };

  const removeSocialMedia = (index: number) => {
    const updatedSocialMedia = [...form.social];
    updatedSocialMedia.splice(index, 1);
    
    setForm(prev => ({ ...prev, social: updatedSocialMedia }));
    setErrors(prev => ({
      ...prev,
      social: prev.social?.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const result = clientSchema.safeParse(form);
    
    if (!result.success) {
      const newErrors: FormErrors = {};
      
      result.error.issues.forEach(({ path, message }) => {
        if (path.length === 1) {
          newErrors[path[0]] as keyof ClientFormData = message;
        } else if (path.length > 1 && path[0] === "social") {
          const index = path[1] as number;
          const field = path[2] as "platform" | "account";
          
          if (!newErrors.social) newErrors.social = [];
          if (!newErrors.social[index]) newErrors.social[index] = {};
          
          newErrors.social[index][field] = message;
        }
      });
      
      setErrors(newErrors);
      console.log(errors)
      return false;
    }
    
    return true;
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
      console.log("form:",form)
      if (editClient) {
        
        res = await updateClient(editClient._id, form);
      } else {
        res = await createClient(form);
      }

      if (!res?.success) {
        throw new Error(res?.error || "Failed to save client");
      }

      setData(prev => {
        if (editClient) {
          return prev.map(item => 
            item._id === editClient._id ? res.data : item
          );
        }
        return [...prev, res.data];
      });

      setPopUp(false);
      setEditClient(null);
      
      toast.success(
        `Client ${editClient ? "updated" : "created"} successfully`
      );
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 w-xl p-6 max-h-[80vh]  overflow-y-auto"
    >
        <h2 className="text-2xl text-center font-bold text-title">
          {editClient ? "Edit Client" : "Add Client"}
        </h2>
        

      <AddTextInput 
        isDisabled 
        placeholder={form.client_id}
      />

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
          error={errors.nif}
        />
        <AddTextInput
          name="nis"
          placeholder="NIS"
          value={form.nis}
          onChange={handleChange}
          error={errors.nis}
        />
        <AddTextInput
          name="rc"
          placeholder="RC"
          value={form.rc}
          onChange={handleChange}
          error={errors.rc}
        />
        <AddTextInput
          name="art"
          placeholder="ART"
          value={form.art}
          onChange={handleChange}
          error={errors.art}
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
            onCheckedChange={checked => 
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
                onChange={e => handleSocialChange(index, "platform", e.target.value)}
                error={errors.social?.[index]?.platform}
              />
            </div>
            <div className="flex-1">
              <AddTextInput
                className="text-[.68rem]"
                placeholder="account"
                value={sm.account}
                onChange={e => handleSocialChange(index, "account", e.target.value)}
                error={errors.social?.[index]?.account}
              />
            </div>
            <button
              type="button"
              onClick={() => removeSocialMedia(index)}
              className="mt-2 text-red-500 hover:text-red-700"
              aria-label="Remove social media"
            >
              <X size={18} className="cursor-pointer" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addSocialMedia}
          className="px-3 py-1.5 text-sm bg-secondary rounded hover:bg-secondary/65 cursor-pointer flex items-center gap-1"
        >
          <span>+</span> Add Social Media
        </button>
      </div>

        
        <AddButton
          type="submit"
          text={isSubmitting 
            ? "Processing..." 
            : editClient 
              ? "Update Client" 
              : "Create Client"}
        >
          
        </AddButton>
    </form>
  );
};

export default ClientPopup;