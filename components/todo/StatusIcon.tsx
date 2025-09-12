import { TaskStatus } from "@/lib/models/projectModel";
import { Circle, Clock, CheckCircle2 } from "lucide-react";

export function StatusIcon({ status }: { status: TaskStatus }) {
  switch (status) {
    case "todo":
      return <Circle size={16} className="text-gray-500" />;
    case "in-progress":
      return <Clock size={16} className="text-yellow-500" />;
    case "done":
      return <CheckCircle2 size={16} className="text-green-500" />;
  }
}
