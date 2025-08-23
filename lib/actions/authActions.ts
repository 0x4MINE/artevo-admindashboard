"use server";

import { z } from "zod";
import { createSession, deleteSession } from "../auth/session";
import { redirect } from "next/navigation";
import { User } from "../models/userModel";
import connectDB from "../mongoConnect";

const loginSchema = z.object({
  name: z.string().min(3, { message: "name must be > 3" }).trim(),
  password: z.string().min(3, { message: "password must be > 3" }).trim(),
  remember: z.string().optional(),
});

export const login = async (prevState: any, formData: FormData) => {
  const result = loginSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }
  const { name, password, remember } = result.data;
  await connectDB();
  const user = await User.findOne({ name }).select("+password");
  if (!user || !user.isActive) {
    return { errors: { auth: ["User is not active or not found"] } };
  }
  const isCorrectPass = await user.comparePasswords(password);
  if (name !== user.name || !isCorrectPass) {
    return {
      errors: {
        auth: ["Invalid name or password"],
      },
    };
  }

  await createSession(user._id.toString(), user.name, remember as any);
  redirect("/dashboard");
};

export async function logout() {
  await deleteSession();
  redirect("/login");
}
