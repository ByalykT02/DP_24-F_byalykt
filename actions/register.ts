"use server";
import { RegisterSchema } from "schemas";
import * as z from "zod";
import bcrypt from "bcrypt";
import { createUser, isEmailFree } from "~/server/db/queries/user-queries";

/**
 * Server-side function to handle user registration.
 * Checks for email availability, hashes the password, and creates the user.
 */
export async function register(values: z.infer<typeof RegisterSchema>) {
  try {
    // Check if the provided email address is already in use.
    const emailFree = await isEmailFree(values.email);
    if (!emailFree) {
      return { error: "Email already taken" };
    } 
    
    // Hash the user's password before storing it in the database.
    const hashedPassword = await bcrypt.hash(values.password, 10); // Create the new user in the database.

    const result = await createUser(values.name, values.email, hashedPassword);
    return result; // Return the result of the user creation (likely success/error)
  } catch (error) {
    // Catch and return any errors that occur during the registration process.
    return { error: "Something went wrong" };
  }
}
