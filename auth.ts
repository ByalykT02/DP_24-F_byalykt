import NextAuth, { type DefaultSession } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "~/server/db";
import { getUserById, getUserByEmail } from "~/server/db/queries/user-queries";
import { LoginSchema } from "schemas";
import bcrypt from "bcryptjs";

import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";

import Credentials from "next-auth/providers/credentials";

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
    id?: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
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

      if (token.name) session.user.name = token.name;
      if (token.email) session.user.email = token.email;
      if (token.picture) session.user.image = token.picture;

      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.id = user.id;
        token.role = (user as any).role;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }

      if (token.sub && !token.role) {
          const existingUser = await getUserById(token.sub);
          if (existingUser) {
              token.role = existingUser.role;
          }
      }

      if (trigger === "update" && session) {
        if (session.user.id) {
            const updatedUser = await getUserById(session.user.id);
            if (updatedUser) {
                token.name = updatedUser.name;
                token.email = updatedUser.email;
                token.picture = updatedUser.image;
                token.role = updatedUser.role;
            }
        }
      }

      return token;
    },
  },
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          const user = await getUserByEmail(email);

          if (!user || !user.password) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role,
            };
          }
        }
        return null;
      },
    }),
  ],
});
