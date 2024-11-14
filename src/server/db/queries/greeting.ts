"use server"
import { db } from "..";

export async function getGreeting(): Promise<string>{
  try {
    const result = await db.query.greeting.findFirst();
    if (!result?.greetingText) return "Hello, World(not from db)";

    return result.greetingText;
  } catch (e) {
    return "Hello, World(not from db)";
  }
}