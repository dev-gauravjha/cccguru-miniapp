import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getStudentSession,
  setStudentSessionCookie,
} from "@/lib/telegram/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const session = await getStudentSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized session. Please launch via Telegram." },
        { status: 401 }
      );
    }

    const tgUserId = session.telegramUser?.id;
    if (!tgUserId && !session.isDevPreview) {
      return NextResponse.json(
        { error: "No verified Telegram identity found in current session." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required to link existing account." },
        { status: 400 }
      );
    }

    // 1. Authenticate with Supabase Auth to verify existing CCCGuru account credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const authClient = createClient<any>(supabaseUrl, anonKey, {
      auth: { persistSession: false },
    });

    const { data: authData, error: authErr } =
      await authClient.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

    if (authErr || !authData.user) {
      return NextResponse.json(
        { error: authErr?.message || "Invalid CCCGuru email or password." },
        { status: 401 }
      );
    }

    const authUser = authData.user;
    const effectiveTgId = tgUserId || 999999999; // Fallback for dev preview

    // 2. Call secure atomic database linking function
    const adminSupabase = getSupabaseAdminClient();
    const { data: linkResult, error: linkErr } = await adminSupabase.rpc(
      "link_telegram_account",
      {
        p_telegram_user_id: effectiveTgId,
        p_auth_user_id: authUser.id,
      }
    );

    if (linkErr) {
      console.error("Account link RPC error:", linkErr);
      return NextResponse.json(
        {
          error:
            linkErr.message ||
            "Failed to link account. Please verify neither account is already linked.",
        },
        { status: 409 }
      );
    }

    const canonicalUserId =
      (linkResult as any)?.canonical_user_id || session.canonicalUserId;

    // 3. Update active session cookie with linked status
    const updatedSession = {
      ...session,
      canonicalUserId,
      isLinked: true,
      authUserId: authUser.id,
    };
    await setStudentSessionCookie(updatedSession);

    return NextResponse.json({
      success: true,
      message: "CCCGuru account successfully linked to Telegram!",
      email: authUser.email,
      canonicalUserId,
    });
  } catch (err: any) {
    console.error("Link account route exception:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
