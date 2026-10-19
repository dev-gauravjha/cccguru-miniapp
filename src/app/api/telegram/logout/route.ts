import { NextResponse } from "next/server";
import { clearStudentSessionCookie } from "@/lib/telegram/auth";

export async function POST() {
  await clearStudentSessionCookie();
  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
