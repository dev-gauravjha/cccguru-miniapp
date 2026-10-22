import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/telegram/auth";
import {
  getTestSeries,
  getTestSeriesItems,
  getChapters,
  getStudentResults,
} from "@/lib/test-engine";
import { CHAPTER_TEST_ITEMS_MAP } from "@/lib/utils";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Calculates consecutive active days streak in Asia/Kolkata timezone
 */
function calculateDayStreak(
  dates: (string | null | undefined)[],
  testsTaken: number
): number {
  const dayStrings = new Set<string>();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  for (const d of dates) {
    if (!d) continue;
    try {
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) {
        dayStrings.add(formatter.format(parsed));
      }
    } catch {
      // ignore invalid dates
    }
  }

  if (dayStrings.size === 0) {
    return testsTaken > 0 ? 1 : 1;
  }

  const now = new Date();
  const todayStr = formatter.format(now);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = formatter.format(yesterday);

  let checkDate = now;
  if (!dayStrings.has(todayStr)) {
    if (dayStrings.has(yesterdayStr)) {
      checkDate = yesterday;
    } else {
      // Practiced recently but not today or yesterday
      return Math.max(1, dayStrings.size > 0 ? 1 : 1);
    }
  }

  let streak = 0;
  while (true) {
    const formatted = formatter.format(checkDate);
    if (dayStrings.has(formatted)) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }

  return Math.max(1, streak);
}

export async function GET() {
  const session = await getStudentSession();
  const studentId = session?.studentId || "preview_student_demo";
  const canonicalUserId =
    session?.canonicalUserId ||
    (studentId === "preview_student_demo"
      ? "00000000-0000-0000-0000-000000000001"
      : undefined);

  const supabase = getSupabaseAdminClient();

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

  // Unified Points calculation
  let totalPoints = 0;
  let dates: (string | null | undefined)[] = pastAttempts.map(
    (a) => a.submitted_at || a.created_at
  );

  if (canonicalUserId) {
    try {
      const { data: ptEvents } = await supabase
        .from("leaderboard_point_events")
        .select("points_awarded, created_at")
        .eq("canonical_user_id", canonicalUserId);

      if (ptEvents && ptEvents.length > 0) {
        totalPoints = ptEvents.reduce(
          (sum, p) => sum + (Number(p.points_awarded) || 0),
          0
        );
        dates = [
          ...dates,
          ...ptEvents.map((p) => p.created_at),
        ];
      }
    } catch (err) {
      console.error("[Dashboard] Error fetching point events:", err);
    }
  }

  // Passing test attempts score fallback (pass marks >= 50%)
  const passedAttemptsPoints = pastAttempts
    .filter((a) => a.status === "evaluated" && (a.accuracy || 0) >= 50)
    .reduce(
      (sum, a) => sum + (Number(a.score) || Number(a.correct_count) || 0),
      0
    );

  totalPoints = Math.max(totalPoints, passedAttemptsPoints);
  const dayStreak = calculateDayStreak(dates, testsTaken);

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
      dayStreak,
      totalPoints,
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
