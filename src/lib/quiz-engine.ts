import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";
import type { Question, TestSeriesItem } from "@/types/database";

export interface BilingualContent {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  explanation?: string | null;
}

export interface SanitizedQuizQuestion {
  id: string;
  chapter_id: string | null;
  difficulty: string;
  question_type: string;
  question_en: string;
  question_hi: string;
  option_a_en: string;
  option_a_hi: string;
  option_b_en: string;
  option_b_hi: string;
  option_c_en: string;
  option_c_hi: string;
  option_d_en: string;
  option_d_hi: string;
  bilingual: {
    en: BilingualContent;
    hi: BilingualContent;
  };
}

export interface QuizSession {
  attemptId: string;
  studentId: string;
  canonicalUserId?: string | null;
  testItemId: string;
  title: string;
  totalQuestions: number;
  questionIds: string[];
  rawQuestionsMap: Map<string, Question>;
  answersMap: Map<
    string,
    {
      selectedOption: string;
      isCorrect: boolean;
      pointsAwarded: number;
      answeredAt: string;
    }
  >;
  currentStreak: number;
  bestStreak: number;
  startedAt: string;
}

// In-memory active quiz sessions ledger
const activeQuizSessions = new Map<string, QuizSession>();

/**
 * Checks whether a test_series_item is of type 'quiz'
 */
export function isQuizTestItem(
  item: { test_type?: string | null } | null | undefined
): boolean {
  if (!item) return false;
  const t = (item.test_type || "").toLowerCase().trim();
  return t === "quiz" || t === "mini quiz" || t.includes("quiz");
}

/**
 * Fetches all questions associated with a test_series_item from Supabase database.
 * Uses existing relationships:
 * 1. Direct array containment: questions.test_ids @> ARRAY[testItemId]
 * 2. Junction table: test_questions.test_series_item_id = testItemId
 */
export async function getRawQuestionsForQuizItem(
  testItemId: string
): Promise<Question[]> {
  const supabase = getSupabaseAdminClient();

  // 1. Direct match on questions.test_ids array
  const { data: directData, error: directErr } = await supabase
    .from("questions")
    .select("*")
    .contains("test_ids", [testItemId])
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  // 2. Junction table test_questions
  const { data: junctionData, error: junctionErr } = await supabase
    .from("test_questions")
    .select("*, questions(*)")
    .eq("test_series_item_id", testItemId)
    .order("question_order", { ascending: true });

  const map = new Map<string, Question>();

  if (!directErr && directData && directData.length > 0) {
    for (const q of directData) {
      if (q && q.is_active) map.set(q.id, q as Question);
    }
  }

  if (!junctionErr && junctionData && junctionData.length > 0) {
    for (const row of junctionData) {
      const q = (row as any).questions;
      if (q && q.is_active) map.set(q.id, q as Question);
    }
  }

  return Array.from(map.values());
}

/**
 * Returns available quiz items filtered by type = 'quiz' from test_series_items in Supabase
 */
export async function getQuizCatalog(studentId?: string) {
  const supabase = getSupabaseAdminClient();

  // Query ONLY test_series_items where test_type is quiz
  const { data: allItems, error } = await supabase
    .from("test_series_items")
    .select("*, test_series(id, title, slug, is_paid, price)")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[QuizEngine] Error fetching quiz catalog:", error.message);
  }

  const rawQuizItems = (allItems || []).filter(isQuizTestItem);

  // Enrich with question counts from database
  const quizItems = await Promise.all(
    rawQuizItems.map(async (item: any) => {
      const questions = await getRawQuestionsForQuizItem(item.id);
      return {
        id: item.id,
        title: item.title,
        seriesTitle: item.test_series?.title || "CCC Practice Series",
        questionCount: questions.length || item.question_count || 0,
        duration: item.duration || 10,
        difficulty: item.difficulty || "Medium",
        isPaid: Boolean(item.test_series?.is_paid),
        hasQuestions: questions.length > 0,
      };
    })
  );

  // Calculate student's quiz history if studentId provided
  let userStats = {
    quizzesCompleted: 0,
    totalQuestionsSolved: 0,
    avgAccuracy: 0,
    bestStreak: 0,
    totalPoints: 0,
  };

  if (studentId) {
    try {
      const { data: attempts } = await supabase
        .from("student_test_attempts")
        .select("score, total_marks, correct_count, attempted_count, accuracy, status")
        .eq("student_id", studentId)
        .eq("status", "evaluated");

      if (attempts && attempts.length > 0) {
        const total = attempts.length;
        const totalAccuracy = attempts.reduce(
          (acc, a) => acc + (Number(a.accuracy) || 0),
          0
        );
        const totalScore = attempts.reduce(
          (acc, a) => acc + (Number(a.score) || 0),
          0
        );
        const totalSolved = attempts.reduce(
          (acc, a) => acc + (Number(a.attempted_count) || 0),
          0
        );

        userStats = {
          quizzesCompleted: total,
          totalQuestionsSolved: totalSolved,
          avgAccuracy: Math.round(totalAccuracy / total),
          bestStreak: Math.max(0, Math.min(10, Math.round(total * 1.5))),
          totalPoints: Math.round(totalScore),
        };
      }
    } catch {
      // Graceful fallback
    }
  }

  return {
    quizItems,
    userStats,
  };
}

/**
 * Initializes a Quiz session from a specific Supabase test_series_item ID.
 * Returns empty state if no questions are linked to the item in Supabase.
 */
export async function startQuizSession(params: {
  studentId: string;
  canonicalUserId?: string | null;
  studentName?: string;
  testItemId: string;
}): Promise<{
  empty: boolean;
  message?: string;
  attemptId: string;
  title: string;
  totalQuestions: number;
  questions: SanitizedQuizQuestion[];
}> {
  const supabase = getSupabaseAdminClient();

  // 1. Fetch test_series_item
  const { data: item, error: itemErr } = await supabase
    .from("test_series_items")
    .select("*, test_series(id, title, is_paid)")
    .eq("id", params.testItemId)
    .maybeSingle();

  if (itemErr || !item) {
    throw new Error("Quiz item not found in database.");
  }

  if (!isQuizTestItem(item)) {
    throw new Error("The selected item is not a quiz type.");
  }

  // 2. Fetch questions from database
  const rawQuestions = await getRawQuestionsForQuizItem(params.testItemId);

  // If no questions linked, return empty state (never generate or invent questions)
  if (rawQuestions.length === 0) {
    return {
      empty: true,
      message: "No questions available for this quiz in the database.",
      attemptId: "",
      title: item.title,
      totalQuestions: 0,
      questions: [],
    };
  }

  const attemptId = crypto.randomUUID();
  const rawMap = new Map<string, Question>();
  rawQuestions.forEach((q) => rawMap.set(q.id, q));

  // Initialize session in ledger
  const session: QuizSession = {
    attemptId,
    studentId: params.studentId,
    canonicalUserId: params.canonicalUserId || null,
    testItemId: item.id,
    title: item.title,
    totalQuestions: rawQuestions.length,
    questionIds: rawQuestions.map((q) => q.id),
    rawQuestionsMap: rawMap,
    answersMap: new Map(),
    currentStreak: 0,
    bestStreak: 0,
    startedAt: new Date().toISOString(),
  };

  activeQuizSessions.set(attemptId, session);

  // Pre-record in_progress attempt in Supabase
  try {
    await (supabase as any).from("student_test_attempts").insert({
      id: attemptId,
      student_id: params.studentId,
      canonical_user_id: params.canonicalUserId || null,
      student_type: "telegram",
      student_name: params.studentName || "Student",
      test_item_id: item.id,
      status: "in_progress",
      started_at: session.startedAt,
      time_taken_seconds: 0,
      total_questions: rawQuestions.length,
      attempted_count: 0,
      correct_count: 0,
      incorrect_count: 0,
      unanswered_count: rawQuestions.length,
      score: 0,
      total_marks: rawQuestions.length,
      accuracy: 0,
    });
  } catch (err) {
    console.error("[QuizEngine] Could not pre-insert attempt:", err);
  }

  // Sanitize questions: strip correct_option & explanation, provide bilingual structure
  const sanitizedQuestions: SanitizedQuizQuestion[] = rawQuestions.map((q) => ({
    id: q.id,
    chapter_id: q.chapter_id,
    difficulty: q.difficulty,
    question_type: q.question_type,
    question_en: q.question_en,
    question_hi: q.question_hi,
    option_a_en: q.option_a_en,
    option_a_hi: q.option_a_hi,
    option_b_en: q.option_b_en,
    option_b_hi: q.option_b_hi,
    option_c_en: q.option_c_en,
    option_c_hi: q.option_c_hi,
    option_d_en: q.option_d_en,
    option_d_hi: q.option_d_hi,
    bilingual: {
      en: {
        question: q.question_en || q.question_hi || "",
        options: {
          A: q.option_a_en || q.option_a_hi || "",
          B: q.option_b_en || q.option_b_hi || "",
          C: q.option_c_en || q.option_c_hi || "",
          D: q.option_d_en || q.option_d_hi || "",
        },
      },
      hi: {
        question: q.question_hi || q.question_en || "",
        options: {
          A: q.option_a_hi || q.option_a_en || "",
          B: q.option_b_hi || q.option_b_en || "",
          C: q.option_c_hi || q.option_c_en || "",
          D: q.option_d_hi || q.option_d_en || "",
        },
      },
    },
  }));

  return {
    empty: false,
    attemptId,
    title: item.title,
    totalQuestions: rawQuestions.length,
    questions: sanitizedQuestions,
  };
}

/**
 * Validates a single question answer immediately with instant feedback.
 * Preserves bilingual explanation format.
 */
export async function submitQuizAnswer(params: {
  attemptId: string;
  questionId: string;
  selectedOption: string;
}): Promise<{
  isCorrect: boolean;
  correctOption: string;
  explanationEn: string;
  explanationHi: string;
  bilingual: {
    en: { explanation: string };
    hi: { explanation: string };
  };
  pointsEarned: number;
  streak: number;
  currentScore: number;
  isAlreadyAnswered: boolean;
}> {
  const session = activeQuizSessions.get(params.attemptId);
  const supabase = getSupabaseAdminClient();

  let question: Question | undefined;
  if (session) {
    question = session.rawQuestionsMap.get(params.questionId);
  }

  // Fallback to direct DB query if session not in memory
  if (!question) {
    const { data: dbQ } = await supabase
      .from("questions")
      .select("*")
      .eq("id", params.questionId)
      .maybeSingle();

    if (!dbQ) {
      throw new Error("Question not found in database.");
    }
    question = dbQ as Question;
  }

  const expEn =
    question.explanation_en ||
    question.explanation_hi ||
    "Official NIELIT CCC curriculum verification.";
  const expHi =
    question.explanation_hi ||
    question.explanation_en ||
    "आधिकारिक सीसीसी पाठ्यक्रम सत्यापन।";

  // Prevent multiple answers for the same question
  if (session && session.answersMap.has(params.questionId)) {
    const existing = session.answersMap.get(params.questionId)!;
    return {
      isCorrect: existing.isCorrect,
      correctOption: question.correct_option,
      explanationEn: expEn,
      explanationHi: expHi,
      bilingual: {
        en: { explanation: expEn },
        hi: { explanation: expHi },
      },
      pointsEarned: existing.pointsAwarded,
      streak: session.currentStreak,
      currentScore: Array.from(session.answersMap.values()).reduce(
        (sum, a) => sum + (a.isCorrect ? 1 : 0),
        0
      ),
      isAlreadyAnswered: true,
    };
  }

  const normalizedSelected = params.selectedOption.trim().toUpperCase();
  const normalizedCorrect = question.correct_option.trim().toUpperCase();
  const isCorrect = normalizedSelected === normalizedCorrect;

  let pointsEarned = 0;
  if (isCorrect) {
    pointsEarned = 1;
    if (session) {
      session.currentStreak += 1;
      if (session.currentStreak > session.bestStreak) {
        session.bestStreak = session.currentStreak;
      }
    }
  } else {
    if (session) {
      session.currentStreak = 0;
    }
  }

  if (session) {
    session.answersMap.set(params.questionId, {
      selectedOption: normalizedSelected,
      isCorrect,
      pointsAwarded: pointsEarned,
      answeredAt: new Date().toISOString(),
    });
  }

  const currentScore = session
    ? Array.from(session.answersMap.values()).reduce(
        (sum, a) => sum + (a.isCorrect ? 1 : 0),
        0
      )
    : isCorrect
    ? 1
    : 0;

  return {
    isCorrect,
    correctOption: question.correct_option,
    explanationEn: expEn,
    explanationHi: expHi,
    bilingual: {
      en: { explanation: expEn },
      hi: { explanation: expHi },
    },
    pointsEarned,
    streak: session?.currentStreak || (isCorrect ? 1 : 0),
    currentScore,
    isAlreadyAnswered: false,
  };
}

/**
 * Finalizes the quiz attempt, evaluates score, and integrates with Leaderboard
 */
export async function completeQuizSession(params: {
  attemptId: string;
}): Promise<{
  attemptId: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  score: number;
  accuracy: number;
  isPassed: boolean;
  pointsAwarded: number;
  bestStreak: number;
  timeTakenSeconds: number;
}> {
  const session = activeQuizSessions.get(params.attemptId);
  const supabase = getSupabaseAdminClient();

  let correctCount = 0;
  let incorrectCount = 0;
  let totalQuestions = 0;
  let bestStreak = 0;
  let testItemId = "";
  let canonicalUserId: string | null = null;
  let studentId = "preview_student_demo";
  let startedAt = new Date(Date.now() - 300 * 1000).toISOString();

  if (session) {
    totalQuestions = session.totalQuestions;
    bestStreak = session.bestStreak;
    testItemId = session.testItemId;
    canonicalUserId = session.canonicalUserId || null;
    studentId = session.studentId;
    startedAt = session.startedAt;

    for (const ans of session.answersMap.values()) {
      if (ans.isCorrect) correctCount++;
      else incorrectCount++;
    }
  } else {
    // If session missing from memory, query DB for any existing attempt
    const { data: dbAttempt } = await supabase
      .from("student_test_attempts")
      .select("*")
      .eq("id", params.attemptId)
      .maybeSingle();

    if (dbAttempt) {
      totalQuestions = dbAttempt.total_questions || 0;
      correctCount = dbAttempt.correct_count || 0;
      testItemId = dbAttempt.test_item_id;
      canonicalUserId = dbAttempt.canonical_user_id;
      studentId = dbAttempt.student_id;
      startedAt = dbAttempt.started_at;
    }
  }

  const attemptedCount = correctCount + incorrectCount;
  const unansweredCount = Math.max(0, totalQuestions - attemptedCount);
  const score = correctCount;
  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
  const submittedAt = new Date().toISOString();
  const timeTakenSeconds = Math.max(
    5,
    Math.floor((new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000)
  );

  // Official CCC Passing Criteria: score must be >= 50%
  const passingPercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const isPassed = passingPercentage >= 50;
  const pointsToAward = isPassed ? correctCount : 0;

  // 1. Update attempt status to 'evaluated' in Supabase
  try {
    await (supabase as any).from("student_test_attempts").upsert({
      id: params.attemptId,
      student_id: studentId,
      canonical_user_id: canonicalUserId,
      status: "evaluated",
      submitted_at: submittedAt,
      time_taken_seconds: timeTakenSeconds,
      attempted_count: attemptedCount,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      unanswered_count: unansweredCount,
      score,
      total_marks: totalQuestions,
      accuracy,
      updated_at: submittedAt,
    });

    // 2. Award Leaderboard Points ONLY IF passing (score >= 50%)
    if (canonicalUserId && pointsToAward > 0 && testItemId) {
      await (supabase as any).from("leaderboard_point_events").insert({
        canonical_user_id: canonicalUserId,
        attempt_id: params.attemptId,
        test_item_id: testItemId,
        points_awarded: pointsToAward,
        correct_count: correctCount,
        total_questions: totalQuestions,
        created_at: submittedAt,
      });
    }
  } catch (err) {
    console.error("[QuizEngine] Error persisting completed quiz attempt:", err);
  }

  // Clean memory session
  activeQuizSessions.delete(params.attemptId);

  return {
    attemptId: params.attemptId,
    totalQuestions,
    correctCount,
    incorrectCount,
    score,
    accuracy,
    isPassed,
    pointsAwarded: pointsToAward,
    bestStreak,
    timeTakenSeconds,
  };
}
