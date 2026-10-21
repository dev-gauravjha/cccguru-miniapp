import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

// ==============================================================================
// 1. TELEGRAM STRICT 5-MINUTE EXPIRY & HMAC AUTH
// ==============================================================================

function verifyTelegramInitDataWithExpiry(initDataRaw, botToken, maxAgeSeconds = 300) {
  if (!initDataRaw || typeof initDataRaw !== "string") {
    return { isValid: false, error: "Missing or empty initData payload" };
  }
  if (!botToken) {
    return { isValid: false, error: "Missing botToken" };
  }

  try {
    const params = new URLSearchParams(initDataRaw);
    const hash = params.get("hash");
    if (!hash) {
      return { isValid: false, error: "Missing hash in initData" };
    }

    params.delete("hash");
    const keys = Array.from(params.keys()).sort();
    const dataCheckString = keys.map((k) => `${k}=${params.get(k)}`).join("\n");

    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    const hashBuffer = Buffer.from(hash, "hex");
    const calculatedBuffer = Buffer.from(calculatedHash, "hex");

    if (hashBuffer.length !== calculatedBuffer.length || !crypto.timingSafeEqual(hashBuffer, calculatedBuffer)) {
      return { isValid: false, error: "Invalid Telegram signature" };
    }

    const authDate = parseInt(params.get("auth_date") || "0", 10);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!authDate || (nowSeconds - authDate) > maxAgeSeconds) {
      return { isValid: false, error: "Authentication payload has expired (> 5 minutes)" };
    }

    const userRaw = params.get("user");
    if (!userRaw) {
      return { isValid: false, error: "Missing user identity in initData" };
    }

    const user = JSON.parse(userRaw);
    return { isValid: true, user, authDate };
  } catch (err) {
    return { isValid: false, error: err.message };
  }
}

function generateMockInitData(user, botToken, authDate = Math.floor(Date.now() / 1000)) {
  const params = new URLSearchParams();
  params.set("auth_date", authDate.toString());
  params.set("query_id", "AAG_LEADERBOARD_TEST");
  params.set("user", JSON.stringify(user));

  const keys = Array.from(params.keys()).sort();
  const dataCheckString = keys.map((k) => `${k}=${params.get(k)}`).join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  params.set("hash", hash);
  return params.toString();
}

test("Telegram Auth: Enforces strict 5-minute replay window (300 seconds)", () => {
  const botToken = "test_bot_token_secret_12345";
  const user = { id: 1001, first_name: "Amit" };

  // Fresh initData (10 seconds ago) -> valid
  const freshInitData = generateMockInitData(user, botToken, Math.floor(Date.now() / 1000) - 10);
  const freshResult = verifyTelegramInitDataWithExpiry(freshInitData, botToken, 300);
  assert.equal(freshResult.isValid, true);

  // Stale initData (301 seconds ago) -> rejected
  const staleInitData = generateMockInitData(user, botToken, Math.floor(Date.now() / 1000) - 301);
  const staleResult = verifyTelegramInitDataWithExpiry(staleInitData, botToken, 300);
  assert.equal(staleResult.isValid, false);
  assert.match(staleResult.error, /expired/i);
});

// ==============================================================================
// 2. SERVER-SIDE SCORE & LEADERBOARD POINT CALCULATION
// ==============================================================================

/**
 * Server-side evaluation simulating calculateAndSaveAttemptResult
 * Rules:
 * Rules:
 *  - Each correct answer: +1 leaderboard point ONLY IF overall score >= 50% (Exam Passed)
 *  - If score < 50% (Exam Failed): 0 leaderboard points awarded
 *  - Incorrect answer: 0 leaderboard points
 *  - Unanswered: 0 leaderboard points
 *  - Client-supplied scores, correct counts, or points are strictly ignored
 */
function evaluateQuizSubmission(serverQuestions, clientSubmittedAnswers, clientSubmittedScore) {
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  for (const q of serverQuestions) {
    const studentAnswer = clientSubmittedAnswers[q.id];
    if (studentAnswer === undefined || studentAnswer === null || studentAnswer === "") {
      unansweredCount++;
    } else if (String(studentAnswer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) {
      correctCount++;
    } else {
      incorrectCount++;
    }
  }

  // Authoritative server calculation
  const totalQuestions = serverQuestions.length;
  const authoritativeScore = correctCount; // 1 mark per question
  const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const isPassed = percentage >= 50;
  // Leaderboard entry strictly requires passing score >= 50%
  const leaderboardPoints = isPassed ? correctCount : 0;

  // Client score is disregarded
  return {
    correctCount,
    incorrectCount,
    unansweredCount,
    authoritativeScore,
    percentage,
    isPassed,
    leaderboardPoints,
    clientScoreDisregarded: clientSubmittedScore !== undefined && clientSubmittedScore !== authoritativeScore,
  };
}

test("Scoring: Server strictly awards points ONLY IF student passes (score >= 50%)", () => {
  const serverQuestions = [
    { id: "q1", correctAnswer: "B" },
    { id: "q2", correctAnswer: "True" },
    { id: "q3", correctAnswer: "A" },
    { id: "q4", correctAnswer: "D" },
    { id: "q5", correctAnswer: "False" },
  ];

  // Test Case A: 3/5 correct (60% >= 50% -> Passed)
  const passedClientAnswers = {
    q1: "B",      // correct -> +1
    q2: "True",   // correct -> +1
    q3: "C",      // incorrect -> 0
    // q4 unanswered -> 0
    q5: "False",  // correct -> +1
  };

  const passResult = evaluateQuizSubmission(serverQuestions, passedClientAnswers, 100);
  assert.equal(passResult.correctCount, 3);
  assert.equal(passResult.incorrectCount, 1);
  assert.equal(passResult.unansweredCount, 1);
  assert.equal(passResult.authoritativeScore, 3);
  assert.equal(passResult.percentage, 60);
  assert.equal(passResult.isPassed, true);
  assert.equal(passResult.leaderboardPoints, 3); // Qualified for leaderboard
  assert.equal(passResult.clientScoreDisregarded, true);

  // Test Case B: 2/5 correct (40% < 50% -> Failed)
  const failedClientAnswers = {
    q1: "B",      // correct
    q2: "False",  // incorrect
    q3: "C",      // incorrect
    // q4 unanswered
    q5: "False",  // correct
  };

  const failResult = evaluateQuizSubmission(serverQuestions, failedClientAnswers);
  assert.equal(failResult.correctCount, 2);
  assert.equal(failResult.percentage, 40);
  assert.equal(failResult.isPassed, false);
  assert.equal(failResult.leaderboardPoints, 0); // Disqualified from leaderboard due to < 50% fail
});

// ==============================================================================
// 3. ZERO PER-QUESTION STORAGE & ATOMIC POINT LEDGER IDEMPOTENCY
// ==============================================================================

class MockPointLedgerStore {
  constructor() {
    this.pointEvents = new Map(); // attemptId -> pointEvent
    this.userTotals = new Map();  // canonicalUserId -> points
  }

  /**
   * Atomic point award with UNIQUE constraint on attempt_id
   */
  awardPoints(attemptId, canonicalUserId, points, timestamp = new Date().toISOString()) {
    if (this.pointEvents.has(attemptId)) {
      // Simulate unique constraint violation: attempt already awarded
      return { success: false, duplicate: true, error: "duplicate key value violates unique constraint 'leaderboard_point_events_attempt_id_key'" };
    }

    const event = {
      id: crypto.randomUUID(),
      attemptId,
      canonicalUserId,
      pointsEarned: points,
      createdAt: timestamp,
    };

    this.pointEvents.set(attemptId, event);

    const currentTotal = this.userTotals.get(canonicalUserId) || 0;
    this.userTotals.set(canonicalUserId, currentTotal + points);

    return { success: true, duplicate: false, event };
  }

  getLifetimePoints(canonicalUserId) {
    return this.userTotals.get(canonicalUserId) || 0;
  }
}

test("Ledger Idempotency: Attempt can only award leaderboard points exactly once", () => {
  const ledger = new MockPointLedgerStore();
  const userId = "user-uuid-111";
  const attemptId = "attempt-uuid-999";

  // First submission awards 85 points
  const firstAward = ledger.awardPoints(attemptId, userId, 85);
  assert.equal(firstAward.success, true);
  assert.equal(ledger.getLifetimePoints(userId), 85);

  // Network retry / double submission of same attempt
  const retryAward = ledger.awardPoints(attemptId, userId, 85);
  assert.equal(retryAward.success, false);
  assert.equal(retryAward.duplicate, true);
  // Lifetime total remains 85, never 170
  assert.equal(ledger.getLifetimePoints(userId), 85);

  // A new distinct attempt correctly increments lifetime total
  const secondAttemptId = "attempt-uuid-1000";
  const secondAward = ledger.awardPoints(secondAttemptId, userId, 70);
  assert.equal(secondAward.success, true);
  assert.equal(ledger.getLifetimePoints(userId), 155);
});

// ==============================================================================
// 4. ASIA/KOLKATA TIMEZONE BOUNDARY VERIFICATION
// ==============================================================================

function getAsiaKolkataPeriodBoundaries(dateObj = new Date()) {
  // Format to Asia/Kolkata date components
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(dateObj);
  const getPart = (type) => parts.find((p) => p.type === type)?.value;

  const year = parseInt(getPart("year"), 10);
  const month = parseInt(getPart("month"), 10) - 1; // 0-indexed
  const day = parseInt(getPart("day"), 10);

  // Start of day in Asia/Kolkata is 00:00:00 IST -> UTC is (IST - 5h 30m)
  const startOfDayUtcMs = Date.UTC(year, month, day, 0, 0, 0) - (5.5 * 3600 * 1000);
  const startOfDayIso = new Date(startOfDayUtcMs).toISOString();

  // Start of month in Asia/Kolkata is 1st of month 00:00:00 IST
  const startOfMonthUtcMs = Date.UTC(year, month, 1, 0, 0, 0) - (5.5 * 3600 * 1000);
  const startOfMonthIso = new Date(startOfMonthUtcMs).toISOString();

  return {
    startOfDayIso,
    startOfMonthIso,
  };
}

test("Timezone: Daily window starts at 00:00:00 IST (18:30:00 UTC previous day)", () => {
  // Fixed test date: 2026-10-20 15:00:00 IST (UTC: 2026-10-20 09:30:00Z)
  const testDate = new Date("2026-10-20T09:30:00Z");
  const { startOfDayIso, startOfMonthIso } = getAsiaKolkataPeriodBoundaries(testDate);

  // 2026-10-20 00:00:00 IST in UTC is 2026-10-19T18:30:00.000Z
  assert.equal(startOfDayIso, "2026-10-19T18:30:00.000Z");

  // 2026-10-01 00:00:00 IST in UTC is 2026-09-30T18:30:00.000Z
  assert.equal(startOfMonthIso, "2026-09-30T18:30:00.000Z");
});

// ==============================================================================
// 5. PUBLIC PROFILE VISIBILITY & RANK AGGREGATION
// ==============================================================================

function computeLeaderboard(profiles, pointEvents, period = "all_time", targetUserId = null) {
  // Filter events by period
  const now = new Date();
  const { startOfDayIso, startOfMonthIso } = getAsiaKolkataPeriodBoundaries(now);

  const filteredEvents = pointEvents.filter((ev) => {
    if (period === "daily") return ev.createdAt >= startOfDayIso;
    if (period === "monthly") return ev.createdAt >= startOfMonthIso;
    return true; // all_time
  });

  // Aggregate user points
  const userPointMap = new Map();
  for (const ev of filteredEvents) {
    userPointMap.set(ev.canonicalUserId, (userPointMap.get(ev.canonicalUserId) || 0) + ev.pointsEarned);
  }

  // Create entries
  const entries = [];
  for (const [userId, points] of userPointMap.entries()) {
    const profile = profiles.get(userId) || {
      displayName: "Anonymous Student",
      username: null,
      photoUrl: null,
      isPublic: true,
    };

    entries.push({
      canonicalUserId: userId,
      points,
      displayName: profile.isPublic ? profile.displayName : "Anonymous Student",
      username: profile.isPublic ? profile.username : null,
      photoUrl: profile.isPublic ? profile.photoUrl : null,
      isPublic: profile.isPublic,
    });
  }

  // Sort descending by points, tie-break by canonicalUserId
  entries.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.canonicalUserId.localeCompare(b.canonicalUserId);
  });

  // Assign ranks
  const rankedLeaderboard = entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  // Resolve target user rank even if unranked or outside top
  let userRank = null;
  if (targetUserId) {
    const found = rankedLeaderboard.find((e) => e.canonicalUserId === targetUserId);
    if (found) {
      userRank = {
        canonicalUserId: found.canonicalUserId,
        rank: found.rank,
        points: found.points,
        period,
      };
    } else {
      userRank = {
        canonicalUserId: targetUserId,
        rank: null,
        points: 0,
        period,
      };
    }
  }

  return { leaderboard: rankedLeaderboard.slice(0, 100), userRank };
}

test("Leaderboard: Masks identity for private profiles and correctly computes ranks", () => {
  const profiles = new Map([
    ["u1", { displayName: "Pooja Sharma", username: "pooja_s", photoUrl: "https://photo.jpg", isPublic: true }],
    ["u2", { displayName: "Secret Topper", username: "secret_1", photoUrl: "https://secret.jpg", isPublic: false }],
    ["u3", { displayName: "Rohan Verma", username: "rohan_v", photoUrl: null, isPublic: true }],
  ]);

  const nowIso = new Date().toISOString();
  const pointEvents = [
    { canonicalUserId: "u1", pointsEarned: 50, createdAt: nowIso },
    { canonicalUserId: "u2", pointsEarned: 95, createdAt: nowIso },
    { canonicalUserId: "u3", pointsEarned: 30, createdAt: nowIso },
  ];

  const { leaderboard, userRank } = computeLeaderboard(profiles, pointEvents, "all_time", "u2");

  // Rank 1: u2 (95 points), but isPublic = false -> masked display
  assert.equal(leaderboard[0].canonicalUserId, "u2");
  assert.equal(leaderboard[0].rank, 1);
  assert.equal(leaderboard[0].points, 95);
  assert.equal(leaderboard[0].displayName, "Anonymous Student");
  assert.equal(leaderboard[0].photoUrl, null);

  // Rank 2: u1 (50 points), isPublic = true -> unmasked
  assert.equal(leaderboard[1].canonicalUserId, "u1");
  assert.equal(leaderboard[1].rank, 2);
  assert.equal(leaderboard[1].displayName, "Pooja Sharma");

  // Target user rank for u2
  assert.equal(userRank.rank, 1);
  assert.equal(userRank.points, 95);

  // User with no points has rank null and points 0
  const unranked = computeLeaderboard(profiles, pointEvents, "all_time", "u999");
  assert.equal(unranked.userRank.rank, null);
  assert.equal(unranked.userRank.points, 0);
});
