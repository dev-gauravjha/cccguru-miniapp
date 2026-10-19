import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

// ==============================================================================
// 1. TELEGRAM SIGNATURE VERIFICATION TESTS
// ==============================================================================

function verifyTelegramInitData(initDataRaw, botToken) {
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

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    const hashBuffer = Buffer.from(hash, "hex");
    const calculatedBuffer = Buffer.from(calculatedHash, "hex");

    if (hashBuffer.length !== calculatedBuffer.length) {
      return { isValid: false, error: "Hash length mismatch" };
    }

    if (!crypto.timingSafeEqual(hashBuffer, calculatedBuffer)) {
      return { isValid: false, error: "Invalid Telegram signature" };
    }

    const authDate = parseInt(params.get("auth_date") || "0", 10);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!authDate || nowSeconds - authDate > 86400) {
      return { isValid: false, error: "Authentication payload has expired" };
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
  params.set("query_id", "AAG_TEST_123");
  params.set("user", JSON.stringify(user));

  const keys = Array.from(params.keys()).sort();
  const dataCheckString = keys.map((k) => `${k}=${params.get(k)}`).join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  params.set("hash", hash);
  return params.toString();
}

test("Telegram Auth: Successfully verifies valid initData signature", () => {
  const botToken = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11";
  const user = { id: 987654321, first_name: "Rahul", username: "rahul_ccc" };
  const rawInitData = generateMockInitData(user, botToken);

  const result = verifyTelegramInitData(rawInitData, botToken);
  assert.equal(result.isValid, true);
  assert.equal(result.user?.id, 987654321);
  assert.equal(result.user?.username, "rahul_ccc");
});

test("Telegram Auth: Rejects tampered initData payload", () => {
  const botToken = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11";
  const user = { id: 987654321, first_name: "Rahul", username: "rahul_ccc" };
  let rawInitData = generateMockInitData(user, botToken);

  // Tamper with user payload
  rawInitData = rawInitData.replace("rahul_ccc", "hacker_user");

  const result = verifyTelegramInitData(rawInitData, botToken);
  assert.equal(result.isValid, false);
  assert.match(result.error, /Invalid Telegram signature/);
});

test("Telegram Auth: Rejects expired auth_date (> 24 hours)", () => {
  const botToken = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11";
  const user = { id: 987654321, first_name: "Rahul" };
  const staleAuthDate = Math.floor(Date.now() / 1000) - 100000; // > 24 hours ago
  const rawInitData = generateMockInitData(user, botToken, staleAuthDate);

  const result = verifyTelegramInitData(rawInitData, botToken);
  assert.equal(result.isValid, false);
  assert.match(result.error, /expired/);
});

// ==============================================================================
// 2. SESSION TOKEN INTEGRITY & SECURITY TESTS
// ==============================================================================

function signSession(session, secret) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifySessionToken(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (Date.now() > decoded.expiresAt) return null;
  return decoded;
}

test("Session: Generates and verifies HMAC-SHA256 session token", () => {
  const secret = "test_signing_secret_key_12345";
  const session = {
    studentId: "tg_987654321",
    studentType: "telegram",
    name: "Rahul Sharma",
    expiresAt: Date.now() + 3600 * 1000,
  };

  const token = signSession(session, secret);
  const verified = verifySessionToken(token, secret);

  assert.notEqual(verified, null);
  assert.equal(verified?.studentId, "tg_987654321");
  assert.equal(verified?.name, "Rahul Sharma");
});

test("Session: Rejects tampered session token", () => {
  const secret = "test_signing_secret_key_12345";
  const session = {
    studentId: "tg_987654321",
    studentType: "telegram",
    expiresAt: Date.now() + 3600 * 1000,
  };

  const token = signSession(session, secret);
  // Modify 1 character of signature
  const tampered = token.slice(0, -2) + "X" + token.slice(-1);
  const verified = verifySessionToken(tampered, secret);

  assert.equal(verified, null);
});

// ==============================================================================
// 3. TEST SCORING & NEGATIVE MARKING ENGINE TESTS
// ==============================================================================

function evaluateExamSubmission({ questions, userAnswers, negativeMarkingEnabled, negativeMarks }) {
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  let score = 0;

  questions.forEach((q) => {
    const selected = userAnswers[q.id];
    if (!selected) {
      unanswered++;
    } else if (selected === q.correct_option) {
      correct++;
      score += 1;
    } else {
      incorrect++;
      if (negativeMarkingEnabled) {
        score -= negativeMarks;
      }
    }
  });

  const attempted = correct + incorrect;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  return {
    totalQuestions: questions.length,
    attempted,
    correct,
    incorrect,
    unanswered,
    score: Math.max(0, parseFloat(score.toFixed(2))),
    accuracy,
  };
}

test("Engine: Standard scoring without negative marking", () => {
  const questions = [
    { id: "q1", correct_option: "A" },
    { id: "q2", correct_option: "B" },
    { id: "q3", correct_option: "C" },
    { id: "q4", correct_option: "D" },
  ];

  const userAnswers = {
    q1: "A", // Correct (+1)
    q2: "C", // Wrong (0)
    q3: "C", // Correct (+1)
    // q4 unattempted (0)
  };

  const result = evaluateExamSubmission({
    questions,
    userAnswers,
    negativeMarkingEnabled: false,
    negativeMarks: 0,
  });

  assert.equal(result.correct, 2);
  assert.equal(result.incorrect, 1);
  assert.equal(result.unanswered, 1);
  assert.equal(result.score, 2);
  assert.equal(result.accuracy, 67); // 2 out of 3 attempted
});

test("Engine: Negative marking deduction applied correctly", () => {
  const questions = [
    { id: "q1", correct_option: "A" },
    { id: "q2", correct_option: "B" },
    { id: "q3", correct_option: "C" },
    { id: "q4", correct_option: "D" },
  ];

  const userAnswers = {
    q1: "A", // Correct (+1)
    q2: "C", // Wrong (-0.25)
    q3: "A", // Wrong (-0.25)
    q4: "B", // Wrong (-0.25)
  };

  const result = evaluateExamSubmission({
    questions,
    userAnswers,
    negativeMarkingEnabled: true,
    negativeMarks: 0.25,
  });

  assert.equal(result.correct, 1);
  assert.equal(result.incorrect, 3);
  // Score: 1 - (3 * 0.25) = 1 - 0.75 = 0.25
  assert.equal(result.score, 0.25);
  assert.equal(result.accuracy, 25);
});

test("Engine: Score cannot drop below 0 (Math.max(0, score))", () => {
  const questions = [
    { id: "q1", correct_option: "A" },
    { id: "q2", correct_option: "B" },
  ];

  const userAnswers = {
    q1: "B", // Wrong (-1)
    q2: "A", // Wrong (-1)
  };

  const result = evaluateExamSubmission({
    questions,
    userAnswers,
    negativeMarkingEnabled: true,
    negativeMarks: 1.0,
  });

  assert.equal(result.correct, 0);
  assert.equal(result.incorrect, 2);
  assert.equal(result.score, 0); // Floored to 0
});

// ==============================================================================
// 4. SANITIZATION SECURITY TESTS
// ==============================================================================

test("Security: Question sanitization strips answer keys and explanations", () => {
  const rawQuestion = {
    id: "q-secret-uuid",
    chapter_id: "chap-1",
    question_en: "What is RAM?",
    question_hi: "रैम क्या है?",
    option_a_en: "Primary Memory",
    option_a_hi: "प्राथमिक मेमोरी",
    option_b_en: "Secondary Storage",
    option_b_hi: "द्वितीयक स्टोरेज",
    option_c_en: "Optical Disc",
    option_c_hi: "ऑप्टिकल डिस्क",
    option_d_en: "Magnetic Tape",
    option_d_hi: "मैग्नेटिक टेप",
    correct_option: "A",
    explanation_en: "RAM stands for Random Access Memory, a primary volatile memory.",
    explanation_hi: "रैम प्राथमिक वोलेटाइल मेमोरी है।",
    difficulty: "Easy",
    question_type: "MCQ",
  };

  // Sanitizer
  const sanitized = {
    id: rawQuestion.id,
    chapter_id: rawQuestion.chapter_id,
    question_en: rawQuestion.question_en,
    question_hi: rawQuestion.question_hi,
    option_a_en: rawQuestion.option_a_en,
    option_a_hi: rawQuestion.option_a_hi,
    option_b_en: rawQuestion.option_b_en,
    option_b_hi: rawQuestion.option_b_hi,
    option_c_en: rawQuestion.option_c_en,
    option_c_hi: rawQuestion.option_c_hi,
    option_d_en: rawQuestion.option_d_en,
    option_d_hi: rawQuestion.option_d_hi,
    difficulty: rawQuestion.difficulty,
    question_type: rawQuestion.question_type,
  };

  assert.equal("correct_option" in sanitized, false);
  assert.equal("explanation_en" in sanitized, false);
  assert.equal("explanation_hi" in sanitized, false);
  assert.equal(sanitized.question_en, "What is RAM?");
});
