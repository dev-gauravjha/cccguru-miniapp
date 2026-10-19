import { NextRequest, NextResponse } from "next/server";
import { getStudentSession } from "@/lib/telegram/auth";
import { getAttemptReview } from "@/lib/test-engine";

interface RouteParams {
  params: Promise<{ attemptId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { attemptId } = await params;
    const session = await getStudentSession();
    const studentId = session?.studentId || "preview_student_demo";

    const review = await getAttemptReview(studentId, attemptId);

    return NextResponse.json(review);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load attempt review" },
      { status: 404 }
    );
  }
}
