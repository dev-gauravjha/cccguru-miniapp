import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/telegram/auth";
import {
  getTestSeries,
  getTestSeriesItems,
  getChapters,
  getStudentResults,
} from "@/lib/test-engine";
import { CHAPTER_TEST_ITEMS_MAP } from "@/lib/utils";

export async function GET() {
  const session = await getStudentSession();
  const studentId = session?.studentId || "preview_student_demo";

  const [seriesList, allItems, chapters, pastAttempts] = await Promise.all([
    getTestSeries({ limit: 4 }),
    getTestSeriesItems(),
    getChapters(),
    getStudentResults(studentId),
  ]);

  // Map chapter items with their metadata
  const chapterTests = chapters.map((chap) => {
    const mapped = CHAPTER_TEST_ITEMS_MAP[chap.sort_order];
    return {
      chapterId: chap.id,
      title: chap.title,
      hindiTitle: chap.hindi_title,
      sortOrder: chap.sort_order,
      testItemId: mapped?.id || chap.id,
      questionCount: mapped?.questionCount || 100,
      duration: mapped?.duration || 90,
    };
  });

  // Calculate student statistics
  const testsTaken = pastAttempts.length;
  const avgAccuracy =
    testsTaken > 0
      ? Math.round(
          pastAttempts.reduce((acc, a) => acc + (a.accuracy || 0), 0) /
            testsTaken
        )
      : 0;

  const totalQuestionsSolved = pastAttempts.reduce(
    (acc, a) => acc + (a.attempted_count || 0),
    0
  );

  return NextResponse.json({
    student: session
      ? {
          id: session.studentId,
          name: session.name,
          username: session.username,
          photoUrl: session.photoUrl,
          isDevPreview: session.isDevPreview,
        }
      : null,
    stats: {
      testsTaken,
      avgAccuracy,
      totalQuestionsSolved,
      dayStreak: Math.max(1, testsTaken > 0 ? 3 : 1),
      preparationPercentage: Math.min(
        100,
        Math.round((testsTaken / 25) * 60 + (avgAccuracy / 100) * 40)
      ),
    },
    featuredSeries: seriesList,
    mockTests: allItems.slice(0, 6),
    chapterTests,
    recentResults: pastAttempts.slice(0, 3),
  });
}
