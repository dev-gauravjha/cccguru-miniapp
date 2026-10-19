import { NextRequest, NextResponse } from "next/server";
import { getStudentSession } from "@/lib/telegram/auth";
import { submitTestAttempt } from "@/lib/test-engine";

interface RouteParams {
  params: Promise<{ attemptId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { attemptId } = await params;
    const session = await getStudentSession();
    const studentId = session?.studentId || "preview_student_demo";

    const result = await submitTestAttempt({
      studentId,
      attemptId,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to submit test attempt" },
      { status: 500 }
    );
  }
}
