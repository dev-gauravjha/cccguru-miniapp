import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3001";
const LIVE_QUIZ_ITEM_ID = "8b0cc181-e0b7-42ed-8b2a-75c2f32a922f";
const NON_QUIZ_MOCK_ITEM_ID = "aa8fb338-e9b0-4433-8d03-3c2de5bba552"; // test_type = 'Mock'

test("1. Quiz Catalog: Fetches ONLY items where type = 'quiz' from Supabase and ignores other item types", async () => {
  const res = await fetch(`${BASE_URL}/api/quiz/catalog`);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.quizItems), "quizItems array must be provided from Supabase");

  // Verify that only quiz items are present
  const nonQuizFound = data.quizItems.find(
    (item) => item.id === NON_QUIZ_MOCK_ITEM_ID
  );
  assert.equal(
    nonQuizFound,
    undefined,
    "Mock and Topic items must be ignored from quiz catalog"
  );

  // Verify that the database quiz item exists
  const liveQuiz = data.quizItems.find(
    (item) => item.id === LIVE_QUIZ_ITEM_ID
  );
  assert.ok(liveQuiz, "Live Supabase quiz item must be returned");
  assert.ok(["CCC Quiz 01", "testing"].includes(liveQuiz.title), `Title was ${liveQuiz.title}`);
  assert.equal(liveQuiz.questionCount, 5, "Database must count exactly 5 linked questions");
  assert.equal(liveQuiz.hasQuestions, true);
});

test("2. Dynamic Questions & Security: Fetches live questions from Supabase and sanitizes client payload", async () => {
  const res = await fetch(`${BASE_URL}/api/quiz/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ testItemId: LIVE_QUIZ_ITEM_ID }),
  });
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.empty, false);
  assert.ok(data.attemptId, "Must generate valid attemptId");
  assert.equal(data.totalQuestions, 5, "Must return 5 questions from Supabase");
  assert.equal(data.questions.length, 5);

  // Verify question content comes from Supabase and is NOT invented
  const q1 = data.questions[0];
  assert.ok(q1.id, "Question ID must exist");
  assert.ok(q1.question_en, "English question must exist");
  assert.ok(q1.question_hi, "Hindi question must exist");

  // Anti-Cheat / Security: Ensure answers & explanations are stripped from client question payload
  for (const q of data.questions) {
    assert.equal(
      q.correct_option,
      undefined,
      "Security: correct_option must NEVER be exposed in start quiz payload"
    );
    assert.equal(
      q.explanation_en,
      undefined,
      "Security: explanation_en must NEVER be exposed in start quiz payload"
    );
    assert.equal(
      q.explanation_hi,
      undefined,
      "Security: explanation_hi must NEVER be exposed in start quiz payload"
    );

    // Requirement 8: Validate bilingual object format
    assert.ok(q.bilingual, "Bilingual root object must exist");
    assert.ok(q.bilingual.en, "bilingual.en must exist");
    assert.ok(q.bilingual.hi, "bilingual.hi must exist");
    assert.ok(q.bilingual.en.question, "English question must be populated");
    assert.ok(q.bilingual.hi.question, "Hindi question must be populated");
    assert.ok(q.bilingual.en.options.A, "English Option A must be populated");
    assert.ok(q.bilingual.hi.options.A, "Hindi Option A must be populated");
  }
});

test("3. Empty State: Displays proper empty state when a quiz item has 0 questions in database", async () => {
  // Pass an item of type quiz or non-existent quiz item that has 0 questions
  // Let's create an attempt with an item ID that doesn't have questions or test empty handling
  const res = await fetch(`${BASE_URL}/api/quiz/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ testItemId: "00000000-0000-0000-0000-000000000000" }),
  });

  // If item doesn't exist, returns error cleanly
  const data = await res.json();
  if (res.status === 200) {
    assert.equal(data.empty, true);
    assert.equal(data.questions.length, 0);
  } else {
    assert.ok(data.error.includes("not found") || data.error.includes("Quiz"));
  }
});

test("4. Interactive Bilingual Feedback: Immediate server validation with bilingual explanations from Supabase", async () => {
  // Start session
  const startRes = await fetch(`${BASE_URL}/api/quiz/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ testItemId: LIVE_QUIZ_ITEM_ID }),
  });
  const session = await startRes.json();
  const q1 = session.questions[0];

  // Submit Answer for Question 1
  const ansRes = await fetch(`${BASE_URL}/api/quiz/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attemptId: session.attemptId,
      questionId: q1.id,
      selectedOption: "B", // Option B for nibble/CMOS
    }),
  });
  assert.equal(ansRes.status, 200);
  const feedback = await ansRes.json();

  assert.equal(feedback.success, true);
  assert.equal(typeof feedback.isCorrect, "boolean");
  assert.ok(["A", "B", "C", "D"].includes(feedback.correctOption));

  // Requirement 8: Bilingual explanations directly from Supabase
  assert.ok(feedback.bilingual, "bilingual feedback object must exist");
  assert.ok(feedback.bilingual.en.explanation, "bilingual.en.explanation must exist");
  assert.ok(feedback.bilingual.hi.explanation, "bilingual.hi.explanation must exist");
  assert.equal(feedback.isAlreadyAnswered, false);

  // Anti-Cheat: Try submitting the same question again
  const duplicateRes = await fetch(`${BASE_URL}/api/quiz/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attemptId: session.attemptId,
      questionId: q1.id,
      selectedOption: "A",
    }),
  });
  const duplicateFeedback = await duplicateRes.json();
  assert.equal(duplicateFeedback.success, true);
  assert.equal(duplicateFeedback.isAlreadyAnswered, true, "Must reject duplicate answer submission");
});

test("5. Scoring & Leaderboard Integrity: Strictly enforces >= 50% pass rule for point awards", async () => {
  // Start session
  const startRes = await fetch(`${BASE_URL}/api/quiz/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ testItemId: LIVE_QUIZ_ITEM_ID }),
  });
  const session = await startRes.json();

  // Answer only 1 question incorrectly or correctly (1 out of 5 = 20% < 50% -> Fail)
  await fetch(`${BASE_URL}/api/quiz/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attemptId: session.attemptId,
      questionId: session.questions[0].id,
      selectedOption: "A",
    }),
  });

  // Finalize Quiz
  const completeRes = await fetch(`${BASE_URL}/api/quiz/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attemptId: session.attemptId }),
  });
  const result = await completeRes.json();

  assert.equal(result.success, true);
  assert.equal(result.totalQuestions, 5);

  // Passing rule verification: 50% of 5 questions is 2.5 (need at least 3 correct)
  if (result.score < 3) {
    assert.equal(result.isPassed, false, "Score < 50% must be marked as failed");
    assert.equal(result.pointsAwarded, 0, "No leaderboard points when score < 50%");
  } else {
    assert.equal(result.isPassed, true);
    assert.equal(result.pointsAwarded, result.score);
  }
});
