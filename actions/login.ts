"use server";
import { signIn } from "auth";
import { AuthError } from "next-auth";
import { DEFAULT_LOGIN_REDIRECT } from "routes";
import { LoginSchema } from "schemas";
import * as z from "zod";
import { AuthResponse } from "~/lib/types/auth-form";

export const login = async (
  values: z.infer<typeof LoginSchema>
): Promise<AuthResponse | undefined> => {
  const validatedFields = LoginSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password } = validatedFields.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false, // Changed to false to handle redirect manually
    });
    return { success: "Logged in successfully!" };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    throw error;
  }
};