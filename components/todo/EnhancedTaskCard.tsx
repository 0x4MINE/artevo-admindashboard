import { TaskStatus } from "@/lib/models/projectModel";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreVertical,
  Edit3,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Users,
  Calendar,
  Move,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { PriorityBadge } from "./PriorityBadge";
import { StatusIcon } from "./StatusIcon";
import { TodoStatusBadge } from "./TodoStatusBadge";
import { Task } from "@/app/dashboard/todo/page";
import {
  formatDate,
  getDaysUntilDeadline,
  isOverdue,
} from "@/lib/utils/todoUtils";

export function EnhancedTaskCard({
  task,
  projectId,
  progress,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onUpdateTask,
  onDeleteTask,
  onDuplicateTask,
  onChangeStatus,
  isEditing,
  onStartEdit,
  onStopEdit,
}: {
  task: Task;
  projectId: string;
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
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
}) {
  const [showSubInput, setShowSubInput] = useState(false);
  const [subTitle, setSubTitle] = useState("");
  const [showTaskMenu, setShowTaskMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const taskMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const daysUntilDeadline = getDaysUntilDeadline(task.deadline);
  const overdue = isOverdue(task.deadline);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        taskMenuRef.current &&
        !taskMenuRef.current.contains(e.target as Node)
      ) {
        setShowTaskMenu(false);
      }
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(e.target as Node)
      ) {
        setShowStatusMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.div
      className={`relative bg-primary text-title rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow group ${
        showTaskMenu || showStatusMenu ? "z-50" : "z-10"
      }`}
      whileHover={{ scale: 1.02 }}
      style={{
        transformStyle: "preserve-3d",
        // Ensure the card creates its own stacking context when menus are open
        isolation: showTaskMenu || showStatusMenu ? "isolate" : "auto",
      }}
    >
      {/* Task Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2 relative z-20">
              <input
                defaultValue={task.title}
                onBlur={(e) => {
                  onUpdateTask(projectId, task._id, { title: e.target.value });
                  onStopEdit();
                }}
                className="w-full font-semibold border px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <textarea
                defaultValue={task.description}
                onBlur={(e) =>
                  onUpdateTask(projectId, task._id, {
                    description: e.target.value,
                  })
                }
                className="w-full text-sm border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add description..."
                rows={2}
              />
            </div>
          ) : (
            <>
              <h4 className="font-semibold leading-tight">{task.title}</h4>
              {task.description && (
                <p className="text-sm text-subtitle mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1 relative z-20">
          <PriorityBadge priority={task.priority} />
          <div className="relative" ref={taskMenuRef}>
            <button
              aria-label="Open task menu"
              onClick={(e) => {
                e.stopPropagation();
                setShowTaskMenu(!showTaskMenu);
                // Close other menu if open
                if (showStatusMenu) setShowStatusMenu(false);
              }}
              className="p-1 rounded hover:bg-gray-100 transition-colors relative z-10"
            >
              <MoreVertical size={14} />
            </button>

            <AnimatePresence>
              {showTaskMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border py-1 z-[9999] min-w-[120px]"
                  style={{
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                  }}
                >
                  <button
                    onClick={() => {
                      onStartEdit();
                      setShowTaskMenu(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 w-full text-left transition-colors"
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      onDuplicateTask(projectId, task._id);
                      setShowTaskMenu(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 w-full text-left transition-colors"
                  >
                    <Plus size={12} /> Duplicate
                  </button>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={() => {
                      onDeleteTask(projectId, task._id);
                      setShowTaskMenu(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 w-full text-left text-red-600 transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Subtasks */}
      <ul className="space-y-2 mb-3">
        {task.subtasks.map((subtask, index) => {
          const subtaskKey =
            subtask._id ||
            `temp-${task._id}-${index}-${
              subtask.title?.slice(0, 10) || "untitled"
            }`;

          return (
            <li
              key={subtaskKey}
              className="flex items-center gap-2 text-sm group/subtask"
            >
              <button
                aria-label={`Toggle ${subtask.title}`}
                onClick={() =>
                  onToggleSubtask(
                    projectId,
                    task._id,
                    subtask._id,
                    !subtask.completed
                  )
                }
                className="flex-shrink-0 hover:scale-110 transition-transform"
              >
                {subtask.completed ? (
                  <CheckCircle2 className="text-green-500" size={16} />
                ) : (
                  <Circle
                    className="text-gray-400 hover:text-gray-600"
                    size={16}
                  />
                )}
              </button>
              <span
                className={`flex-1 ${
                  subtask.completed
                    ? "line-through text-gray-400"
                    : "text-gray-700"
                }`}
              >
                {subtask.title}
              </span>
              <button
                aria-label={`Delete ${subtask.title}`}
                onClick={() =>
                  onDeleteSubtask(projectId, task._id, subtask._id)
                }
                className="ml-auto text-gray-400 hover:text-red-500 opacity-0 group-hover/subtask:opacity-100 transition-all duration-200 hover:scale-110"
              >
                <Trash2 size={12} />
              </button>
            </li>
          );
        })}
      </ul>

      {/* Progress */}
      {task.subtasks.length > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{progress}% complete</span>
            <span>
              {task.subtasks.filter((s) => s.completed).length}/
              {task.subtasks.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-btn-primary to-btn-secondary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Task Meta */}
      <div className="flex items-center gap-2 mb-3 text-xs flex-wrap">
        {task.assignee && (
          <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded">
            <Users size={12} />
            <span>{task.assignee}</span>
          </div>
        )}

        {task.deadline && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded ${
              overdue
                ? "bg-red-100 text-red-700"
                : daysUntilDeadline !== null && daysUntilDeadline <= 3
                ? "bg-orange-100 text-orange-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            <Calendar size={12} />
            <span>{overdue ? "Overdue" : formatDate(task.deadline)}</span>
          </div>
        )}

        {/* Status changer */}
        <div className="relative ml-auto" ref={statusMenuRef}>
          <button
            aria-label="Change status"
            onClick={(e) => {
              e.stopPropagation();
              setShowStatusMenu(!showStatusMenu);
              // Close other menu if open
              if (showTaskMenu) setShowTaskMenu(false);
            }}
            className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors relative z-10"
          >
            <Move size={12} />
            <TodoStatusBadge status={task.status} />
          </button>

          <AnimatePresence>
            {showStatusMenu && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute z-[9999] right-0 top-full mt-1 bg-white rounded-lg shadow-lg border py-1 min-w-[120px]"
                style={{
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                }}
              >
                {(["todo", "in-progress", "done"] as TaskStatus[]).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => {
                        onChangeStatus(projectId, task._id, status);
                        setShowStatusMenu(false);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 w-full text-left transition-colors capitalize ${
                        task.status === status ? "bg-blue-50 text-blue-700" : ""
                      }`}
                    >
                      <StatusIcon status={status} />
                      {status.replace("-", " ")}
                    </button>
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Subtask */}
      {showSubInput ? (
        <div className="mt-3 flex items-center gap-2 relative z-20">
          <input
            type="text"
            value={subTitle}
            onChange={(e) => setSubTitle(e.target.value)}
            placeholder="Subtask title"
            className="flex-1 w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && subTitle.trim()) {
                onAddSubtask(projectId, task._id, subTitle);
                setSubTitle("");
                setShowSubInput(false);
                toast.success("Subtask Added successfully!");
              }
              if (e.key === "Escape") {
                setShowSubInput(false);
                setSubTitle("");
              }
            }}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowSubInput(true)}
          className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors hover:bg-blue-50 px-2 py-1 rounded"
        >
          <Plus size={14} /> Add subtask
        </button>
      )}
    </motion.div>
  );
}
