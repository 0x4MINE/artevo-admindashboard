import { getDayLabel, itemVariants, Task, TaskWithProject } from "@/app/dashboard/todo/page";
import { TaskStatus } from "@/lib/models/projectModel";
import {motion} from "framer-motion"
import { TodoStatusBadge } from "./TodoStatusBadge";
import { isOverdue } from "@/lib/utils/todoUtils";
import { isToday } from "date-fns";
import { Calendar, CheckCircle2 } from "lucide-react";
import { PriorityBadge } from "./PriorityBadge";
import { StatusIcon } from "./StatusIcon";
export const TodayTaskCard: React.FC<{
  task: TaskWithProject;
  progress: number;
  onToggleSubtask: (
    projectId: string,
    taskId: string,
    subId: string,
    completed: boolean
  ) => void;
  onAddSubtask: (projectId: string, taskId: string, title: string) => void;
  onDeleteSubtask: (projectId: string, taskId: string, subId: string) => void;
  onUpdateTask: (
    projectId: string,
    taskId: string,
    updates: Partial<Task>
  ) => void;
  onDeleteTask: (projectId: string, taskId: string) => void;
  onDuplicateTask: (projectId: string, taskId: string) => void;
  onChangeStatus: (
    projectId: string,
    taskId: string,
    newStatus: TaskStatus
  ) => void;
}> = ({
  task,
  progress,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onUpdateTask,
  onDeleteTask,
  onDuplicateTask,
  onChangeStatus,
}) => {
  return (
    <motion.div
      className="bg-secondary rounded-2xl p-4 dark:shadow-2xl shadow-sm border-l-4 border-l-blue-500"
      variants={itemVariants}
      whileHover={{ y: -2, transition: { duration: 0.1 } }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
              {task.projectName}
            </span>
            <PriorityBadge priority={task.priority} />
            {task.deadline && (
              <span
                className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                  isOverdue(task.deadline)
                    ? "bg-red-100 text-red-700"
                    : isToday(task.deadline)
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                <Calendar size={12} />
                {getDayLabel(task.deadline)}
              </span>
            )}
          </div>
          <h4 className="font-medium text-title mb-1">{task.title}</h4>
          {task.description && (
            <p className="text-sm text-subtitle mb-2">{task.description}</p>
          )}

          {/* Progress bar for subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-subtitle">
                  {task.subtasks.filter((s) => s.completed).length}/
                  {task.subtasks.length} subtasks
                </span>
                <span className="text-xs text-subtitle">{progress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-1.5">
                <motion.div
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <TodoStatusBadge status={task.status} />
          <motion.button
            onClick={() =>
              onChangeStatus(
                task.projectId,
                task._id,
                task.status === "todo"
                  ? "in-progress"
                  : task.status === "in-progress"
                  ? "done"
                  : "todo"
              )
            }
            className="p-1 hover:bg-secondary rounded"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <StatusIcon status={task.status} size={16} />
          </motion.button>
        </div>
      </div>

      {/* Subtasks */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="space-y-1">
          {task.subtasks.slice(0, 3).map((subtask) => (
            <motion.div
              key={subtask._id}
              className="flex items-center gap-2 text-sm"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.button
                onClick={() =>
                  onToggleSubtask(
                    task.projectId,
                    task._id,
                    subtask._id,
                    !subtask.completed
                  )
                }
                className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  subtask.completed
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-gray-300 hover:border-green-400"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {subtask.completed && <CheckCircle2 size={10} />}
              </motion.button>
              <span
                className={
                  subtask.completed
                    ? "line-through text-subtitle"
                    : "text-title"
                }
              >
                {subtask.title}
              </span>
            </motion.div>
          ))}
          {task.subtasks.length > 3 && (
            <span className="text-xs text-subtitle ml-6">
              +{task.subtasks.length - 3} more subtasks
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};