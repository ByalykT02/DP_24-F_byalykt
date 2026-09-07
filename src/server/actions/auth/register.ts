"use server";
import { RegisterSchema } from "schemas";
import * as z from "zod";
import bcrypt from "bcryptjs";
import { logger } from "~/utils/logger";
import { createUser, isEmailFree } from "~/server/db/queries/user-queries";

export async function register(values: z.infer<typeof RegisterSchema>) {
  const validated = RegisterSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.errors[0]?.message ?? "Invalid fields" };
  }

  try {
    const emailFree = await isEmailFree(validated.data.email);
    if (!emailFree) {
      return { error: "Email already taken" };
    }

    const hashedPassword = await bcrypt.hash(validated.data.password, 10);

    const result = await createUser(
      validated.data.name,
      validated.data.email,
      hashedPassword,
    );
    return result;
  } catch (error) {
    logger.error("User registration failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { error: "Something went wrong" };
  }
}
