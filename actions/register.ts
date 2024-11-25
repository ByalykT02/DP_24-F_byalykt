"use server";
import { RegisterSchema } from "schemas";
import * as z from "zod";
import bcrypt from "bcrypt";
import { createUser, isEmailFree } from "~/server/db/queries/user-queries";

export async function register(values: z.infer<typeof RegisterSchema>) {
  try {
    // Check if email is already taken
    const emailFree = await isEmailFree(values.email);
    if (!emailFree) {
      return { error: "Email already taken" };
    }

    // Hash password and create user...
    const hashedPassword = await bcrypt.hash(values.password, 10);
    const result = await createUser(values.name, values.email, hashedPassword);
    
    return result;
  } catch (error) {
    return { error: "Something went wrong" };
  }
}