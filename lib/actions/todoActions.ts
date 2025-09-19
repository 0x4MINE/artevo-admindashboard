"use server";

import { revalidatePath } from "next/cache";
import { Project, Task, Subtask } from "@/lib/models/projectModel";
import connectDB from "../mongoConnect";

// Project CRUD Operations
export async function getProjects() {
  try {
    await connectDB();
    const projects = await Project.find()
      .populate({
        path: "tasks",
        populate: {
          path: "subtasks",
        },
      })
      .sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(projects));
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw new Error("Failed to fetch projects");
  }
}

export async function createProject(data: any) {
  try {
    await connectDB();
    const project = new Project(data);
    await project.save();
    return JSON.parse(JSON.stringify(project));
  } catch (error) {
    console.error("Error creating project:", error);
    throw new Error("Failed to create project");
  }
}

export async function updateProject(id: string, data: any) {
  try {
    await connectDB();
    const project = await Project.findByIdAndUpdate(id, data, { new: true });
    revalidatePath("/");
    return JSON.parse(JSON.stringify(project));
  } catch (error) {
    console.error("Error updating project:", error);
    throw new Error("Failed to update project");
  }
}

export async function deleteProject(id: string) {
  try {
    await connectDB();

    // First delete all tasks and subtasks associated with this project
    const tasks = await Task.find({ projectId: id });
    for (const task of tasks) {
      await Subtask.deleteMany({ taskId: task._id });
    }
    await Task.deleteMany({ projectId: id });

    // Then delete the project
    await Project.findByIdAndDelete(id);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    throw new Error("Failed to delete project");
  }
}

// Task CRUD Operations
export async function createTask(projectId: string, data: any) {
  try {
    await connectDB();
    const task = new Task({ ...data, projectId });
    await task.save();

    // Add task to project's tasks array
    await Project.findByIdAndUpdate(
      projectId,
      { $push: { tasks: task._id } },
      { new: true }
    );

    revalidatePath("/");
    return JSON.parse(JSON.stringify(task));
  } catch (error) {
    console.error("Error creating task:", error);
    throw new Error("Failed to create task");
  }
}

export async function updateTask(id: string, data: any) {
  try {
    await connectDB();
    const task = await Task.findByIdAndUpdate(id, data, { new: true });
    revalidatePath("/");
    return JSON.parse(JSON.stringify(task));
  } catch (error) {
    console.error("Error updating task:", error);
    throw new Error("Failed to update task");
  }
}

export async function deleteTask(id: string) {
  try {
    await connectDB();

    // First delete all subtasks associated with this task
    await Subtask.deleteMany({ taskId: id });

    // Then delete the task and remove it from project
    const task = await Task.findById(id);
    if (task) {
      await Project.findByIdAndUpdate(task.projectId, { $pull: { tasks: id } });
    }

    await Task.findByIdAndDelete(id);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting task:", error);
    throw new Error("Failed to delete task");
  }
}

// Subtask CRUD Operations
export async function createSubtask(taskId: string, data: any) {
  try {
    await connectDB();
    const subtask = new Subtask({ ...data, taskId });
    await subtask.save();

    // Add subtask to task's subtasks array
    await Task.findByIdAndUpdate(
      taskId,
      { $push: { subtasks: subtask._id } },
      { new: true }
    );

    revalidatePath("/");
    return JSON.parse(JSON.stringify(subtask));
  } catch (error) {
    console.error("Error creating subtask:", error);
    throw new Error("Failed to create subtask");
  }
}

export async function updateSubtask(id: string, data: any) {
  try {
    await connectDB();
    const subtask = await Subtask.findByIdAndUpdate(id, data, { new: true });
    revalidatePath("/");
    return JSON.parse(JSON.stringify(subtask));
  } catch (error) {
    console.error("Error updating subtask:", error);
    throw new Error("Failed to update subtask");
  }
}

export async function deleteSubtask(id: string) {
  try {
    await connectDB();

    // Remove subtask from task's subtasks array
    const subtask = await Subtask.findById(id);
    if (subtask) {
      await Task.findByIdAndUpdate(subtask.taskId, { $pull: { subtasks: id } });
    }

    await Subtask.findByIdAndDelete(id);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting subtask:", error);
    throw new Error("Failed to delete subtask");
  }
}

export async function toggleSubtask(id: string, completed: boolean) {
  try {
    await connectDB();
    const subtask = await Subtask.findByIdAndUpdate(
      id,
      { completed },
      { new: true }
    );
    revalidatePath("/");
    return JSON.parse(JSON.stringify(subtask));
  } catch (error) {
    console.error("Error toggling subtask:", error);
    throw new Error("Failed to toggle subtask");
  }
}
