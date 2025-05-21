import { db } from "../db/index";
import { users } from "../db/schema";
import { asc } from "drizzle-orm";
import {UserForManagement } from "~/lib/types/user"
export async function getAllUsersForManagement(): Promise<UserForManagement[]> {
  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    emailVerified: users.emailVerified,
  })
  .from(users)
  .orderBy(asc(users.emailVerified));

  return allUsers;
}
