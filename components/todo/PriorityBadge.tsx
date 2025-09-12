import { TaskPriority } from "@/lib/models/projectModel";

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const colors = {
    low: "bg-blue-100 text-blue-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${colors[priority]}`}
    >
      {priority}
    </span>
  );
}
