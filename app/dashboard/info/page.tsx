"use client";
import AddTextInput from "@/components/forms/AddTextInput";
import { useEffect, useRef, useState } from "react";
import { saveInfo, getInfo } from "@/lib/actions/infoActions";
import { toast, Toaster } from "sonner";
import Image from "next/image";

function Info() {
  const [form, setForm] = useState({
    companyName: "",
    companyDesc: "",
    address: "",
    phone: "",
    fax: "",
    rc: "",
    nif: "",
    nis: "",
    art: "",
    rib: "",
    banque: "",
    logoUrl: "",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load saved info from DB
  useEffect(() => {
    (async () => {
      const info = await getInfo();
      if (info) setForm(info);
    })();
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setForm((prev) => ({ ...prev, logoUrl: data.url }));
        toast.success("Logo uploaded!");
      } else {
        toast.error("Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload error");
    }
  };

  const handleSave = async () => {
    const res = await saveInfo(form);
    if (res.success) {
      toast.success("Info saved successfully!");
    } else {
      toast.error(res.error || "Error saving info");
    }
  };

  return (
    <div className="bg-background p-6">
      <Toaster richColors />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-title">Company Information</h1>
          <p className="text-subtitle">
            Manage your company details and legal information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Company Details */}
          <div className="space-y-6">
            {/* Company Information Card */}
            <div className="bg-primary rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-title mb-4">
                Company Details
              </h2>

              <div className="space-y-4">
                <AddTextInput
                  label="Company Name"
                  placeholder="Enter company name"
                  value={form.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                />

                <div>
                  <label className="block text-sm font-medium text-title mb-2">
                    Company Description
                  </label>
                  <textarea
                    className="bg-secondary text-title p-4 rounded-2xl text-center placeholder:text-center w-full"
                    placeholder="Brief description of your company"
                    value={form.companyDesc}
                    onChange={(e) =>
                      handleChange("companyDesc", e.target.value)
                    }
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-title mb-2">
                    Address
                  </label>
                  <textarea
                    className="bg-secondary text-title p-4 rounded-2xl text-center placeholder:text-center w-full"
                    placeholder="Company address"
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <AddTextInput
                    label="Phone"
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                  <AddTextInput
                    label="Fax"
                    placeholder="Fax number"
                    value={form.fax}
                    onChange={(e) => handleChange("fax", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Legal Information Card */}
            <div className="bg-primary rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-title mb-4">
                Legal Information
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <AddTextInput
                  label="RC Number"
                  placeholder="RC"
                  value={form.rc}
                  onChange={(e) => handleChange("rc", e.target.value)}
                />
                <AddTextInput
                  label="NIF"
                  placeholder="NIF"
                  value={form.nif}
                  onChange={(e) => handleChange("nif", e.target.value)}
                />
                <AddTextInput
                  label="NIS"
                  placeholder="NIS"
                  value={form.nis}
                  onChange={(e) => handleChange("nis", e.target.value)}
                />
                <AddTextInput
                  label="ART"
                  placeholder="ART"
                  value={form.art}
                  onChange={(e) => handleChange("art", e.target.value)}
                />
                <AddTextInput
                  label="RIB"
                  placeholder="RIB"
                  value={form.rib}
                  onChange={(e) => handleChange("rib", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Logo & Bank Info */}
          <div className="space-y-6">
            {/* Logo Upload Card */}
            <div className="bg-primary rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-title mb-4">
                Company Logo
              </h2>

              <div className="flex flex-col items-center space-y-4">
                <div className="w-48 h-48 bg-secondary border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center">
                  {form.logoUrl ? (
                    <Image
                      src={form.logoUrl}
                      className="w-full h-full object-cover rounded-2xl"
                      alt="Company Logo"
                    />
                  ) : (
                    <div className="text-subtitle text-center">
                      <div className="text-2xl">📷</div>
                      <p className="text-sm mt-2">No logo</p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-trasparent border border-btn-secondary cursor-pointer text-btn-secondary px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  Upload Logo
                </button>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleLogoChange}
                />

                <p className="text-xs text-gray-500 text-center">
                  Recommended: 500×500px, PNG or JPG
                </p>
              </div>
            </div>

            {/* Bank Information Card */}
            <div className="bg-primary rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-title mb-4">
                Bank Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-title mb-2">
                    Bank Details
                  </label>
                  <textarea
                    className="bg-secondary text-title p-4 rounded-2xl text-center placeholder:text-center w-full"
                    placeholder="Bank name, branch, and account details"
                    value={form.banque}
                    onChange={(e) => handleChange("banque", e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="w-full bg-btn-primary text-white px-6 py-3 rounded-[10px] text-sm font-medium hover:bg-btn-primary/80 cursor-pointer transition-colors shadow-sm"
            >
              Save Company Information
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Info;
