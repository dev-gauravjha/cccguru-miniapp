import crypto from "crypto";
import { cookies } from "next/headers";
import type {
  TelegramUser,
  TelegramInitDataParsed,
  StudentSession,
} from "@/types/telegram";

export const SESSION_COOKIE_NAME = "tg_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Returns secret signing key derived from TELEGRAM_BOT_TOKEN or APP secret
 */
function getSessionSigningSecret(): string {
  const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  if (token.length > 0) {
    return token;
  }
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "cccguru_session_secret_fallback_key"
  );
}

/**
 * Signs and encodes a session payload into a tamper-evident string
 */
export function signSession(session: StudentSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const secret = getSessionSigningSecret();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

/**
 * Verifies and decodes a signed session token
 */
export function verifySessionToken(token: string): StudentSession | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payload, signature] = parts;
    const secret = getSessionSigningSecret();
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as StudentSession;

    // Check expiration
    if (Date.now() > decoded.expiresAt) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verifies official Telegram WebApp initData string using Telegram's HMAC-SHA256 algorithm
 */
export function verifyTelegramInitData(
  initDataRaw: string,
  botToken?: string
): { isValid: boolean; user?: TelegramUser; authDate?: number; error?: string } {
  const resolvedToken = (botToken || process.env.TELEGRAM_BOT_TOKEN || "").trim();

  if (!initDataRaw || typeof initDataRaw !== "string") {
    return { isValid: false, error: "Missing or empty initData payload" };
  }

  // If no bot token configured on server, check if in dev preview mode
  if (!resolvedToken || resolvedToken.trim().length === 0) {
    if (process.env.NODE_ENV !== "production") {
      // Allow dev inspection if token is not yet configured by user
      try {
        const params = new URLSearchParams(initDataRaw);
        const userStr = params.get("user");
        if (userStr) {
          const parsedUser = JSON.parse(userStr) as TelegramUser;
          return {
            isValid: true,
            user: parsedUser,
            authDate: parseInt(params.get("auth_date") || "0", 10),
          };
        }
      } catch {
        // Fallback
      }
    }
    return {
      isValid: false,
      error: "TELEGRAM_BOT_TOKEN is not configured on server",
    };
  }

  try {
    const params = new URLSearchParams(initDataRaw);
    const hash = params.get("hash");

    if (!hash) {
      return { isValid: false, error: "Missing hash in initData" };
    }

    params.delete("hash");

    // Construct data_check_string by sorting keys alphabetically
    const keys = Array.from(params.keys()).sort();
    const dataCheckString = keys
      .map((k) => `${k}=${params.get(k)}`)
      .join("\n");

    // secret_key = HMAC_SHA256("WebAppData", bot_token)
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(resolvedToken)
      .digest();

    // calculated_hash = HMAC_SHA256(dataCheckString, secret_key)
    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    // Constant-time comparison
    const hashBuffer = Buffer.from(hash, "hex");
    const calculatedBuffer = Buffer.from(calculatedHash, "hex");

    if (hashBuffer.length !== calculatedBuffer.length) {
      return { isValid: false, error: "Hash length mismatch" };
    }

    const matches = crypto.timingSafeEqual(hashBuffer, calculatedBuffer);
    if (!matches) {
      return { isValid: false, error: "Invalid Telegram signature" };
    }

    // Validate auth_date (reject older than 24 hours to prevent replay attacks)
    const authDate = parseInt(params.get("auth_date") || "0", 10);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const maxAgeSeconds = 86400; // 24 hours

    if (!authDate || nowSeconds - authDate > maxAgeSeconds) {
      return { isValid: false, error: "Authentication payload has expired" };
    }

    const userRaw = params.get("user");
    if (!userRaw) {
      return { isValid: false, error: "Missing user identity in initData" };
    }

    const user = JSON.parse(userRaw) as TelegramUser;
    if (!user.id || typeof user.id !== "number") {
      return { isValid: false, error: "Invalid user identifier" };
    }

    return { isValid: true, user, authDate };
  } catch (err: any) {
    return { isValid: false, error: err.message || "Failed to parse initData" };
  }
}

/**
 * Reads and verifies the current session from HttpOnly cookie
 */
export async function getStudentSession(): Promise<StudentSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  return verifySessionToken(sessionCookie.value);
}

/**
 * Sets session cookie on Next.js Response / cookies()
 */
export async function setStudentSessionCookie(session: StudentSession) {
  const token = signSession(session);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Clears session cookie on logout
 */
export async function clearStudentSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Helper to build a sandbox preview session for development testing
 */
export function createPreviewSession(): StudentSession {
  return {
    studentId: "preview_student_demo",
    studentType: "preview",
    telegramUser: {
      id: 999999999,
      first_name: "Demo",
      last_name: "Student",
      username: "demo_student",
      language_code: "hi",
    },
    name: "Demo Student",
    username: "demo_student",
    authDate: Math.floor(Date.now() / 1000),
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    isDevPreview: true,
  };
}
