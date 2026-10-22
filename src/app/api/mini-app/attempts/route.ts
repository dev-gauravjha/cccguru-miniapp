import { NextRequest, NextResponse } from "next/server";
import { getStudentSession } from "@/lib/telegram/auth";
import { startTestAttempt } from "@/lib/test-engine";

export async function POST(req: NextRequest) {
  try {
    const session = await getStudentSession();
    const body = await req.json();
    const { testItemId } = body;

    if (!testItemId) {
      return NextResponse.json(
        { error: "testItemId is required" },
        { status: 400 }
      );
    }

    const studentId = body.studentId || session?.studentId || "preview_student_demo";
    const studentName = body.studentName || session?.name || "Demo Student";

    const canonicalUserId =
      body.canonicalUserId ||
      session?.canonicalUserId ||
      (studentId === "preview_student_demo"
        ? "00000000-0000-0000-0000-000000000001"
        : undefined);

    const result = await startTestAttempt({
      studentId,
      canonicalUserId,
      studentName,
      studentUsername: session?.username,
      studentType: session?.studentType || "telegram",
      testItemId,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to start test attempt" },
      { status: 500 }
    );
  }
}
