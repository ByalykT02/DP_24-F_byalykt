"use server";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "~/lib/auth";
import { getUserByEmail } from "~/server/db/queries/user-queries";

interface UpdateProfileParams {
  name: string;
  email: string;
  image?: string;
}

interface ProfileUpdateResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export async function updateProfile({
  name,
  email,
  image,
}: UpdateProfileParams): Promise<ProfileUpdateResponse> {
  try {
    // Input validation
    if (!name || !email) {
      return { success: false, error: "Name and email are required" };
    }

    if (!email.includes("@")) {
      return { success: false, error: "Invalid email format" };
    }

    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Sanitize inputs
    const sanitizedName = name.trim();
    const sanitizedEmail = email.trim().toLowerCase();

    // Check if email is already taken by another user
    if (sanitizedEmail !== currentUser.email) {
      const existingUser = await getUserByEmail(sanitizedEmail);
      if (existingUser && existingUser.id !== currentUser.id) {
        return { success: false, error: "Email already in use" };
      }
    }

    // Update user profile
    const [updatedUser] = await db
      .update(users)
      .set({
        name: sanitizedName,
        email: sanitizedEmail,
        image: image?.trim() || null,
      })
      .where(eq(users.id, currentUser.id))
      .returning();

    return {
      success: true,
      data: updatedUser, // Return the updated user data
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Failed to update profile:", error.message);
      return { success: false, error: error.message };
    }
    console.error("Failed to update profile:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
