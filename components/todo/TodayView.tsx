import {
  getDayLabel,
  isThisWeek,
  isToday,
  itemVariants,
  Project,
  Task,
  TaskWithProject,
} from "@/app/dashboard/todo/page";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarDays,
  ClockIcon,
  CheckCircle2,
  Archive,
  Calendar,
} from "lucide-react";
import DashboardCard from "../dashboard/DashboardCard";
import { TodayTaskCard } from "./TodayTaskCard";
import { TodoStatusBadge } from "./TodoStatusBadge";
import { StatusIcon } from "./StatusIcon";
import { TaskStatus } from "@/lib/models/projectModel";
import { isOverdue, formatDate } from "@/lib/utils/todoUtils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Project Card Component for Today View
const TodayProjectCard: React.FC<{
  project: Project;
  progress: number;
  tasksStats: {
    total: number;
    completed: number;
    overdue: number;
    dueToday: number;
  };
  onSelectProject: (projectId: string) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
}> = ({ project, progress, tasksStats, onSelectProject, onUpdateProject }) => {
  return (
    <motion.div
      className="bg-secondary rounded-2xl p-4 dark:shadow-2xl shadow-sm border-l-4  border-l-purple-500 hover:shadow-md transition-all cursor-pointer"
      variants={itemVariants}
      whileHover={{ y: -2, transition: { duration: 0.1 } }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelectProject(project._id)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
              Project
            </span>
            <TodoStatusBadge status={project.status} />
            {project.deadline && (
              <span
                className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                  isOverdue(project.deadline)
                    ? "bg-red-100 text-red-700"
                    : isToday(project.deadline)
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                <Calendar size={12} />
                {getDayLabel(project.deadline)}
              </span>
            )}
          </div>

          <h4 className="font-medium text-title mb-1">{project.name}</h4>
          {project.description && (
            <p className="text-sm text-subtitle mb-2 line-clamp-1">
              {project.description}
            </p>
          )}

          {/* Mini Project Stats */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs text-blue-600">
              {tasksStats.total} tasks
            </span>
            <span className="text-xs text-green-600">
              {tasksStats.completed} done
            </span>
            {tasksStats.overdue > 0 && (
              <span className="text-xs text-red-600">
                {tasksStats.overdue} overdue
              </span>
            )}
            {tasksStats.dueToday > 0 && (
              <span className="text-xs text-orange-600">
                {tasksStats.dueToday} today
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-subtitle">Progress</span>
              <span className="text-xs text-subtitle">{progress}%</span>
            </div>
            <div className="w-full bg-background rounded-full h-1.5">
              <motion.div
                className="bg-purple-500 h-1.5 rounded-full transition-all"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {project.status !== "completed" && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateProject(project._id, {
                  status:
                    project.status === "pending" ? "in-progress" : "completed",
                });
              }}
              className="p-1 hover:bg-primary rounded"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title={
                project.status === "pending"
                  ? "Start Project"
                  : "Complete Project"
              }
            >
              <StatusIcon status={project.status} size={16} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const TodayView: React.FC<{
  projects: Project[];
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
  onSelectProject: (projectId: string) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  taskProgress: (task: Task) => number;
  projectProgress: (project: Project) => number;
}> = ({
  projects,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onUpdateTask,
  onDeleteTask,
  onDuplicateTask,
  onChangeStatus,
  onSelectProject,
  onUpdateProject,
  taskProgress,
  projectProgress,
}) => {
  // Get all tasks with project info
  const allTasks: TaskWithProject[] = projects.flatMap((project) =>
    project.tasks.map((task) => ({
      ...task,
      projectId: project._id,
      projectName: project.name,
    }))
  );

  // Filter tasks for today
  const todayTasks = allTasks.filter(
    (task) => task.deadline && isToday(task.deadline) && task.status !== "done"
  );

  // Filter tasks for upcoming (next 7 days, excluding today)
  const upcomingTasks = allTasks.filter(
    (task) =>
      task.deadline &&
      !isToday(task.deadline) &&
      isThisWeek(task.deadline) &&
      task.status !== "done"
  );

  // Filter overdue tasks
  const overdueTasks = allTasks.filter(
    (task) =>
      task.deadline && isOverdue(task.deadline) && task.status !== "done"
  );

  // Project filtering functions
  const getProjectStats = (project: Project) => {
    const total = project.tasks.length;
    const completed = project.tasks.filter((t) => t.status === "done").length;
    const overdue = project.tasks.filter(
      (t) => t.deadline && isOverdue(t.deadline) && t.status !== "done"
    ).length;
    const dueToday = project.tasks.filter(
      (t) => t.deadline && isToday(t.deadline) && t.status !== "done"
    ).length;

    return { total, completed, overdue, dueToday };
  };

  // Filter projects by urgency - projects due today or with urgent tasks
  const urgentProjects = projects.filter((project) => {
    const isDueToday =
      project.deadline &&
      isToday(project.deadline) &&
      project.status !== "completed";
    const isOverdueProject =
      project.deadline &&
      isOverdue(project.deadline) &&
      project.status !== "completed";
    const stats = getProjectStats(project);
    const hasUrgentTasks =
      (stats.overdue > 0 || stats.dueToday > 0) &&
      project.status !== "completed";

    return isDueToday || isOverdueProject || hasUrgentTasks;
  });

  // Upcoming projects this week (excluding urgent ones)
  const upcomingProjects = projects
    .filter(
      (project) =>
        project.deadline &&
        !isToday(project.deadline) &&
        !isOverdue(project.deadline) &&
        isThisWeek(project.deadline) &&
        project.status !== "completed"
    )
    .filter((project) => !urgentProjects.includes(project));

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Stats Overview */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        variants={containerVariants}
      >
        {[
          {
            label: "Overdue",
            amount: overdueTasks.length.toString(),
            Icon: AlertTriangle,
            color: "red",
          },
          {
            label: "Today",
            amount: todayTasks.length.toString(),
            Icon: CalendarDays,
            color: "blue",
          },
          {
            label: "This Week",
            amount: upcomingTasks.length.toString(),
            Icon: ClockIcon,
            color: "yellow",
          },
          {
            label: "Total Tasks",
            amount: allTasks.length.toString(),
            Icon: CheckCircle2,
            color: "green",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <DashboardCard
              label={stat.label}
              amount={stat.amount}
              Icon={stat.Icon}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Urgent Projects Section */}
      {urgentProjects.length > 0 && (
        <motion.div
          className="bg-primary p-6 rounded-2xl shadow-sm border border-secondary"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2 mb-4">
            <Archive className="text-purple-600" size={20} />
            <h3 className="text-lg font-semibold text-purple-800">
              Projects Needing Attention
            </h3>
            <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              {urgentProjects.length}
            </span>
          </div>
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            variants={containerVariants}
          >
            {urgentProjects.map((project) => (
              <TodayProjectCard
                key={project._id}
                project={project}
                progress={projectProgress(project)}
                tasksStats={getProjectStats(project)}
                onSelectProject={onSelectProject}
                onUpdateProject={onUpdateProject}
              />
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* Upcoming Projects This Week */}
      {upcomingProjects.length > 0 && (
        <motion.div
          className="bg-primary p-6 rounded-2xl shadow-sm border border-secondary"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2 mb-4">
            <ClockIcon className="text-indigo-600" size={20} />
            <h3 className="text-lg font-semibold text-indigo-800">
              Upcoming Projects This Week
            </h3>
            <span className="text-sm bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
              {upcomingProjects.length}
            </span>
          </div>
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            variants={containerVariants}
          >
            {upcomingProjects
              .sort(
                (a, b) =>
                  new Date(a.deadline!).getTime() -
                  new Date(b.deadline!).getTime()
              )
              .map((project) => (
                <TodayProjectCard
                  key={project._id}
                  project={project}
                  progress={projectProgress(project)}
                  tasksStats={getProjectStats(project)}
                  onSelectProject={onSelectProject}
                  onUpdateProject={onUpdateProject}
                />
              ))}
          </motion.div>
        </motion.div>
      )}

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <motion.div
          className="bg-primary rounded-xl p-6 shadow-sm"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-red-600" size={20} />
            <h3 className="text-lg font-semibold text-red-800">
              Overdue Tasks
            </h3>
            <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded-full">
              {overdueTasks.length}
            </span>
          </div>
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            variants={containerVariants}
          >
            {overdueTasks.map((task) => (
              <TodayTaskCard
                key={`${task.projectId}-${task._id}`}
                task={task}
                progress={taskProgress(task)}
                onToggleSubtask={onToggleSubtask}
                onAddSubtask={onAddSubtask}
                onDeleteSubtask={onDeleteSubtask}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                onDuplicateTask={onDuplicateTask}
                onChangeStatus={onChangeStatus}
              />
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* Today's Tasks */}
      <motion.div
        className="bg-primary p-6 rounded-2xl shadow-sm border border-secondary "
        variants={itemVariants}
      >
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold text-blue-800">
            Today&apos;s Tasks
          </h3>
          <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {todayTasks.length}
          </span>
        </div>
        {todayTasks.length === 0 ? (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CalendarDays className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-title mb-2">No tasks due today</p>
            <p className="text-sm text-gray-500">
              Great job staying on top of your work!
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            variants={containerVariants}
          >
            {todayTasks.map((task) => (
              <TodayTaskCard
                key={`${task.projectId}-${task._id}`}
                task={task}
                progress={taskProgress(task)}
                onToggleSubtask={onToggleSubtask}
                onAddSubtask={onAddSubtask}
                onDeleteSubtask={onDeleteSubtask}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                onDuplicateTask={onDuplicateTask}
                onChangeStatus={onChangeStatus}
              />
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Upcoming Tasks */}
      <motion.div
        className="bg-primary p-6 rounded-2xl shadow-sm border border-secondary "
        variants={itemVariants}
      >
        <div className="flex items-center gap-2 mb-4">
          <ClockIcon className="text-btn-complementary" size={20} />
          <h3 className="text-lg font-semibold text-btn-complementary">
            Upcoming Tasks This Week
          </h3>
          <span className="text-sm bg-yellow-100 text-btn-complementary px-2 py-1 rounded-full">
            {upcomingTasks.length}
          </span>
        </div>
        {upcomingTasks.length === 0 ? (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ClockIcon className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-title mb-2">No upcoming tasks this week</p>
            <p className="text-sm text-gray-500">
              Time to plan ahead or take a well-deserved break!
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            variants={containerVariants}
          >
            {upcomingTasks
              .sort(
                (a, b) =>
                  new Date(a.deadline!).getTime() -
                  new Date(b.deadline!).getTime()
              )
              .map((task) => (
                <TodayTaskCard
                  key={`${task.projectId}-${task._id}`}
                  task={task}
                  progress={taskProgress(task)}
                  onToggleSubtask={onToggleSubtask}
                  onAddSubtask={onAddSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                  onUpdateTask={onUpdateTask}
                  onDeleteTask={onDeleteTask}
                  onDuplicateTask={onDuplicateTask}
                  onChangeStatus={onChangeStatus}
                />
              ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};
