import { ProjectStatus, TaskStatus } from "@/lib/models/projectModel";

export function TodoStatusBadge({ status }: { status: ProjectStatus | TaskStatus }) {
  const colors = {
    pending: "bg-gray-100 text-gray-700",
    "in-progress": "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    todo: "bg-gray-100 text-gray-700",
    done: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}
    >
      {status.replace("-", " ")}
    </span>
  );
}