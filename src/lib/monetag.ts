/**
 * Monetag Telegram Mini App SDK Integration Service
 * ----------------------------------------------------
 * Provides centralized, SSR-safe management of Monetag advertisements,
 * including In-App Interstitials and post-test submission interstitial triggers.
 *
 * Official Documentation:
 * - https://docs.monetag.com/docs/ad-integration/inapp-interstitial/
 * - https://docs.monetag.com/docs/ad-integration/sdk-integration/
 * - https://docs.monetag.com/docs/sdk-reference/
 */

import createAdHandler from "monetag-tg-sdk";

export const MONETAG_ZONE_ID =
  process.env.NEXT_PUBLIC_MONETAG_ZONE_ID || "12075938";

export const MONETAG_SDK_FN = `show_${MONETAG_ZONE_ID}`;

export interface MonetagInAppSettings {
  /** Maximum number of ads shown per session window */
  frequency: number;
  /** Duration of session window in hours (e.g., 0.5 = 30 minutes, 1 = 1 hour) */
  capping: number;
  /** Minimum time between ads in seconds */
  interval: number;
  /** Delay in seconds before first ad is eligible to show */
  timeout: number;
  /** If true, resets timer on each page/route navigation */
  everyPage?: boolean;
}

export interface MonetagAdOptions {
  type?: "end" | "start" | "preload" | "pop" | "inApp";
  ymid?: string;
  requestVar?: string;
  timeout?: number;
  catchIfNoFeed?: boolean;
  inAppSettings?: MonetagInAppSettings;
}

export interface MonetagRewardResult {
  reward_event_type?: "valued" | "non_valued";
  event_type?: string;
  estimated_price?: number;
  sub_zone_id?: number;
  zone_id?: number;
  request_var?: string;
  variable2?: string;
  telegram_id?: string;
}

export interface PostSubmissionAdOptions {
  studentId?: string;
  attemptId: string;
  /** Max milliseconds to wait for ad initialization/playback before fallback to results (default: 6000ms) */
  maxWaitMs?: number;
}

export interface PostSubmissionAdResult {
  shown: boolean;
  reason: "completed" | "unavailable" | "timeout" | "skipped" | "error";
  error?: string;
}

// Module-level singletons to prevent multiple script injections and re-renders
let cachedHandler: ((options?: string | MonetagAdOptions) => Promise<any>) | null = null;
let isInAppSchedulerInitialized = false;

/**
 * Returns the ad handler function for the active Monetag zone.
 * SSR-safe: returns null if executed in a server environment.
 */
export function getMonetagHandler(
  customZoneId?: string | number
): ((options?: string | MonetagAdOptions) => Promise<any>) | null {
  if (typeof window === "undefined") {
    return null;
  }

  const zoneIdStr = String(customZoneId || MONETAG_ZONE_ID);
  const zoneIdNum = parseInt(zoneIdStr, 10);
  if (!zoneIdNum || isNaN(zoneIdNum)) {
    console.warn("[Monetag] Invalid zone ID configuration:", zoneIdStr);
    return null;
  }

  if (cachedHandler) {
    return cachedHandler;
  }

  const sdkFnName = `show_${zoneIdStr}`;
  const win = window as unknown as Record<string, any>;

  // If the script tag (e.g. from RootLayout) has already mounted the function on window
  if (typeof win[sdkFnName] === "function") {
    cachedHandler = (options) => win[sdkFnName](options);
    return cachedHandler;
  }

  // Otherwise delegate to monetag-tg-sdk's createAdHandler
  try {
    const sdkHandler = createAdHandler(zoneIdNum);
    cachedHandler = async (options) => {
      if (typeof win[sdkFnName] === "function") {
        return win[sdkFnName](options);
      }
      return sdkHandler(options as any);
    };
    return cachedHandler;
  } catch (err) {
    console.warn("[Monetag] Failed to initialize ad handler:", err);
    return null;
  }
}

/**
 * Preload ad material in advance to ensure instant display on submission.
 * Fails silently if inventory is empty or offline.
 */
export async function preloadMonetagAd(options?: {
  ymid?: string;
  requestVar?: string;
  timeout?: number;
}): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const handler = getMonetagHandler();
    if (!handler) return false;

    await handler({
      type: "preload",
      timeout: options?.timeout ?? 5,
      ymid: options?.ymid,
      requestVar: options?.requestVar ?? "test_preload",
    });
    return true;
  } catch {
    // Preload errors are silent by design
    return false;
  }
}

/**
 * Initializes the Monetag In-App Interstitial auto-display scheduler.
 * Must only be called once per application lifecycle (e.g., in TelegramProvider).
 *
 * NOTE: The In-App scheduler runs passively based on background intervals.
 * It is not used during active test answering to avoid disrupting student focus.
 */
export async function initMonetagInAppScheduler(
  customSettings?: Partial<MonetagInAppSettings>
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (isInAppSchedulerInitialized) return true;

  const settings: MonetagInAppSettings = {
    frequency: customSettings?.frequency ?? 2,
    capping: customSettings?.capping ?? 1, // 1 hour
    interval: customSettings?.interval ?? 180, // 3 minutes between passive ads
    timeout: customSettings?.timeout ?? 30, // 30s delay before first passive ad
    everyPage: customSettings?.everyPage ?? false,
  };

  try {
    const handler = getMonetagHandler();
    if (!handler) return false;

    isInAppSchedulerInitialized = true;
    await handler({
      type: "inApp",
      inAppSettings: settings,
    });
    return true;
  } catch (err: any) {
    console.warn("[Monetag] In-App scheduler notice:", err?.message || err);
    return false;
  }
}

/**
 * Triggers full-screen ad presentation after successful test submission.
 *
 * GUARANTEES:
 * 1. Resolves safely when the ad is closed or finishes.
 * 2. Never blocks the user from viewing results if ad is unavailable ('Empty feed'),
 *    times out, throws an error, or if outside Telegram.
 * 3. Incorporates a race against a fallback timeout (default: 6s) with atomic
 *    one-time execution so navigation to the result screen is never duplicated.
 * 4. Never causes loss of submitted answers or persisted scores.
 */
export async function showPostSubmissionAd(
  options: PostSubmissionAdOptions
): Promise<PostSubmissionAdResult> {
  if (typeof window === "undefined") {
    return { shown: false, reason: "skipped" };
  }

  const handler = getMonetagHandler();
  if (!handler) {
    return {
      shown: false,
      reason: "unavailable",
      error: "Monetag ad handler not initialized",
    };
  }

  const maxWaitMs = options.maxWaitMs ?? 6000;

  return new Promise<PostSubmissionAdResult>((resolve) => {
    let isSettled = false;
    let timer: NodeJS.Timeout | null = null;

    const settleOnce = (result: PostSubmissionAdResult) => {
      if (isSettled) return;
      isSettled = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      resolve(result);
    };

    // Safety fallback timeout to prevent hanging UI
    timer = setTimeout(() => {
      settleOnce({
        shown: false,
        reason: "timeout",
        error: `Ad display timed out after ${maxWaitMs}ms`,
      });
    }, maxWaitMs);

    try {
      handler({
        type: "end",
        timeout: Math.max(1, Math.floor(maxWaitMs / 1000)),
        ymid: options.studentId || "preview_student",
        requestVar: `sub_${options.attemptId.slice(0, 8)}`,
      })
        .then(() => {
          settleOnce({
            shown: true,
            reason: "completed",
          });
        })
        .catch((err: any) => {
          const errMsg = err?.message || String(err);
          settleOnce({
            shown: false,
            reason: errMsg.toLowerCase().includes("timeout")
              ? "timeout"
              : "unavailable",
            error: errMsg,
          });
        });
    } catch (err: any) {
      settleOnce({
        shown: false,
        reason: "error",
        error: err?.message || String(err),
      });
    }
  });
}
