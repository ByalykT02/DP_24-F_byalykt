"use server";
import { LoginSchema } from "schemas";
import * as z from "zod";

export const login = async (values: z.infer<typeof LoginSchema>) => {
  console.log(values);
  if (values) {
    return { success: "User logged in!" };
  }

  return { error: "Something went wrong!" };
};
