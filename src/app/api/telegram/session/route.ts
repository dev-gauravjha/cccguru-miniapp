import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/telegram/auth";

export async function GET() {
  const session = await getStudentSession();

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    session,
  });
}
