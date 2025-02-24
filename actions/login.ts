"use server";
import { signIn } from "auth";
import { AuthError } from "next-auth";
import { DEFAULT_LOGIN_REDIRECT } from "routes";
import { LoginSchema } from "schemas";
import * as z from "zod";
import { AuthResponse } from "~/lib/types/auth-form";

/**
 * Server-side function to handle user login.
 * Validates credentials and uses NextAuth's signIn function.
 */
export const login = async (
  values: z.infer<typeof LoginSchema>,
): Promise<AuthResponse | undefined> => {
  // Validate the login form data using Zod schema.
  const validatedFields = LoginSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password } = validatedFields.data;

  try {
    // Attempt to sign in the user using credentials.  Redirect is set to false
    // so we can handle it ourselves on the client-side.
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: "Logged in successfully!" };
  } catch (error) {
    // Handle authentication errors.
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    } // Re-throw other errors for higher-level handling.
    throw error;
  }
};
