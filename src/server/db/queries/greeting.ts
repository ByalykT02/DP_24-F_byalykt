"use server"
import { db } from "..";

export async function getGreeting(){
  try {
    const result = await db.query.greeting.findFirst();
    if (!result?.greetingText) return "Hello, World(not from db 1)";

    return result.greetingText;
  } catch (e) {
    console.error(e);
    return "Error"
  }
}