import AddTextInput from "@/components/forms/AddTextInput";
import Popup from "@/components/Popup";
import { createTask } from "@/lib/actions/todoActions";
import { IProject, ITask, TaskPriority } from "@/lib/models/projectModel";
import { X } from "lucide-react";
import React, { useState } from "react";
import SelectInput from "@/components/forms/SelectInput";
import AddButton from "@/components/AddButton";
import { toast } from "sonner";

type PopupProps = {
  isOpen: boolean;
  onClose: () => void;
  currentProject: IProject;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
};

function AddTaskPopup({
  isOpen,
  onClose,
  currentProject,
  setProjects,
}: PopupProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    deadline: "",
    assignee: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      deadline: "",
      assignee: "",
      tags: [],
    });
    setTagInput("");
  };

  const addTask = async (projectId: string, taskData: Partial<ITask>) => {
    if (!taskData.title?.trim()) return;

    try {
      const newTask = await createTask(projectId, {
        title: taskData.title.trim(),
        description: taskData.description?.trim(),
        priority: taskData.priority || "medium",
        status: "todo",
        deadline: taskData.deadline,
        tags: taskData.tags || [],
        assignee: taskData.assignee,
      });

      setProjects((prev) =>
        prev.map((p) =>
          p._id === projectId ? { ...p, tasks: [newTask, ...p.tasks] } : p
        )
      );
      toast.success("Task added successfully");
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      addTask(currentProject._id as string, {
        ...formData,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
      });
      resetForm();
      onClose();
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Popup isOpen={isOpen} onClose={handleClose}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 text-center max-h-[80vh] w-xl overflow-y-auto px-12"
      >
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-2xl font-bold text-title text-center">
            ADD NEW TASK
          </h1>
        </div>

        <div className="space-y-4">
          <AddTextInput
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Enter task title"
            autoFocus
          />

          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="bg-secondary text-title p-5 rounded-2xl text-center placeholder:text-center w-full"
            rows={3}
            placeholder="Enter task description (optional)"
          />

          <div className="grid grid-cols-2 gap-4">
            <SelectInput
              value={formData.priority}
              placeholder="Priority"
              options={["low", "medium", "high"]}
              onSelect={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  priority: val as TaskPriority,
                }))
              }
            />

            <AddTextInput
              type="date"
              value={formData.deadline}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, deadline: e.target.value }))
              }
            />
          </div>

          <AddTextInput
            type="text"
            value={formData.assignee}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, assignee: e.target.value }))
            }
            placeholder="Enter assignee name (optional)"
          />

          <div>
            <div className="flex gap-2 mb-2">
              <AddTextInput
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="tags"
              />
              <button
                className="px-3 py-1 my-1 bg-transparent border border-btn-secondary text-btn-secondary rounded text-sm"
                type="button"
                onClick={addTag}
              >
                Add
              </button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2 py-1 bg-transparent border border-btn-secondary text-btn-secondary rounded text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="btn-secondary"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <AddButton type="submit" text="Add Task" />
      </form>
    </Popup>
  );
}

export default AddTaskPopup;
