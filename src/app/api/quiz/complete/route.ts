import { NextRequest, NextResponse } from "next/server";
import { completeQuizSession } from "@/lib/quiz-engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attemptId } = body;

    if (!attemptId) {
      return NextResponse.json(
        { error: "attemptId is required to finalize quiz." },
        { status: 400 }
      );
    }

    const result = await completeQuizSession({ attemptId });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error("Quiz complete route error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to finalize quiz" },
      { status: 500 }
    );
  }
}
