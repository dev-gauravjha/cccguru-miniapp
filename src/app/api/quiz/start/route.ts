import { NextRequest, NextResponse } from "next/server";
import { getStudentSession, createPreviewSession } from "@/lib/telegram/auth";
import { startQuizSession } from "@/lib/quiz-engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let session = await getStudentSession();
    if (!session && process.env.NEXT_PUBLIC_DEV_PREVIEW === "true") {
      session = createPreviewSession();
    }

    const body = await req.json().catch(() => ({}));
    let testItemId = body.testItemId || body.quizId || body.itemId;

    const studentId = body.studentId || session?.studentId || "preview_student_demo";
    const canonicalUserId =
      body.canonicalUserId ||
      (body.studentId ? undefined : session?.canonicalUserId) ||
      (studentId === "preview_student_demo"
        ? "00000000-0000-0000-0000-000000000001"
        : null);
    const studentName = body.studentName || session?.name || "Student";

    if (!testItemId || testItemId === "daily") {
      // Find the first available quiz item from test_series_items in database
      const { getQuizCatalog } = await import("@/lib/quiz-engine");
      const catalog = await getQuizCatalog();
      if (catalog.quizItems && catalog.quizItems.length > 0) {
        testItemId = catalog.quizItems[0].id;
      }
    }

    if (!testItemId) {
      return NextResponse.json({
        success: true,
        empty: true,
        message: "No quiz items available currently.",
        questions: [],
        totalQuestions: 0,
      });
    }

    const quizData = await startQuizSession({
      studentId,
      canonicalUserId,
      studentName,
      testItemId,
    });

    return NextResponse.json({
      success: true,
      ...quizData,
    });
  } catch (err: any) {
    console.error("Quiz start route error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to start quiz session" },
      { status: 500 }
    );
  }
}

