import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { CHAPTER_TEST_ITEMS_MAP } from "@/lib/utils";
import type {
  TestCategory,
  TestSeries,
  TestSeriesItem,
  LatestAttemptSummary,
  Chapter,
  Question,
  SanitizedQuestion,
  StudentTestAttempt,
  StudentAttemptAnswer,
  EvaluatedQuestionReview,
} from "@/types/database";

// In-memory fallback cache for test attempts if migration is not yet executed
const memoryAttempts = new Map<string, StudentTestAttempt>();
const memoryAnswers = new Map<string, Map<string, StudentAttemptAnswer>>();

/**
 * Fetch all active test categories
 */
export async function getTestCategories(): Promise<TestCategory[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("test_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getTestCategories error:", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Fetch test series optionally filtered by category
 */
export async function getTestSeries(options?: {
  categoryId?: string;
  featuredOnly?: boolean;
  limit?: number;
}): Promise<TestSeries[]> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("test_series")
    .select("*, test_categories(id, title)")
    .order("created_at", { ascending: false });

  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }
  if (options?.featuredOnly) {
    query = query.eq("is_featured", true);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getTestSeries error:", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Fetch student's latest evaluated attempts mapped by test_item_id
 * Guarantees a single latest summary per test item
 */
export async function getStudentLatestAttemptsMap(
  studentId?: string,
  canonicalUserId?: string
): Promise<Map<string, LatestAttemptSummary>> {
  const map = new Map<string, LatestAttemptSummary>();
  if (!studentId && !canonicalUserId) return map;

  const supabase = getSupabaseAdminClient();
  try {
    let query = supabase
      .from("student_test_attempts")
      .select(
        "id, test_item_id, status, score, total_marks, accuracy, attempted_count, correct_count, incorrect_count, unanswered_count, time_taken_seconds, submitted_at, updated_at"
      )
      .eq("status", "evaluated");

    if (studentId && canonicalUserId) {
      query = query.or(
        `student_id.eq.${studentId},canonical_user_id.eq.${canonicalUserId}`
      );
    } else if (studentId) {
      query = query.eq("student_id", studentId);
    } else if (canonicalUserId) {
      query = query.eq("canonical_user_id", canonicalUserId);
    }

    const { data, error } = await query.order("submitted_at", {
      ascending: false,
    });
    if (!error && data) {
      for (const row of data) {
        if (!map.has(row.test_item_id)) {
          const score = Number(row.score || 0);
          const totalMarks = Number(row.total_marks || 100);
          map.set(row.test_item_id, {
            id: row.id,
            status: row.status,
            score,
            totalMarks,
            accuracy: Math.round(Number(row.accuracy || 0)),
            attemptedCount: Number(row.attempted_count || 0),
            correctCount: Number(row.correct_count || 0),
            incorrectCount: Number(row.incorrect_count || 0),
            unansweredCount: Number(row.unanswered_count || 0),
            timeTakenSeconds: Number(row.time_taken_seconds || 0),
            isPassed: score >= totalMarks * 0.5,
            submittedAt: row.submitted_at || row.updated_at,
          });
        }
      }
    }
  } catch (err) {
    console.error("Error in getStudentLatestAttemptsMap:", err);
  }

  // Memory fallback
  for (const attempt of memoryAttempts.values()) {
    if (
      attempt.status === "evaluated" &&
      (attempt.student_id === studentId ||
        (canonicalUserId && attempt.canonical_user_id === canonicalUserId))
    ) {
      if (!map.has(attempt.test_item_id)) {
        const score = Number(attempt.score || 0);
        const totalMarks = Number(attempt.total_marks || 100);
        map.set(attempt.test_item_id, {
          id: attempt.id,
          status: attempt.status,
          score,
          totalMarks,
          accuracy: Math.round(Number(attempt.accuracy || 0)),
          attemptedCount: Number(attempt.attempted_count || 0),
          correctCount: Number(attempt.correct_count || 0),
          incorrectCount: Number(attempt.incorrect_count || 0),
          unansweredCount: Number(attempt.unanswered_count || 0),
          timeTakenSeconds: Number(attempt.time_taken_seconds || 0),
          isPassed: score >= totalMarks * 0.5,
          submittedAt: attempt.submitted_at || attempt.updated_at,
        });
      }
    }
  }

  return map;
}

/**
 * Fetch test series items for a specific series or all published items,
 * optionally enriched with the student's latest attempt.
 */
export async function getTestSeriesItems(
  seriesId?: string,
  categoryId?: string,
  studentId?: string,
  canonicalUserId?: string
): Promise<TestSeriesItem[]> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("test_series_items")
    .select("*, test_series(id, title, slug, is_paid, price, category_id)")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (seriesId) {
    query = query.eq("series_id", seriesId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getTestSeriesItems error:", error.message);
    return [];
  }

  let filtered = data ?? [];
  if (categoryId) {
    filtered = filtered.filter(
      (item: any) => item.test_series?.category_id === categoryId
    );
  }

  if (studentId || canonicalUserId) {
    const attemptsMap = await getStudentLatestAttemptsMap(
      studentId,
      canonicalUserId
    );
    return filtered.map((item: any) => ({
      ...item,
      latestAttempt: attemptsMap.get(item.id) || null,
    }));
  }

  return filtered;
}

/**
 * Fetch a single test series item by ID or Slug
 */
export async function getTestSeriesItemById(
  id: string
): Promise<TestSeriesItem | null> {
  const supabase = getSupabaseAdminClient();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (isUuid) {
    const { data } = await supabase
      .from("test_series_items")
      .select("*, test_series(id, title, slug, is_paid, price, category_id)")
      .eq("id", id)
      .maybeSingle();

    if (data) return data as TestSeriesItem;
  }

  // Lookup across published items if slug or title matches
  const { data: allItems } = await supabase
    .from("test_series_items")
    .select("*, test_series(id, title, slug, is_paid, price, category_id)")
    .eq("is_published", true);

  if (allItems) {
    const match = allItems.find(
      (item: any) =>
        item.id === id ||
        item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") ===
          id.toLowerCase().trim()
    );
    if (match) return match as TestSeriesItem;
  }

  // Fallback: Check if id is a chapter ID in `chapters` table
  if (isUuid) {
    const { data: chap } = await supabase
      .from("chapters")
      .select("id, title, sort_order")
      .eq("id", id)
      .maybeSingle();

    if (chap) {
      // Find matching test item in chapterwise series
      const { data: seriesItems } = await supabase
        .from("test_series_items")
        .select("*, test_series(id, title, slug, is_paid, price, category_id)")
        .eq("series_id", "2db0e35e-83a5-4323-800a-c860c59bdbc5")
        .eq("is_published", true);

      if (seriesItems && seriesItems.length > 0) {
        const meta = CHAPTER_TEST_ITEMS_MAP[(chap as any).sort_order];
        const match =
          (meta && seriesItems.find((s) => s.id === meta.id)) ||
          seriesItems.find(
            (s) =>
              s.title.toLowerCase().includes((chap as any).title.toLowerCase()) ||
              (chap as any).title.toLowerCase().includes(s.title.toLowerCase())
          );
        if (match) return match as TestSeriesItem;
      }
    }
  }

  return null;
}

/**
 * Fetch all active chapters
 */
export async function getChapters(): Promise<Chapter[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getChapters error:", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Fetch raw questions for a test item from Supabase
 */
export async function getRawQuestionsForTest(
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

  if (!directErr && directData && directData.length > 0) {
    return directData as Question[];
  }

  // 2. Fallback to junction table test_questions
  const { data: junctionData, error: junctionErr } = await supabase
    .from("test_questions")
    .select("*, questions(*)")
    .eq("test_series_item_id", testItemId)
    .order("question_order", { ascending: true });

  if (!junctionErr && junctionData && junctionData.length > 0) {
    return junctionData
      .map((item: any) => item.questions)
      .filter((q: any) => q && q.is_active) as Question[];
  }

  // 3. Fallback: Check if testItemId is directly a chapter_id in questions
  const { data: directChapQuestions } = await supabase
    .from("questions")
    .select("*")
    .eq("chapter_id", testItemId)
    .eq("is_active", true)
    .limit(100);

  if (directChapQuestions && directChapQuestions.length > 0) {
    return directChapQuestions as Question[];
  }

  // 4. Fallback: Check if testItemId is mapped in CHAPTER_TEST_ITEMS_MAP
  for (const [sortOrder, meta] of Object.entries(CHAPTER_TEST_ITEMS_MAP)) {
    if (meta.id === testItemId) {
      const { data: chapter } = await supabase
        .from("chapters")
        .select("id")
        .eq("sort_order", Number(sortOrder))
        .maybeSingle();

      if (chapter && (chapter as any).id) {
        const { data: chapQuestions } = await supabase
          .from("questions")
          .select("*")
          .eq("chapter_id", (chapter as any).id)
          .eq("is_active", true)
          .limit(100);

        if (chapQuestions && chapQuestions.length > 0) {
          return chapQuestions as Question[];
        }
      }
    }
  }

  return [];
}

/**
 * Sanitize question by removing correct_option and explanations
 */
function sanitizeQuestion(q: Question): SanitizedQuestion {
  return {
    id: q.id,
    chapter_id: q.chapter_id,
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
    difficulty: q.difficulty,
    question_type: q.question_type,
    option_type: q.option_type,
  };
}

/**
 * START ATTEMPT:
 * Initiates an attempt session, verifies test item, records server start time,
 * and returns sanitized questions WITHOUT correct options or explanations.
 */
export async function startTestAttempt(params: {
  studentId: string;
  canonicalUserId?: string;
  studentName?: string;
  studentUsername?: string;
  studentType?: "telegram" | "web" | "guest" | "preview";
  testItemId: string;
}) {
  const item = await getTestSeriesItemById(params.testItemId);
  if (!item) {
    throw new Error("Test not found or unpublished");
  }

  const rawQuestions = await getRawQuestionsForTest(item.id);
  if (!rawQuestions || rawQuestions.length === 0) {
    throw new Error("No questions available for this test");
  }

  const sanitized = rawQuestions.map(sanitizeQuestion);
  const now = new Date().toISOString();
  const supabase = getSupabaseAdminClient();

  // Check if an attempt already exists for this student and test item to avoid duplicate history!
  let existingAttemptId: string | null = null;
  let existingCreatedAt: string | null = null;

  try {
    let query = supabase
      .from("student_test_attempts")
      .select("id, created_at")
      .eq("test_item_id", item.id);

    if (params.studentId && params.canonicalUserId) {
      query = query.or(
        `student_id.eq.${params.studentId},canonical_user_id.eq.${params.canonicalUserId}`
      );
    } else if (params.studentId) {
      query = query.eq("student_id", params.studentId);
    } else if (params.canonicalUserId) {
      query = query.eq("canonical_user_id", params.canonicalUserId);
    }

    const { data: existingAttempts } = await query.order("updated_at", {
      ascending: false,
    });
    if (existingAttempts && existingAttempts.length > 0) {
      existingAttemptId = existingAttempts[0].id;
      existingCreatedAt = existingAttempts[0].created_at;

      // Clean up legacy duplicate rows if multiple existed previously
      if (existingAttempts.length > 1) {
        const extraIds = existingAttempts.slice(1).map((a: any) => a.id);
        await supabase.from("student_test_attempts").delete().in("id", extraIds);
      }
    }
  } catch (err) {
    console.warn("Could not check existing attempt:", err);
  }

  // Memory fallback check if not found in DB
  if (!existingAttemptId) {
    for (const att of memoryAttempts.values()) {
      if (
        att.test_item_id === item.id &&
        (att.student_id === params.studentId ||
          (params.canonicalUserId &&
            att.canonical_user_id === params.canonicalUserId))
      ) {
        existingAttemptId = att.id;
        existingCreatedAt = att.created_at;
        break;
      }
    }
  }

  const attemptId = existingAttemptId || crypto.randomUUID();

  const attemptRecord: StudentTestAttempt = {
    id: attemptId,
    student_id: params.studentId,
    canonical_user_id: params.canonicalUserId || null,
    student_type: params.studentType || "telegram",
    student_name: params.studentName || null,
    student_username: params.studentUsername || null,
    test_item_id: item.id,
    series_id: item.series_id || null,
    status: "in_progress",
    started_at: now,
    duration_allowed_minutes: item.duration || 90,
    time_taken_seconds: 0,
    total_questions: sanitized.length,
    attempted_count: 0,
    correct_count: 0,
    incorrect_count: 0,
    unanswered_count: sanitized.length,
    score: 0,
    total_marks: item.total_marks || sanitized.length,
    accuracy: 0,
    negative_marking_applied: 0,
    created_at: existingCreatedAt || now,
    updated_at: now,
    test_item: item,
  };

  // Persist attempt: UPDATE existing single row or INSERT new single row
  try {
    const updatePayload: any = {
      canonical_user_id: params.canonicalUserId || null,
      student_type: params.studentType || "telegram",
      student_name: params.studentName || null,
      student_username: params.studentUsername || null,
      status: "in_progress",
      started_at: now,
      submitted_at: null,
      duration_allowed_minutes: item.duration || 90,
      time_taken_seconds: 0,
      total_questions: sanitized.length,
      attempted_count: 0,
      correct_count: 0,
      incorrect_count: 0,
      unanswered_count: sanitized.length,
      score: 0,
      total_marks: item.total_marks || sanitized.length,
      accuracy: 0,
      negative_marking_applied: 0,
      updated_at: now,
    };

    let opErr: any;
    if (existingAttemptId) {
      const res = await (supabase as any)
        .from("student_test_attempts")
        .update(updatePayload)
        .eq("id", existingAttemptId);
      opErr = res.error;
    } else {
      const insertPayload = {
        id: attemptId,
        student_id: params.studentId,
        test_item_id: item.id,
        series_id: item.series_id || null,
        ...updatePayload,
      };
      const res = await (supabase as any).from("student_test_attempts").insert(insertPayload);
      opErr = res.error;
    }

    if (opErr && (opErr as any).code === "23503") {
      updatePayload.canonical_user_id = null;
      if (existingAttemptId) {
        await (supabase as any)
          .from("student_test_attempts")
          .update(updatePayload)
          .eq("id", existingAttemptId);
      } else {
        await (supabase as any).from("student_test_attempts").insert({
          id: attemptId,
          student_id: params.studentId,
          test_item_id: item.id,
          series_id: item.series_id || null,
          ...updatePayload,
        });
      }
    }
  } catch (err) {
    // If table doesn't exist yet, gracefully fall back to memory
  }

  // Reset in memory cache for low-latency lookups
  memoryAttempts.set(attemptId, attemptRecord);
  memoryAnswers.set(attemptId, new Map());

  return {
    attemptId,
    testItem: item,
    questions: sanitized,
    startedAt: now,
    durationMinutes: item.duration || 90,
  };
}

/**
 * SAVE ANSWER:
 * In-memory low-latency response tracking during the test.
 * Optimized for minimal DB costs: Zero intermediate DB writes per question!
 */
export async function saveAttemptAnswer(params: {
  studentId: string;
  attemptId: string;
  questionId: string;
  selectedOption: "A" | "B" | "C" | "D" | null;
  isFlagged?: boolean;
  timeSpentSeconds?: number;
}) {
  const attempt = memoryAttempts.get(params.attemptId);
  if (!attempt || attempt.student_id !== params.studentId) {
    throw new Error("Attempt not found or unauthorized");
  }

  if (attempt.status !== "in_progress") {
    throw new Error("Attempt is already finalized or expired");
  }

  const answersMap =
    memoryAnswers.get(params.attemptId) || new Map<string, StudentAttemptAnswer>();

  const existingAnswer = answersMap.get(params.questionId);
  const updatedAnswer: StudentAttemptAnswer = {
    attempt_id: params.attemptId,
    question_id: params.questionId,
    selected_option: params.selectedOption,
    is_flagged: params.isFlagged ?? existingAnswer?.is_flagged ?? false,
    time_spent_seconds:
      (existingAnswer?.time_spent_seconds || 0) +
      (params.timeSpentSeconds || 0),
  };

  answersMap.set(params.questionId, updatedAnswer);
  memoryAnswers.set(params.attemptId, answersMap);

  return { success: true };
}

/**
 * SUBMIT ATTEMPT:
 * Server-side evaluation against authoritative answer keys, scoring, negative marking,
 * point awarding (+1 per correct answer), and atomic persistence.
 */
export async function submitTestAttempt(params: {
  studentId: string;
  attemptId: string;
  canonicalUserId?: string;
  answers?:
    | Record<
        string,
        {
          selectedOption: "A" | "B" | "C" | "D" | null;
          isFlagged?: boolean;
          timeSpentSeconds?: number;
        }
      >
    | Array<{
        questionId: string;
        selectedOption: "A" | "B" | "C" | "D" | null;
        isFlagged?: boolean;
        timeSpentSeconds?: number;
      }>;
}) {
  let attempt = memoryAttempts.get(params.attemptId);
  if (!attempt) {
    const supabase = getSupabaseAdminClient();
    try {
      const { data: dbAttempt } = await (supabase as any)
        .from("student_test_attempts")
        .select("*, test_item:test_series_items(*)")
        .eq("id", params.attemptId)
        .maybeSingle();

      if (dbAttempt) {
        attempt = {
          id: dbAttempt.id,
          student_id: dbAttempt.student_id,
          canonical_user_id: dbAttempt.canonical_user_id,
          student_type: dbAttempt.student_type,
          student_name: dbAttempt.student_name,
          student_username: dbAttempt.student_username,
          test_item_id: dbAttempt.test_item_id,
          series_id: dbAttempt.series_id,
          status: dbAttempt.status,
          started_at: dbAttempt.started_at,
          submitted_at: dbAttempt.submitted_at,
          time_taken_seconds: dbAttempt.time_taken_seconds || 0,
          duration_allowed_minutes: dbAttempt.duration_allowed_minutes || 90,
          total_questions: dbAttempt.total_questions || 0,
          attempted_count: dbAttempt.attempted_count || 0,
          correct_count: dbAttempt.correct_count || 0,
          incorrect_count: dbAttempt.incorrect_count || 0,
          unanswered_count: dbAttempt.unanswered_count || 0,
          score: parseFloat(dbAttempt.score || "0"),
          total_marks: parseFloat(dbAttempt.total_marks || "100"),
          accuracy: parseFloat(dbAttempt.accuracy || "0"),
          negative_marking_applied: parseFloat(dbAttempt.negative_marking_applied || "0"),
          created_at: dbAttempt.created_at,
          updated_at: dbAttempt.updated_at,
          test_item: dbAttempt.test_item,
        };
        memoryAttempts.set(params.attemptId, attempt);
      }
    } catch (err) {
      console.warn("DB attempt fallback lookup error:", err);
    }
  }

  if (!attempt || attempt.student_id !== params.studentId) {
    throw new Error("Attempt not found or unauthorized");
  }

  if (attempt.status === "evaluated" || attempt.status === "submitted") {
    // Return existing evaluation idempotently
    return getAttemptReview(params.studentId, params.attemptId);
  }

  // Populate answersMap from payload if provided
  if (params.answers) {
    const map =
      memoryAnswers.get(params.attemptId) ||
      new Map<string, StudentAttemptAnswer>();

    if (Array.isArray(params.answers)) {
      params.answers.forEach((ans) => {
        map.set(ans.questionId, {
          attempt_id: params.attemptId,
          question_id: ans.questionId,
          selected_option: ans.selectedOption,
          is_flagged: ans.isFlagged || false,
          time_spent_seconds: ans.timeSpentSeconds || 0,
        });
      });
    } else {
      Object.entries(params.answers).forEach(([qId, ans]) => {
        map.set(qId, {
          attempt_id: params.attemptId,
          question_id: qId,
          selected_option: ans.selectedOption,
          is_flagged: ans.isFlagged || false,
          time_spent_seconds: ans.timeSpentSeconds || 0,
        });
      });
    }
    memoryAnswers.set(params.attemptId, map);
  }

  const item = await getTestSeriesItemById(attempt.test_item_id);
  if (!item) {
    throw new Error("Test configuration missing");
  }

  const rawQuestions = await getRawQuestionsForTest(item.id);
  const questionMap = new Map(rawQuestions.map((q) => [q.id, q]));

  const answersMap =
    memoryAnswers.get(params.attemptId) || new Map<string, StudentAttemptAnswer>();

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let calculatedScore = 0;

  const evaluatedReviews: EvaluatedQuestionReview[] = [];

  rawQuestions.forEach((q) => {
    const userAns = answersMap.get(q.id);
    const selectedOption = userAns?.selected_option || null;
    const isCorrect = selectedOption === q.correct_option;

    if (!selectedOption) {
      unansweredCount++;
    } else if (isCorrect) {
      correctCount++;
      calculatedScore += 1;
    } else {
      incorrectCount++;
      if (item.negative_marking_enabled) {
        calculatedScore -= item.negative_marks || 0.25;
      }
    }

    evaluatedReviews.push({
      ...sanitizeQuestion(q),
      correct_option: q.correct_option,
      explanation_en: q.explanation_en,
      explanation_hi: q.explanation_hi,
      user_selected_option: selectedOption,
      is_correct: isCorrect,
      is_flagged: userAns?.is_flagged || false,
      time_spent_seconds: userAns?.time_spent_seconds || 0,
    });
  });

  const attemptedCount = correctCount + incorrectCount;
  const finalScore = Math.max(0, parseFloat(calculatedScore.toFixed(2)));
  const accuracy =
    attemptedCount > 0
      ? Math.round((correctCount / attemptedCount) * 100)
      : 0;

  const startTime = new Date(attempt.started_at).getTime();
  const timeTakenSeconds = Math.max(
    0,
    Math.floor((Date.now() - startTime) / 1000)
  );

  const submittedAt = new Date().toISOString();

  // Update attempt record
  const updatedAttempt: StudentTestAttempt = {
    ...attempt,
    status: "evaluated",
    submitted_at: submittedAt,
    time_taken_seconds: timeTakenSeconds,
    attempted_count: attemptedCount,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    unanswered_count: unansweredCount,
    score: finalScore,
    total_marks: rawQuestions.length,
    accuracy,
    updated_at: submittedAt,
    test_item: item,
  };

  memoryAttempts.set(params.attemptId, updatedAttempt);

  // Sync evaluated attempt to Supabase (score-only, 1-row update)
  const supabase = getSupabaseAdminClient();
  try {
    const { error: upsertErr } = await (supabase as any).from("student_test_attempts").upsert({
      id: params.attemptId,
      student_id: params.studentId,
      canonical_user_id: params.canonicalUserId || null,
      test_item_id: item.id,
      status: "evaluated",
      submitted_at: submittedAt,
      time_taken_seconds: timeTakenSeconds,
      attempted_count: attemptedCount,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      unanswered_count: unansweredCount,
      score: finalScore,
      total_marks: rawQuestions.length,
      accuracy,
      updated_at: submittedAt,
    });

    if (upsertErr) {
      console.error("[TestEngine] Error upserting student_test_attempts:", upsertErr);
    }

    // Official CCC Rule: Student must pass (score >= 50%) to qualify for Leaderboard entry!
    const passingPercentage = rawQuestions.length > 0 ? (correctCount / rawQuestions.length) * 100 : 0;
    const isPassed = passingPercentage >= 50;
    const pointsToAward = isPassed ? correctCount : 0;

    // Award leaderboard points (+1 per correct answer) ONLY IF student passed (score >= 50%)
    if (params.canonicalUserId && pointsToAward > 0) {
      const { error: lbErr } = await (supabase as any)
        .from("leaderboard_point_events")
        .upsert(
          {
            canonical_user_id: params.canonicalUserId,
            attempt_id: params.attemptId,
            test_item_id: item.id,
            points_awarded: pointsToAward,
            correct_count: correctCount,
            total_questions: rawQuestions.length,
            created_at: submittedAt,
          },
          { onConflict: "attempt_id" }
        );

      if (lbErr) {
        console.error("[TestEngine] Error recording leaderboard point event:", lbErr);
      }
    }
  } catch (err) {
    console.error("[TestEngine] Unexpected error during attempt evaluation persistence:", err);
  }

  const passingPercentage = rawQuestions.length > 0 ? (correctCount / rawQuestions.length) * 100 : 0;
  const isPassed = passingPercentage >= 50;
  const pointsAwarded = isPassed ? correctCount : 0;

  return {
    attempt: updatedAttempt,
    evaluatedReviews,
    pointsAwarded,
    isPassed,
  };
}

/**
 * Fetch all completed results for a student, deduplicated by test_item_id
 * so each test item only appears once with its latest updated result.
 */
export async function getStudentResults(
  studentId: string,
  canonicalUserId?: string
): Promise<StudentTestAttempt[]> {
  const supabase = getSupabaseAdminClient();
  let rawList: StudentTestAttempt[] = [];

  try {
    let query = supabase
      .from("student_test_attempts")
      .select("*, test_item:test_series_items(id, title, duration, total_marks)")
      .eq("status", "evaluated");

    if (studentId && canonicalUserId) {
      query = query.or(
        `student_id.eq.${studentId},canonical_user_id.eq.${canonicalUserId}`
      );
    } else if (studentId) {
      query = query.eq("student_id", studentId);
    } else if (canonicalUserId) {
      query = query.eq("canonical_user_id", canonicalUserId);
    }

    const { data, error } = await query.order("submitted_at", { ascending: false });

    if (!error && data && data.length > 0) {
      rawList = data as StudentTestAttempt[];
    }
  } catch {
    // Fallback
  }

  // Memory fallback
  if (rawList.length === 0) {
    for (const attempt of memoryAttempts.values()) {
      if (
        attempt.status === "evaluated" &&
        (attempt.student_id === studentId ||
          (canonicalUserId && attempt.canonical_user_id === canonicalUserId))
      ) {
        rawList.push(attempt);
      }
    }
    rawList.sort(
      (a, b) =>
        new Date(b.submitted_at || b.created_at).getTime() -
        new Date(a.submitted_at || a.created_at).getTime()
    );
  }

  // Deduplicate by test_item_id: exactly 1 card per test item showing latest result
  const uniqueByItem = new Map<string, StudentTestAttempt>();
  for (const att of rawList) {
    if (!uniqueByItem.has(att.test_item_id)) {
      uniqueByItem.set(att.test_item_id, att);
    }
  }

  return Array.from(uniqueByItem.values());
}

/**
 * Fetch review of a specific attempt with solutions & explanations
 */
export async function getAttemptReview(
  studentId: string,
  attemptId: string
) {
  let attempt = memoryAttempts.get(attemptId);

  if (!attempt) {
    const supabase = getSupabaseAdminClient();
    try {
      const { data } = await supabase
        .from("student_test_attempts")
        .select("*, test_item:test_series_items(id, title, duration, total_marks)")
        .eq("id", attemptId)
        .eq("student_id", studentId)
        .maybeSingle();

      if (data) {
        attempt = data as StudentTestAttempt;
      }
    } catch {
      // Ignore
    }
  }

  if (!attempt || attempt.student_id !== studentId) {
    throw new Error("Attempt not found or unauthorized");
  }

  const rawQuestions = await getRawQuestionsForTest(attempt.test_item_id);
  const answersMap =
    memoryAnswers.get(attemptId) || new Map<string, StudentAttemptAnswer>();

  const evaluatedReviews: EvaluatedQuestionReview[] = rawQuestions.map((q) => {
    const userAns = answersMap.get(q.id);
    const selectedOption = userAns?.selected_option || null;
    return {
      ...sanitizeQuestion(q),
      correct_option: q.correct_option,
      explanation_en: q.explanation_en,
      explanation_hi: q.explanation_hi,
      user_selected_option: selectedOption,
      is_correct: selectedOption === q.correct_option,
      is_flagged: userAns?.is_flagged || false,
      time_spent_seconds: userAns?.time_spent_seconds || 0,
    };
  });

  return {
    attempt,
    evaluatedReviews,
  };
}
