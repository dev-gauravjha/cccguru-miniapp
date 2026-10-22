import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3001";
const TEST_ITEM_ID = "c2118de7-a366-445d-b872-670bdd105b0a"; // Full Mock Test - 01
const QUIZ_ITEM_ID = "8b0cc181-e0b7-42ed-8b2a-75c2f32a922f";

test("Reattempt Flow: Reuses existing attempt ID to update item and prevent duplicate records", async () => {
  const testStudentId = `test_student_${Date.now()}`;

  // 1. Initially, test catalog has no attempt for this fresh student
  const catalogRes1 = await fetch(`${BASE_URL}/api/mini-app/tests?studentId=${testStudentId}`);
  assert.equal(catalogRes1.status, 200);
  const catalog1 = await catalogRes1.json();
  const testItem1 = catalog1.items.find((i) => i.id === TEST_ITEM_ID);
  assert.ok(testItem1, "Test item must exist in catalog");
  assert.equal(testItem1.latestAttempt, null, "Should have no initial attempt");

  // 2. Start initial attempt
  const startRes1 = await fetch(`${BASE_URL}/api/mini-app/attempts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      testItemId: TEST_ITEM_ID,
      studentId: testStudentId,
    }),
  });
  assert.equal(startRes1.status, 200);
  const startData1 = await startRes1.json();
  const firstAttemptId = startData1.attemptId;
  assert.ok(firstAttemptId, "Must return valid attemptId");

  // 3. Submit first attempt
  const submitRes1 = await fetch(`${BASE_URL}/api/mini-app/attempts/${firstAttemptId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      answers: {},
      studentId: testStudentId,
    }),
  });
  assert.equal(submitRes1.status, 200);

  // 4. Verify test catalog now reflects latestAttempt
  const catalogRes2 = await fetch(`${BASE_URL}/api/mini-app/tests?studentId=${testStudentId}`);
  const catalog2 = await catalogRes2.json();
  const testItem2 = catalog2.items.find((i) => i.id === TEST_ITEM_ID);
  assert.ok(testItem2.latestAttempt, "Catalog must return latestAttempt after submission");
  assert.equal(testItem2.latestAttempt.id, firstAttemptId);

  // 5. REATTEMPT: Start attempt again for the SAME student and test item
  const startRes2 = await fetch(`${BASE_URL}/api/mini-app/attempts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      testItemId: TEST_ITEM_ID,
      studentId: testStudentId,
    }),
  });
  assert.equal(startRes2.status, 200);
  const startData2 = await startRes2.json();
  const reattemptId = startData2.attemptId;

  // Crucial requirement: Must reuse existing attempt ID to avoid duplicate history!
  assert.equal(
    reattemptId,
    firstAttemptId,
    "Reattempting must reuse existing attempt row rather than generating duplicate records"
  );

  // 6. Submit the reattempt
  const submitRes2 = await fetch(`${BASE_URL}/api/mini-app/attempts/${reattemptId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      answers: {},
      studentId: testStudentId,
    }),
  });
  assert.equal(submitRes2.status, 200);

  // 7. Check results history: exactly 1 record must exist for this test item (no duplicates!)
  const resultsRes = await fetch(`${BASE_URL}/api/mini-app/results?studentId=${testStudentId}`);
  assert.equal(resultsRes.status, 200);
  const resultsData = await resultsRes.json();
  const itemResults = resultsData.results.filter((r) => r.test_item_id === TEST_ITEM_ID);
  assert.equal(
    itemResults.length,
    1,
    "Exactly one attempt record must exist in history for this test item, avoiding duplicates"
  );
});

test("Quiz Reattempt Flow: Reuses existing attempt record for quiz session", async () => {
  const testQuizStudentId = `quiz_student_${Date.now()}`;

  // 1. Start initial quiz session
  const startRes1 = await fetch(`${BASE_URL}/api/quiz/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      testItemId: QUIZ_ITEM_ID,
      studentId: testQuizStudentId,
    }),
  });
  assert.equal(startRes1.status, 200);
  const startData1 = await startRes1.json();
  const firstAttemptId = startData1.attemptId;
  assert.ok(firstAttemptId);

  // 2. Complete quiz session
  const completeRes1 = await fetch(`${BASE_URL}/api/quiz/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attemptId: firstAttemptId,
    }),
  });
  assert.equal(completeRes1.status, 200);

  // 3. Verify quiz catalog displays latestAttempt
  const catalogRes = await fetch(`${BASE_URL}/api/quiz/catalog?studentId=${testQuizStudentId}`);
  assert.equal(catalogRes.status, 200);
  const catalog = await catalogRes.json();
  const quizItem = catalog.quizItems.find((q) => q.id === QUIZ_ITEM_ID);
  assert.ok(quizItem, "Quiz item must exist in catalog");
  assert.ok(quizItem.latestAttempt, "Quiz item must have latestAttempt attached");
  assert.equal(quizItem.latestAttempt.id, firstAttemptId);

  // 4. Reattempt the quiz: must reuse the same attempt ID
  const startRes2 = await fetch(`${BASE_URL}/api/quiz/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      testItemId: QUIZ_ITEM_ID,
      studentId: testQuizStudentId,
    }),
  });
  assert.equal(startRes2.status, 200);
  const startData2 = await startRes2.json();
  assert.equal(
    startData2.attemptId,
    firstAttemptId,
    "Quiz reattempt must reuse the existing attempt ID instead of creating duplicate records"
  );
});
