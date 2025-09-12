import mongoose, { Schema, Document, Types } from "mongoose";

export type ProjectStatus = "pending" | "in-progress" | "completed";
export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface IProject extends Document {
  name: string;
  description?: string;
  deadline?: Date;
  status: ProjectStatus;
  tasks: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask extends Document {
  projectId: Types.ObjectId;
  title: string;
  description?: string;
  deadline?: Date;
  priority: TaskPriority;
  status: TaskStatus;
  subtasks: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubtask extends Document {
  taskId: Types.ObjectId;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },
    deadline: { type: Date },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
      index: true,
    },
    tasks: [{ type: Schema.Types.ObjectId, ref: "Task" }],
  },
  { timestamps: true }
);

const TaskSchema = new Schema<ITask>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, trim: true, maxlength: 5000 },
    deadline: { type: Date },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
      index: true,
    },
    subtasks: [{ type: Schema.Types.ObjectId, ref: "Subtask" }],
  },
  { timestamps: true }
);

const SubtaskSchema = new Schema<ISubtask>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    completed: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Create models
export const Project =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
export const Task =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);
export const Subtask =
  mongoose.models.Subtask || mongoose.model<ISubtask>("Subtask", SubtaskSchema);
