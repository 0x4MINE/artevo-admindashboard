"use server";
import { cookies } from "next/headers";
import { Decrypt } from "./session";

export async function getCurrentUser() {
  const session = await Decrypt((await cookies()).get("session")?.value);
  if (!session?.userId) return null;

  return {
    id: session.userId,
    name: session.userName,
  };
}
