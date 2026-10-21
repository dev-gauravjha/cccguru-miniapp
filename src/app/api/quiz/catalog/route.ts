import { NextRequest, NextResponse } from "next/server";
import { getStudentSession, createPreviewSession } from "@/lib/telegram/auth";
import { getQuizCatalog } from "@/lib/quiz-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    let session = await getStudentSession();
    if (!session && process.env.NEXT_PUBLIC_DEV_PREVIEW === "true") {
      session = createPreviewSession();
    }

    const studentId = session?.studentId;
    const catalog = await getQuizCatalog(studentId);

    return NextResponse.json({
      success: true,
      ...catalog,
    });
  } catch (err: any) {
    console.error("Quiz catalog route error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load quiz catalog" },
      { status: 500 }
    );
  }
}
