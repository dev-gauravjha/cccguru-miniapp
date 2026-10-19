import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/telegram/auth";
import { getStudentResults } from "@/lib/test-engine";

export async function GET() {
  const session = await getStudentSession();
  const studentId = session?.studentId || "preview_student_demo";

  const results = await getStudentResults(studentId);

  return NextResponse.json({
    results,
  });
}
