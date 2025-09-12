"use client"

import { IProject } from "@/lib/models/projectModel";
import { Archive, Edit3, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";

export function ProjectActions({
  project,
  onEdit,
  onArchive,
  onDelete,
}: {
  project: IProject;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 rounded-lg hover:bg-gray-100"
      >
        <MoreVertical size={18} />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-[150px]">
          <button
            onClick={() => {
              onEdit();
              setShowMenu(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 w-full text-left"
          >
            <Edit3 size={14} /> Edit
          </button>
          <button
            onClick={() => {
              onArchive();
              setShowMenu(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 w-full text-left"
          >
            <Archive size={14} /> Archive
          </button>
          <button
            onClick={() => {
              onDelete();
              setShowMenu(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 w-full text-left text-red-600"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
