import { Task } from "@/app/dashboard/todo/page";

export const formatDate = (date?: Date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString();
};

export const isOverdue = (deadline?: Date | string): boolean => {
  if (!deadline) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsed = new Date(deadline);
  parsed.setHours(0, 0, 0, 0);

  return parsed < today; 
};


export const getDaysUntilDeadline = (deadline?: Date) => {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 3600 * 24));
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isUrgent = (task: Task): boolean => {
  if (!task.deadline) return false;

  return (
    (isToday(task.deadline) || isOverdue(task.deadline)) &&
    (task.priority === "high" || task.priority === "medium")
  );
};
// Add these functions to your lib/utils/todoUtils.ts file

/**
 * Check if a date is today
 */
export const isDueToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if a date is within the current week (Monday to Sunday)
 */
export const isDueThisWeek = (date: Date): boolean => {
  const today = new Date();
  const startOfWeek = new Date(today);
  const endOfWeek = new Date(today);

  // Set to start of week (Monday)
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  // Set to end of week (Sunday)
  endOfWeek.setDate(diff + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return date >= startOfWeek && date <= endOfWeek;
};

