"use server";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getUserById } from "~/server/db/queries/user-queries";
import { getCurrentUser } from "~/lib/auth";

interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

export async function changePassword({
  currentPassword,
  newPassword,
}: ChangePasswordParams) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const dbUser = await getUserById(user.id);

    if (!dbUser?.password) {
      return { success: false, error: "No password set for this account" };
    }

    const passwordsMatch = await bcrypt.compare(
      currentPassword,
      dbUser.password,
    );
    if (!passwordsMatch) {
      return { success: false, error: "Current password is incorrect" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, user.id));

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to change password" };
  }
}
