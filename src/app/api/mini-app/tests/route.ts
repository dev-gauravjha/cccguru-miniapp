import { NextRequest, NextResponse } from "next/server";
import { getStudentSession, createPreviewSession } from "@/lib/telegram/auth";
import {
  getTestCategories,
  getTestSeries,
  getTestSeriesItems,
} from "@/lib/test-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    let session = await getStudentSession();
    if (!session && process.env.NEXT_PUBLIC_DEV_PREVIEW === "true") {
      session = createPreviewSession();
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const seriesId = searchParams.get("seriesId") || undefined;
    const queryStudentId = searchParams.get("studentId");
    const queryCanonicalId = searchParams.get("canonicalUserId");

    const studentId = queryStudentId || session?.studentId || "preview_student_demo";
    const canonicalUserId =
      queryCanonicalId ||
      session?.canonicalUserId ||
      (studentId === "preview_student_demo"
        ? "00000000-0000-0000-0000-000000000001"
        : undefined);

    const [categories, seriesList, items] = await Promise.all([
      getTestCategories(),
      getTestSeries({ categoryId }),
      getTestSeriesItems(seriesId, categoryId, studentId, canonicalUserId),
    ]);

    return NextResponse.json({
      categories,
      series: seriesList,
      items,
    });
  } catch (err: any) {
    console.error("GET /api/mini-app/tests error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load tests" },
      { status: 500 }
    );
  }
}
