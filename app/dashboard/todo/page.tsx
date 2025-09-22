"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Circle,
  Calendar,
  Filter,
  Archive,
  CalendarDays,
  ClockIcon,
} from "lucide-react";

// Import server actions
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  createTask,
  updateTask,
  deleteTask,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  toggleSubtask,
} from "@/lib/actions/todoActions";
import ContentNavbar from "@/components/layout/ContentNavbar";
import NewProjectPopup from "@/components/popups/todo/NewProjectPopup";
import { toast, Toaster } from "sonner";
import AddTaskPopup from "@/components/popups/todo/AddTaskPopup";
import { EmptyState } from "@/components/todo/EmptyState";
import { ProjectActions } from "@/components/todo/ProjectActions";
import { FilterSection } from "@/components/todo/FilterSection";
import { TodoStatusBadge } from "@/components/todo/TodoStatusBadge";
import { StatusIcon } from "@/components/todo/StatusIcon";
import { PriorityBadge } from "@/components/todo/PriorityBadge";
import { ProjectEditForm } from "@/components/todo/ProjectEditForm";
import {
  formatDate,
  getDaysUntilDeadline,
  isOverdue,
} from "@/lib/utils/todoUtils";
import { EnhancedTaskCard } from "@/components/todo/EnhancedTaskCard";
import ViewModeSwitcher from "@/components/todo/ViewMode";
import DashboardCard from "@/components/dashboard/DashboardCard";
import Loader from "@/components/layout/Loader";
import { TodayView } from "@/components/todo/TodayView";

/* -------------------------
   Animation Variants
   -------------------------*/

export const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

const slideInVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

const scaleVariants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

const progressBarVariants = {
  hidden: { width: "0%" },
  visible: {
    width: "100%",
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

/* -------------------------
   Types
   -------------------------*/
type ProjectStatus = "pending" | "in-progress" | "completed";
type TaskStatus = "todo" | "in-progress" | "done";
type TaskPriority = "low" | "medium" | "high";
type ViewMode = "projects" | "today";

interface Subtask {
  _id: string;
  title: string;
  completed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  subtasks: Subtask[];
  deadline?: Date;
  tags?: string[];
  assignee?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  tasks: Task[];
  deadline?: Date;
  status: ProjectStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaskWithProject extends Task {
  projectId: string;
  projectName: string;
}

type FilterState = {
  search: string;
  priority: string[];
  status: string[];
  assignee: string[];
  showCompleted: boolean;
};

/* -------------------------
   Utility Functions for Date/Time
   -------------------------*/
export const isToday = (date: Date): boolean => {
  const today = new Date();
  const taskDate = new Date(date);
  return (
    taskDate.getDate() === today.getDate() &&
    taskDate.getMonth() === today.getMonth() &&
    taskDate.getFullYear() === today.getFullYear()
  );
};

export const isThisWeek = (date: Date): boolean => {
  const today = new Date();
  const taskDate = new Date(date);
  const diffTime = taskDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
};

export const getDayLabel = (date: Date): string => {
  if (isToday(date)) return "Today";

  const today = new Date();
  const taskDate = new Date(date);
  const diffTime = taskDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 0) return "Overdue";
  if (diffDays <= 7) return `In ${diffDays} days`;

  return formatDate(date);
};

/* -------------------------
   Main Component
   -------------------------*/
export default function EnhancedTodoPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    priority: [],
    status: [],
    assignee: [],
    showCompleted: true,
  });
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // POPUPS
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Load projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const projectsData = await getProjects();
        setProjects(projectsData);

        // Select first project if we're in projects view mode and there are projects
        if (projectsData.length > 0 && viewMode === "projects") {
          setSelectedProject(projectsData[0]._id);
        }
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === "projects" && projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]._id);
    }

    // When switching away from projects view, clear the selected project
    if (viewMode !== "projects") {
      setSelectedProject(null);
    }
  }, [viewMode, projects, selectedProject]);

  const handleViewModeChange = (newViewMode: ViewMode) => {
    setViewMode(newViewMode);

    if (newViewMode === "today") {
      setSelectedProject(null);
    }
  };
  /* -------------------------
     Project CRUD Operations
     -------------------------*/
  const addProject = async (name: string, description?: string) => {
    if (!name.trim()) return;

    try {
      setIsLoading(true);
      const newProject = await createProject({
        name: name.trim(),
        description: description?.trim(),
        status: "pending",
        tasks: [],
      });

      setProjects((prev) => [newProject, ...prev]);
      if (viewMode === "projects") {
        setSelectedProject(newProject._id);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  const updateProjectData = async (id: string, updates: Partial<Project>) => {
    try {
      setIsLoading(true);
      const updatedProject = await updateProject(id, updates);

      setProjects((prev) =>
        prev.map((p) => (p._id === id ? { ...updatedProject } : p))
      );
    } catch (error) {
      console.error("Failed to update project:", error);
      alert("Failed to update project");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProjectData = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      setIsLoading(true);
      await deleteProject(id);

      setProjects((prev) => prev.filter((p) => p._id !== id));
      if (selectedProject === id) {
        setSelectedProject(projects.find((p) => p._id !== id)?._id || null);
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("Failed to delete project");
    } finally {
      setIsLoading(false);
    }
  };

  const archiveProject = async (id: string) => {
    try {
      setIsLoading(true);
      await updateProject(id, { status: "completed" });

      // Refresh projects
      const projectsData = await getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error("Failed to archive project:", error);
      alert("Failed to archive project");
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------------
     Task CRUD Operations
     -------------------------*/
  const updateTaskData = async (
    projectId: string,
    taskId: string,
    updates: Partial<Task>
  ) => {
    setProjects((prev) =>
      prev.map((p) =>
        p._id === projectId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t._id === taskId ? { ...t, ...updates } : t
              ),
            }
          : p
      )
    );

    try {
      await updateTask(taskId, updates);
      toast.success("Task Updated");
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error("Failed to update task");

      try {
        const projectsData = await getProjects();
        setProjects(projectsData);
      } catch (refetchError) {
        console.error("Failed to refetch projects after error:", refetchError);
      }
    }
  };

  const deleteTaskData = async (projectId: string, taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      setIsLoading(true);
      await deleteTask(taskId);

      setProjects((prev) =>
        prev.map((p) =>
          p._id === projectId
            ? { ...p, tasks: p.tasks.filter((t) => t._id !== taskId) }
            : p
        )
      );
    } catch (error) {
      console.error("Failed to delete task:", error);
      alert("Failed to delete task");
    } finally {
      setIsLoading(false);
    }
  };

  const duplicateTask = async (projectId: string, taskId: string) => {
    const project = projects.find((p) => p._id === projectId);
    const task = project?.tasks.find((t) => t._id === taskId);

    if (task) {
      try {
        setIsLoading(true);
        const duplicatedTask = await createTask(projectId, {
          ...task,
          title: `${task.title} (Copy)`,
          status: "todo",
        });

        setProjects((prev) =>
          prev.map((p) =>
            p._id === projectId
              ? { ...p, tasks: [duplicatedTask, ...p.tasks] }
              : p
          )
        );
      } catch (error) {
        console.error("Failed to duplicate task:", error);
        alert("Failed to duplicate task");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const changeTaskStatus = async (
    projectId: string,
    taskId: string,
    newStatus: TaskStatus
  ) => {
    try {
      setIsLoading(true);
      await updateTask(taskId, { status: newStatus });

      setProjects((prev) =>
        prev.map((p) =>
          p._id === projectId
            ? {
                ...p,
                tasks: p.tasks.map((t) =>
                  t._id === taskId ? { ...t, status: newStatus } : t
                ),
              }
            : p
        )
      );
    } catch (error) {
      console.error("Failed to update task status:", error);
      alert("Failed to update task status");
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------------
     Subtask Operations
     -------------------------*/
  const toggleSubtaskStatus = async (
    projectId: string,
    taskId: string,
    subId: string,
    completed: boolean
  ) => {
    try {
      setIsLoading(true);
      await toggleSubtask(subId, completed);

      setProjects((prev) =>
        prev.map((p) =>
          p._id === projectId
            ? {
                ...p,
                tasks: p.tasks.map((t) =>
                  t._id === taskId
                    ? {
                        ...t,
                        subtasks: t.subtasks.map((s) =>
                          s._id === subId ? { ...s, completed } : s
                        ),
                      }
                    : t
                ),
              }
            : p
        )
      );
    } catch (error) {
      console.error("Failed to toggle subtask:", error);
      alert("Failed to toggle subtask");
    } finally {
      setIsLoading(false);
    }
  };

  const addSubtask = async (
    projectId: string,
    taskId: string,
    title: string
  ) => {
    if (!title.trim()) return;

    try {
      setIsLoading(true);
      const newSubtask = await createSubtask(taskId, {
        title: title.trim(),
        completed: false,
      });

      setProjects((prev) =>
        prev.map((p) =>
          p._id === projectId
            ? {
                ...p,
                tasks: p.tasks.map((t) =>
                  t._id === taskId
                    ? { ...t, subtasks: [...t.subtasks, newSubtask] }
                    : t
                ),
              }
            : p
        )
      );
    } catch (error) {
      console.error("Failed to create subtask:", error);
      alert("Failed to create subtask");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSubtaskData = async (
    projectId: string,
    taskId: string,
    subId: string
  ) => {
    try {
      setIsLoading(true);
      await deleteSubtask(subId);

      setProjects((prev) =>
        prev.map((p) =>
          p._id === projectId
            ? {
                ...p,
                tasks: p.tasks.map((t) =>
                  t._id === taskId
                    ? {
                        ...t,
                        subtasks: t.subtasks.filter((s) => s._id !== subId),
                      }
                    : t
                ),
              }
            : p
        )
      );
    } catch (error) {
      console.error("Failed to delete subtask:", error);
      alert("Failed to delete subtask");
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------------
     Filter Logic
     -------------------------*/
  const getFilteredTasks = (tasks: Task[]) => {
    return tasks.filter((task) => {
      const matchesSearch =
        !filters.search ||
        task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.description?.toLowerCase().includes(filters.search.toLowerCase());

      const matchesPriority =
        filters.priority.length === 0 ||
        filters.priority.includes(task.priority);
      const matchesStatus =
        filters.status.length === 0 || filters.status.includes(task.status);
      const matchesAssignee =
        filters.assignee.length === 0 ||
        (task.assignee && filters.assignee.includes(task.assignee));

      const matchesCompleted = filters.showCompleted || task.status !== "done";

      return (
        matchesSearch &&
        matchesPriority &&
        matchesStatus &&
        matchesAssignee &&
        matchesCompleted
      );
    });
  };

  /* -------------------------
     Progress Calculation
     -------------------------*/
  const taskProgress = (task: Task) => {
    if (!task.subtasks || task.subtasks.length === 0)
      return task.status === "done" ? 100 : 0;
    const done = task.subtasks.filter((s) => s.completed).length;
    return Math.round((done / task.subtasks.length) * 100);
  };

  const projectProgress = (project: Project) => {
    if (project.tasks.length === 0) return 0;
    const completedTasks = project.tasks.filter(
      (t) => t.status === "done"
    ).length;
    return Math.round((completedTasks / project.tasks.length) * 100);
  };

  // Get current project
  const currentProject = projects.find((p) => p._id === selectedProject);
  const filteredTasks = currentProject
    ? getFilteredTasks(currentProject.tasks)
    : [];

  useEffect(() => {
    if (currentProject) {
      console.log(
        "Current project tasks:",
        currentProject.tasks.map((task) => ({
          id: task._id,
          title: task.title,
          subtasksCount: task.subtasks?.length || 0,
          subtasks: task.subtasks,
        }))
      );
    }
  }, [currentProject]);

  /* -------------------------
     Render
     -------------------------*/
  if (isLoading && projects.length === 0) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Toaster richColors />
      <header className="bg-background shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <motion.span
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {projects.length} Projects
              </motion.span>
              {viewMode === "projects" && currentProject && (
                <motion.span
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  {projectProgress(currentProject)}% Complete
                </motion.span>
              )}
            </div>
          </div>
          <div className="flex-1 max-w-sm">
            <motion.input
              type="text"
              className="w-full bg-primary text-[#B0B0B0] py-2 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              initial={{ width: "0%", opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex items-center gap-3 justify-evenly">
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg border transition-colors ${
                showFilters
                  ? "bg-transparent text-btn-secondary"
                  : "bg-transparent text-title"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Filter size={18} />
            </motion.button>
            <motion.button
              onClick={() => setIsProjectOpen(true)}
              className="py-2 px-4 bg-btn-primary text-white rounded-[10px] font-bold flex items-center justify-center gap-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="font-bold text-2xl">+</span> New Project
            </motion.button>
            <NewProjectPopup
              //@ts-expect-error
              setProjects={setProjects}
              setSelectedProject={setSelectedProject}
              isOpen={isProjectOpen}
              onClose={() => {
                setIsProjectOpen(false);
                setViewMode("projects");
              }}
            />
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-4 mb-4 rounded-2xl">
          <motion.div
            className="flex items-center bg-secondary rounded-2xl cursor-pointer"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button
              onClick={() => handleViewModeChange("today")}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl cursor-pointer transition-all ${
                viewMode === "today"
                  ? "bg-btn-primary text-white shadow-sm"
                  : "text-title "
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <CalendarDays size={16} />
              <span className="font-medium">Today & Upcoming</span>
            </motion.button>
            <motion.button
              onClick={() => handleViewModeChange("projects")}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl cursor-pointer transition-all ${
                viewMode === "projects"
                  ? "bg-btn-primary text-white shadow-sm"
                  : "text-title "
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Archive size={16} />
              <span className="font-medium">Projects</span>
            </motion.button>
          </motion.div>
        </div>

        {/* Project Tabs - Only show in projects view */}
        {viewMode === "projects" && (
          <motion.div
            className="flex items-center gap-2 overflow-x-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {projects.map((project, index) => (
              <motion.button
                key={project._id}
                onClick={() => setSelectedProject(project._id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap  ${
                  selectedProject === project._id
                    ? "bg-secondary text-title shadow-sm"
                    : "text-title hover:bg-secondary"
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                whileHover={{ y: -1 }}
              >
                <span className="font-medium">{project.name}</span>
                <span className="text-xs bg-background text-title px-2 py-1 rounded-full">
                  {project.tasks.length}
                </span>
                {project.status === "completed" && <Archive size={14} />}
              </motion.button>
            ))}
          </motion.div>
        )}
      </header>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-background shadow-sm overflow-hidden"
          >
            <div className="p-6">
              <motion.div
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <FilterSection
                  title="Priority"
                  options={["low", "medium", "high"]}
                  selected={filters.priority}
                  onChange={(priority) =>
                    setFilters((prev) => ({ ...prev, priority }))
                  }
                />
                <FilterSection
                  title="Status"
                  options={["todo", "in-progress", "done"]}
                  selected={filters.status}
                  onChange={(status) =>
                    setFilters((prev) => ({ ...prev, status }))
                  }
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Options
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.showCompleted}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          showCompleted: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Show completed tasks</span>
                  </label>
                </div>
                <motion.button
                  onClick={() =>
                    setFilters({
                      search: "",
                      priority: [],
                      status: [],
                      assignee: [],
                      showCompleted: true,
                    })
                  }
                  className="text-sm text-blue-600 hover:text-blue-800 self-end"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Clear all filters
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="p-6">
        <AnimatePresence mode="wait">
          {viewMode === "today" ? (
            <motion.div
              key="today-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TodayView
                projects={projects}
                onToggleSubtask={toggleSubtaskStatus}
                onAddSubtask={addSubtask}
                onDeleteSubtask={deleteSubtaskData}
                onUpdateTask={updateTaskData}
                onDeleteTask={deleteTaskData}
                onDuplicateTask={duplicateTask}
                onChangeStatus={changeTaskStatus}
                onSelectProject={(projectId) => {
                  setSelectedProject(projectId);
                  setViewMode("projects"); 
                }}
                onUpdateProject={updateProjectData}
                taskProgress={taskProgress}
                projectProgress={projectProgress}
              />
            </motion.div>
          ) : currentProject ? (
            <motion.div
              key="projects-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Project Header */}
              <motion.div
                className="bg-primary rounded-2xl p-6 shadow-sm"
                variants={itemVariants}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingProject === currentProject._id ? (
                      <ProjectEditForm
                        project={currentProject}
                        onSave={(updates) => {
                          updateProjectData(currentProject._id, updates);
                          setEditingProject(null);
                        }}
                        onCancel={() => setEditingProject(null)}
                      />
                    ) : (
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-bold text-title">
                            {currentProject.name}
                          </h2>
                          <TodoStatusBadge status={currentProject.status} />
                          {currentProject.deadline && (
                            <motion.div
                              className={`flex items-center gap-1 text-sm px-2 py-1 rounded ${
                                isOverdue(currentProject.deadline)
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Calendar size={14} />
                              {formatDate(currentProject.deadline)}
                            </motion.div>
                          )}
                        </div>
                        {currentProject.description && (
                          <p className="text-gray-600 mb-4">
                            {currentProject.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <motion.div
                              className="bg-gradient-to-r from-btn-primary to-btn-secondary h-2 rounded-full transition-all"
                              initial={{ width: "0%" }}
                              animate={{
                                width: `${projectProgress(currentProject)}%`,
                              }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {projectProgress(currentProject)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <ProjectActions
                    //@ts-expect-error
                    project={currentProject}
                    onEdit={() => setEditingProject(currentProject._id)}
                    onArchive={() => archiveProject(currentProject._id)}
                    onDelete={() => deleteProjectData(currentProject._id)}
                  />
                </div>
              </motion.div>

              {/* Task Board */}
              <motion.div
                className="bg-primary rounded-2xl p-6 shadow-sm"
                variants={itemVariants}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-title">Tasks</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-subtitle">
                      {filteredTasks.length} of {currentProject.tasks.length}{" "}
                      tasks
                    </span>

                    <motion.button
                      onClick={() => setIsAddTaskOpen(true)}
                      className="py-1 px-2 bg-btn-primary text-white text-sm rounded-[10px] font-bold flex items-center justify-center gap-3"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="font-bold text-lg">+</span>Add Task
                    </motion.button>
                    <AddTaskPopup
                      //@ts-expect-error
                      currentProject={currentProject}
                      setProjects={setProjects}
                      isOpen={isAddTaskOpen}
                      onClose={() => setIsAddTaskOpen(false)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {(["todo", "in-progress", "done"] as TaskStatus[]).map(
                    (status) => {
                      const columnTasks = filteredTasks.filter(
                        (t) => t.status === status
                      );

                      return (
                        <motion.div
                          key={status}
                          className="bg-secondary rounded-xl p-4 min-h-[400px]"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-title capitalize flex items-center gap-2">
                              <StatusIcon status={status} />
                              {status.replace("-", " ")}
                            </h4>
                            <span className="text-xs bg-secondary px-2 py-1 rounded-full border font-medium">
                              {columnTasks.length}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {columnTasks.length === 0 ? (
                              <motion.div
                                className="text-center py-8 text-title"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                              >
                                <Circle
                                  className="mx-auto mb-2 opacity-50"
                                  size={32}
                                />
                                <p className="text-sm">No tasks yet</p>
                              </motion.div>
                            ) : (
                              columnTasks.map((task, index) => (
                                <EnhancedTaskCard
                                  key={task._id}
                                  task={task}
                                  projectId={currentProject._id}
                                  progress={taskProgress(task)}
                                  onToggleSubtask={toggleSubtaskStatus}
                                  onAddSubtask={addSubtask}
                                  onDeleteSubtask={deleteSubtaskData}
                                  onUpdateTask={updateTaskData}
                                  onDeleteTask={deleteTaskData}
                                  onDuplicateTask={duplicateTask}
                                  onChangeStatus={changeTaskStatus}
                                  isEditing={editingTask === task._id}
                                  onStartEdit={() => setEditingTask(task._id)}
                                  onStopEdit={() => setEditingTask(null)}
                                />
                              ))
                            )}
                          </div>
                        </motion.div>
                      );
                    }
                  )}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <EmptyState
                onCreateProject={() => addProject("My New Project")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
