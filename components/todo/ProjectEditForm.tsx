"use client";
import { IProject } from "@/lib/models/projectModel";
import { Save } from "lucide-react";
import { useState } from "react";
import AddTextInput from "../forms/AddTextInput";

export function ProjectEditForm({
  project,
  onSave,
  onCancel,
}: {
  project: IProject;
  onSave: (updates: Partial<IProject>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [deadline, setDeadline] = useState(
    project.deadline
      ? new Date(project.deadline).toISOString().split("T")[0]
      : ""
  );

  const handleSubmit = () => {
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      deadline: deadline ? new Date(deadline) : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-title mb-1">
          Project Name
        </label>
        <AddTextInput
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-title mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-secondary text-title p-5 rounded-2xl text-center placeholder:text-center w-full focus:ring-blue-500"
          rows={3}
          placeholder="Enter project description (optional)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-title mb-1">
          Deadline
        </label>
        <AddTextInput
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2 cursor-pointer" >
        <button
          onClick={handleSubmit}
          className="py-2 px-4 bg-btn-primary text-white text-sm rounded-[10px] font-bold flex items-center justify-center gap-3"
        >
          <Save size={16} /> Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-subtitle border rounded-[10px] hover:bg- "
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
