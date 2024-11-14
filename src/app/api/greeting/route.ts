import { NextResponse } from "next/server";
import { getGreeting } from "~/server/db/queries/greeting";

export async function GET() {
  try {
    const greeting = await getGreeting();
    return NextResponse.json(greeting, { status: 200 });
  } catch (e) {
    return NextResponse.json(e, { status: 500 });
  }
}
