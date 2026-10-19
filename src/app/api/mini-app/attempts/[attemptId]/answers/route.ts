import { NextRequest, NextResponse } from "next/server";
import { getStudentSession } from "@/lib/telegram/auth";
import { saveAttemptAnswer } from "@/lib/test-engine";

interface RouteParams {
  params: Promise<{ attemptId: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { attemptId } = await params;
    const session = await getStudentSession();
    const studentId = session?.studentId || "preview_student_demo";

    const body = await req.json();
    const { questionId, selectedOption, isFlagged, timeSpentSeconds } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: "questionId is required" },
        { status: 400 }
      );
    }

    const result = await saveAttemptAnswer({
      studentId,
      attemptId,
      questionId,
      selectedOption,
      isFlagged,
      timeSpentSeconds,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to save answer" },
      { status: 400 }
    );
  }
}
