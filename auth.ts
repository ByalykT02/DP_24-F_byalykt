import NextAuth, { type DefaultSession } from "next-auth";
import authConfig from "auth.config";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "~/server/db";
import { JWT } from "next-auth/jwt";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { getUserById } from "~/server/db/queries/user-queries";

declare module "next-auth" {
  interface Session {
    user: {
      role: "ADMIN" | "USER";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN" | "USER";
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  events: {
    async linkAccount({ user }) {
      if (user.id) {
        await db
          .update(users)
          .set({ emailVerified: new Date() })
          .where(eq(users.id, user.id));
      } else {
        throw new Error("User ID is undefined.");
      }
    },
  },
  callbacks: {
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (session.user && (token.role === "ADMIN" || token.role === "USER")) {
        session.user.role = token.role;
      }
      return session;
    },
    async jwt({ token }) {
      if (token.sub) {
        const existingUser = await getUserById(token.sub);

        if (existingUser) {
          if (existingUser.role === "ADMIN" || existingUser.role === "USER") {
            token.role = existingUser.role;
          }
        }
      }

      return token;
    },
  },
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  ...authConfig,
});
