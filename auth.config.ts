import type { NextAuthConfig } from "next-auth";

export default {
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
} satisfies NextAuthConfig;
