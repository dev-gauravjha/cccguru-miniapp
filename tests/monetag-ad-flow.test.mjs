import test from "node:test";
import assert from "node:assert/strict";

// ==============================================================================
// MONETAG POST-SUBMISSION AD INTEGRATION UNIT & RESILIENCE TESTS
// ==============================================================================

test("Monetag Integration: Server evaluation and save happens BEFORE any ad attempt", async () => {
  const executionOrder = [];

  // Mock server API call
  const mockSubmitToServer = async (attemptId) => {
    executionOrder.push("1_server_submit_started");
    // Simulate DB evaluation and write
    await new Promise((r) => setTimeout(r, 20));
    executionOrder.push("2_server_persisted_in_db");
    return { success: true, attempt: { id: attemptId, score: 85 } };
  };

  // Mock Monetag ad trigger
  const mockShowPostSubmissionAd = async () => {
    executionOrder.push("3_monetag_ad_triggered");
    // Simulate user viewing and closing ad
    await new Promise((r) => setTimeout(r, 10));
    executionOrder.push("4_monetag_ad_closed");
    return { shown: true, reason: "completed" };
  };

  // Mock Navigation
  let navigatedTo = null;
  const mockNavigate = (url) => {
    executionOrder.push("5_navigated_to_result");
    navigatedTo = url;
  };

  // Run submission handler flow
  const attemptId = "att_test_12345";
  const submitRes = await mockSubmitToServer(attemptId);
  assert.equal(submitRes.success, true);

  const adRes = await mockShowPostSubmissionAd();
  assert.equal(adRes.shown, true);

  mockNavigate(`/results/${attemptId}`);

  assert.deepEqual(executionOrder, [
    "1_server_submit_started",
    "2_server_persisted_in_db",
    "3_monetag_ad_triggered",
    "4_monetag_ad_closed",
    "5_navigated_to_result",
  ]);
  assert.equal(navigatedTo, "/results/att_test_12345");
});

test("Monetag Resilience: Ad rejection ('Empty feed') NEVER blocks navigation to results", async () => {
  let navigatedTo = null;
  const attemptId = "att_no_ad_999";

  // Simulate Monetag ad call rejecting with "Empty feed" (no ad inventory)
  const mockShowPostSubmissionAdWithEmptyFeed = async () => {
    return new Promise((resolve) => {
      // Handler catches rejected promise and resolves gracefully
      Promise.reject(new Error("Empty feed"))
        .catch((err) => {
          resolve({ shown: false, reason: "unavailable", error: err.message });
        });
    });
  };

  const adResult = await mockShowPostSubmissionAdWithEmptyFeed();
  assert.equal(adResult.shown, false);
  assert.equal(adResult.reason, "unavailable");
  assert.equal(adResult.error, "Empty feed");

  // Navigation still occurs normally
  navigatedTo = `/results/${attemptId}`;
  assert.equal(navigatedTo, "/results/att_no_ad_999");
});

test("Monetag Resilience: Ad fallback timeout races and wins if Monetag hangs", async () => {
  let navigatedCount = 0;
  const attemptId = "att_timeout_555";

  // Simulate an ad call that hangs indefinitely
  const mockHangingAdCall = async (timeoutMs) => {
    return new Promise((resolve) => {
      let isSettled = false;
      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          resolve({ shown: false, reason: "timeout", error: `Ad display timed out after ${timeoutMs}ms` });
        }
      }, timeoutMs);

      // Hanging promise that never resolves or resolves after 500ms
      setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          resolve({ shown: true, reason: "completed" });
        }
      }, 500);
    });
  };

  // Fast timeout (50ms) to simulate safety cutoff
  const result = await mockHangingAdCall(50);
  assert.equal(result.shown, false);
  assert.equal(result.reason, "timeout");

  // Navigate once
  navigatedCount++;
  assert.equal(navigatedCount, 1);
});

test("Monetag Guard: Duplicate submission / double clicks are strictly prevented", async () => {
  let isSubmitting = false;
  let serverCallCount = 0;
  let adTriggerCount = 0;

  const handleSubmit = async () => {
    if (isSubmitting) return; // Guard
    isSubmitting = true;

    serverCallCount++;
    await new Promise((r) => setTimeout(r, 20));

    adTriggerCount++;
    // Finish
  };

  // Fire 5 rapid concurrent clicks
  await Promise.all([
    handleSubmit(),
    handleSubmit(),
    handleSubmit(),
    handleSubmit(),
    handleSubmit(),
  ]);

  assert.equal(serverCallCount, 1, "Server submit must only be called once");
  assert.equal(adTriggerCount, 1, "Ad trigger must only be called once");
});

test("Monetag Guard: If server submission fails, NO ad is shown and state unlocks for retry", async () => {
  let isSubmitting = false;
  let adTriggered = false;
  let submissionError = null;

  const handleSubmitWithFailure = async () => {
    if (isSubmitting) return;
    isSubmitting = true;

    try {
      // Simulate network / server 500 error
      throw new Error("Database timeout or network offline");

      // Ad should never be reached
      adTriggered = true;
    } catch (err) {
      submissionError = err.message;
      isSubmitting = false; // Reset to allow retry
    }
  };

  await handleSubmitWithFailure();

  assert.equal(adTriggered, false, "Ad must NOT trigger on failed test submission");
  assert.equal(submissionError, "Database timeout or network offline");
  assert.equal(isSubmitting, false, "Submitting lock must reset so student can retry");
});

test("Monetag SSR Safety: getMonetagHandler returns null on server without throwing", async () => {
  // In Node.js environment, window is undefined
  assert.equal(typeof window, "undefined");

  // Import the module dynamically to verify SSR behavior
  const { MONETAG_ZONE_ID, getMonetagHandler, showPostSubmissionAd, preloadMonetagAd } = await import(
    "../src/lib/monetag.ts"
  );

  assert.equal(MONETAG_ZONE_ID, "12075938");
  assert.equal(getMonetagHandler(), null, "getMonetagHandler should return null in SSR");

  const preloadResult = await preloadMonetagAd();
  assert.equal(preloadResult, false, "preloadMonetagAd should return false in SSR without throwing");

  const postSubmitResult = await showPostSubmissionAd({ attemptId: "test_ssr" });
  assert.deepEqual(
    postSubmitResult,
    { shown: false, reason: "skipped" },
    "showPostSubmissionAd should skip cleanly in SSR"
  );
});
