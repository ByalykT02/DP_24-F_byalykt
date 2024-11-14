import { NextResponse } from "next/server";
import { getGreeting } from "~/server/db/queries/greeting";

export async function GET() {
  try {
    const greeting = await getGreeting();
    
    // Create response with greeting
    const response = NextResponse.json(greeting, { status: 200 });
    
    // Set cache control headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (e) {
    return NextResponse.json(e, { status: 500 });
  }
}