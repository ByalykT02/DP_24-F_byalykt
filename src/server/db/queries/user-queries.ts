"use server";
import { db } from "..";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import { logger } from "~/utils/logger";


export async function getUserByEmail(email: string) {
  try {
    const user = await db.query.users.findFirst({
      where: (model, { eq }) => eq(model.email, email),
    });
    return user;
  } catch (error) {
    logger.error("getUserByEmail failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function getUserById(id: string) {
  try {
    const user = await db.query.users.findFirst({
      where: (model, { eq }) => eq(model.id, id),
    });
    return user ?? null;
  } catch (error) {
    logger.error("getUserById failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}


export async function isEmailFree(newUserEmail: string): Promise<boolean> {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, newUserEmail));
    return result.length === 0;
  } catch (error) {
    logger.error("isEmailFree failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export async function createUser(
  name: string,
  email: string,
  hashedPassword: string,
) {
  try {
    await db.insert(users).values({ name, email, password: hashedPassword });

    return { success: "User created!" };
  } catch (error) {
    logger.error("createUser failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { error: "Failed to create user" };
  }
}
