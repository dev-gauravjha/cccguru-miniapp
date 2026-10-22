import { NextRequest, NextResponse } from "next/server";
import { getChapters, getStudentLatestAttemptsMap } from "@/lib/test-engine";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { CHAPTER_TEST_ITEMS_MAP } from "@/lib/utils";
import { getStudentSession, createPreviewSession } from "@/lib/telegram/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    let session = await getStudentSession();
    if (!session && process.env.NEXT_PUBLIC_DEV_PREVIEW === "true") {
      session = createPreviewSession();
    }

    const { searchParams } = new URL(req.url);
    const queryStudentId = searchParams.get("studentId");
    const queryCanonicalId = searchParams.get("canonicalUserId");

    const studentId = queryStudentId || session?.studentId || "preview_student_demo";
    const canonicalUserId =
      queryCanonicalId ||
      session?.canonicalUserId ||
      (studentId === "preview_student_demo"
        ? "00000000-0000-0000-0000-000000000001"
        : undefined);

    const supabase = getSupabaseAdminClient();
    const [chapters, attemptsMap] = await Promise.all([
      getChapters(),
      getStudentLatestAttemptsMap(studentId, canonicalUserId),
    ]);

    // Fetch chapter-wise test series items directly from database
    const { data: dbSeriesItems } = await supabase
      .from("test_series_items")
      .select("id, title, test_type, question_count, duration, sort_order, is_published")
      .eq("series_id", "2db0e35e-83a5-4323-800a-c860c59bdbc5")
      .eq("is_published", true);

    const enrichedChapters = chapters.map((chap) => {
      const staticMeta = CHAPTER_TEST_ITEMS_MAP[chap.sort_order];

      // Try to find matching test item from database
      const matchedDbItem = dbSeriesItems?.find((item) => {
        if (staticMeta && item.id === staticMeta.id) return true;
        const chapTitle = (chap.title || "").toLowerCase();
        const itemTitle = (item.title || "").toLowerCase();
        return (
          itemTitle.includes(chapTitle) ||
          chapTitle.includes(itemTitle) ||
          (chap.sort_order === 10 && (itemTitle.includes("future") || itemTitle.includes("artificial")))
        );
      });

      const testItemId = matchedDbItem?.id || staticMeta?.id || chap.id;

      return {
        ...chap,
        testItemId,
        questionCount: matchedDbItem?.question_count || staticMeta?.questionCount || 100,
        duration: matchedDbItem?.duration || staticMeta?.duration || 90,
        slug: staticMeta?.slug || `chapter-${chap.sort_order}`,
        latestAttempt: attemptsMap.get(testItemId) || null,
      };
    });

    return NextResponse.json({
      chapters: enrichedChapters,
    });
  } catch (err: any) {
    console.error("GET /api/mini-app/chapters error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load chapters" },
      { status: 500 }
    );
  }
}
