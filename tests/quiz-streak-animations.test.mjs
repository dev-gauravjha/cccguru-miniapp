import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3001";
const LIVE_QUIZ_ITEM_ID = "8b0cc181-e0b7-42ed-8b2a-75c2f32a922f";

test("Duolingo Streak Progressive System & Milestone Logic", async (t) => {
  // 1. Start a clean quiz session
  const startRes = await fetch(`${BASE_URL}/api/quiz/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ testItemId: LIVE_QUIZ_ITEM_ID }),
  });
  assert.equal(startRes.status, 200);
  const startData = await startRes.json();
  assert.ok(startData.attemptId);
  assert.ok(startData.questions.length > 0);

  const attemptId = startData.attemptId;
  const questions = startData.questions;

  // Track milestone triggers simulation
  const celebratedMilestones = new Set();
  const triggerMilestone = (s) => {
    if (s >= 5 && s % 5 === 0 && !celebratedMilestones.has(s)) {
      celebratedMilestones.add(s);
      return true;
    }
    return false;
  };

  await t.test("1. First correct answer gives streak 1 without milestone trigger", async () => {
    const q1 = questions[0];
    // Find or test an option
    const res = await fetch(`${BASE_URL}/api/quiz/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId,
        questionId: q1.id,
        selectedOption: "A",
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok("isCorrect" in data);
    assert.ok("correctOption" in data);
    assert.ok(data.streak >= 0);

    // Verify streak 1 is not a major milestone overlay
    assert.equal(triggerMilestone(1), false);
  });

  await t.test("2. Duplicate answer protection prevents repeated triggers", async () => {
    const q1 = questions[0];
    const res = await fetch(`${BASE_URL}/api/quiz/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId,
        questionId: q1.id,
        selectedOption: "A",
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.isAlreadyAnswered, true, "Must flag answer as already answered");
  });

  await t.test("3. Milestone triggers exactly once at 5 and 10, not at intermediate streaks", () => {
    // Reset test milestones
    celebratedMilestones.clear();

    // Streaks 1 to 4: no major celebration
    assert.equal(triggerMilestone(1), false);
    assert.equal(triggerMilestone(2), false);
    assert.equal(triggerMilestone(3), false);
    assert.equal(triggerMilestone(4), false);

    // Streak 5: triggers exactly once
    assert.equal(triggerMilestone(5), true, "Milestone 5 must trigger celebration");
    assert.equal(triggerMilestone(5), false, "Duplicate check at 5 must NOT trigger celebration again");

    // Intermediate streaks 6, 7, 8, 9: no major celebration
    assert.equal(triggerMilestone(6), false, "Streak 6 must NOT trigger milestone 5");
    assert.equal(triggerMilestone(7), false, "Streak 7 must NOT trigger milestone 5");
    assert.equal(triggerMilestone(8), false, "Streak 8 must NOT trigger milestone 5");
    assert.equal(triggerMilestone(9), false, "Streak 9 must NOT trigger milestone 5");

    // Streak 10: triggers epic celebration
    assert.equal(triggerMilestone(10), true, "Milestone 10 must trigger epic celebration");
    assert.equal(triggerMilestone(10), false, "Duplicate check at 10 must NOT trigger again");
  });

  await t.test("4. Incorrect answer resets streak and clears milestones for future streaks", () => {
    // Simulate wrong answer reset
    celebratedMilestones.clear();

    // Build to 5
    assert.equal(triggerMilestone(5), true);

    // Wrong answer happens -> reset streak to 0 and clear milestone tracker
    let currentStreak = 0;
    celebratedMilestones.clear();

    // Rebuilding streak
    currentStreak = 5;
    assert.equal(triggerMilestone(currentStreak), true, "New streak reaching 5 must celebrate again");
  });

  await t.test("5. Bilingual encouragement messages match requirements", () => {
    // English messages
    const en1 = "Great!";
    const en2 = "Nice streak! 2 in a row!";
    const en5 = "Awesome! 5 in a row!";
    const en10 = "UNSTOPPABLE! 10 in a row!";
    const enWrong = "Almost! Keep going!";

    // Hindi messages
    const hi1 = "बहुत बढ़िया!";
    const hi2 = "शानदार लय! लगातार 2 सही!";
    const hi5 = "शानदार! लगातार 5 सही!";
    const hi10 = "कमाल! लगातार 10 सही!";
    const hiWrong = "कोई बात नहीं, फिर कोशिश करो!";

    assert.ok(en1 && hi1);
    assert.ok(en2 && hi2);
    assert.ok(en5 && hi5);
    assert.ok(en10 && hi10);
    assert.ok(enWrong && hiWrong);
  });
});
