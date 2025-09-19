"use client";
import AddButton from "@/components/AddButton";
import Popup from "@/components/Popup";
import AddTextInput from "@/components/forms/AddTextInput";
import SelectInput from "@/components/forms/SelectInput";
import { createProject } from "@/lib/actions/todoActions";
import { IProject } from "@/lib/models/projectModel";
import { X } from "lucide-react";

import React, { useState } from "react";
import { toast } from "sonner";
type PopupProps = {
  isOpen: boolean;
  onClose: () => void;
  setSelectedProject: (value: React.SetStateAction<string | null>) => void;
  setProjects: (value: React.SetStateAction<IProject[]>) => void;
};
function NewProjectPopup({
  isOpen,
  onClose,
  setSelectedProject,
  setProjects,
}: PopupProps) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    deadline: null,
  });

  const addProject = async () => {
    if (!form.name.trim()) return;

    try {
      const newProject = await createProject({
        name: form.name.trim(),
        description: form.description?.trim(),
        deadline: form.deadline,
        status: "pending",
        tasks: [],
      });

      setProjects((prev) => [newProject, ...prev]);
      setSelectedProject(newProject._id);
      toast.success("Project created succesfully");
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create project");
    }
  };

  return (
    <Popup isOpen={isOpen} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addProject();
          setForm({ name: "", description: "" });
          onClose();
        }}
        className="flex flex-col gap-4  text-center max-h-[80vh] w-xl overflow-y-auto px-12"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-2xl font-bold text-title text-center">
            CREATE NEW PROJECT
          </h1>
        </div>

        <div>
          <AddTextInput
            placeholder="Project Name"
            autoFocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <textarea
            //   onChange={(e) => setDescription(e.target.value)}
            className="bg-secondary text-title p-5 rounded-2xl text-center placeholder:text-center w-full"
            rows={3}
            placeholder="Enter project description (optional)"
          />
        </div>
        <AddTextInput
          type="date"
          placeholder="Deadline"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
        />
        <AddButton type="submit" text={"Create Project"} />
      </form>
    </Popup>
  );
}
export default NewProjectPopup;
