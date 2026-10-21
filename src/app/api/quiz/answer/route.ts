import { NextRequest, NextResponse } from "next/server";
import { submitQuizAnswer } from "@/lib/quiz-engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attemptId, questionId, selectedOption } = body;

    if (!attemptId || !questionId || !selectedOption) {
      return NextResponse.json(
        { error: "attemptId, questionId, and selectedOption are required." },
        { status: 400 }
      );
    }

    const evaluation = await submitQuizAnswer({
      attemptId,
      questionId,
      selectedOption,
    });

    return NextResponse.json({
      success: true,
      ...evaluation,
    });
  } catch (err: any) {
    console.error("Quiz answer evaluation route error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to evaluate quiz answer" },
      { status: 500 }
    );
  }
}
