"use server";
import { db } from "..";
import { users } from "../schema";
import { eq } from "drizzle-orm";


export async function getUserByEmail(userEmail: string) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
    return result[0]
  } catch (e) {
    console.error(e);
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
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function createUser(
  name: string,
  email: string,
  hashedPassword: string,
) {
  await db.insert(users).values({ name, email, password: hashedPassword });

  return { success: "User created!" };
}
