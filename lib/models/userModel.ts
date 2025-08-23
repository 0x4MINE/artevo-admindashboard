import mongoose, { model, models } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends mongoose.Document {
  id: string;
  name: string;
  password: string;
  isActive: boolean;
  role: "admin" | "user";
  comparePasswords: (password: string) => Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
      minlength: [4, "Password must be at least 4 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

userSchema.methods.comparePasswords = async function (
  candidatePassword: string
): Promise<boolean> {
  console.log("comparing passwords");
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = models.User || model<IUser>("User", userSchema);
