import { Session } from "next-auth";
import { getSession } from "next-auth/react";

export async function refreshSession(): Promise<Session | null> {
  const event = new Event("visibilitychange");
  document.dispatchEvent(event);
  return await getSession();
}
