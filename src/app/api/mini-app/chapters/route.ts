import { NextResponse } from "next/server";
import { getChapters } from "@/lib/test-engine";
import { CHAPTER_TEST_ITEMS_MAP } from "@/lib/utils";

export async function GET() {
  const chapters = await getChapters();

  const enrichedChapters = chapters.map((chap) => {
    const testMeta = CHAPTER_TEST_ITEMS_MAP[chap.sort_order];
    return {
      ...chap,
      testItemId: testMeta?.id || chap.id,
      questionCount: testMeta?.questionCount || 100,
      duration: testMeta?.duration || 90,
      slug: testMeta?.slug || `chapter-${chap.sort_order}`,
    };
  });

  return NextResponse.json({
    chapters: enrichedChapters,
  });
}
