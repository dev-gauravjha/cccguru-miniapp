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

    let answers: any = undefined;
    let bodyStudentId: string | undefined = undefined;
    let bodyCanonicalId: string | undefined = undefined;
    try {
      const body = await req.json();
      answers = body.answers;
      bodyStudentId = body.studentId;
      bodyCanonicalId = body.canonicalUserId;
    } catch {
      // Body may be empty if already synced in memory
    }

    const studentId = bodyStudentId || session?.studentId || "preview_student_demo";
    const canonicalUserId =
      bodyCanonicalId ||
      session?.canonicalUserId ||
      (studentId === "preview_student_demo"
        ? "00000000-0000-0000-0000-000000000001"
        : undefined);

    const result = await submitTestAttempt({
      studentId,
      canonicalUserId,
      attemptId,
      answers,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to submit test attempt" },
      { status: 500 }
    );
  }
}
