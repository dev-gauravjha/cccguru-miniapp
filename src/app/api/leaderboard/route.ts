import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStudentSession, createPreviewSession } from "@/lib/telegram/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "daily";
    const limitParam = searchParams.get("limit");
    const limit = limitParam !== null ? parseInt(limitParam, 10) : 15;
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const validPeriod = ["daily", "monthly", "all_time"].includes(period)
      ? period
      : "daily";

    const safeLimit = Math.min(Math.max(isNaN(limit) ? 15 : limit, 1), 100);
    const safeOffset = Math.max(isNaN(offset) ? 0 : offset, 0);

    const supabase = getSupabaseAdminClient();

    // 1. Fetch public leaderboard ranking
    const { data: leaderboardData, error: lbError } = await supabase.rpc(
      "get_leaderboard",
      {
        p_period: validPeriod,
        p_limit: safeLimit,
        p_offset: safeOffset,
      }
    );

    if (lbError) {
      console.error("Leaderboard RPC error:", lbError);
      return NextResponse.json(
        { error: "Failed to fetch leaderboard rankings" },
        { status: 500 }
      );
    }

    const items = leaderboardData || [];
    const hasMore = items.length === safeLimit;

    // 2. Fetch current user rank if session exists
    let userRank = null;
    let session = await getStudentSession();

    if (!session && process.env.NEXT_PUBLIC_DEV_PREVIEW === "true") {
      session = createPreviewSession();
    }

    if (session?.canonicalUserId) {
      const { data: userRankData, error: rankError } = await supabase.rpc(
        "get_user_leaderboard_rank",
        {
          p_target_user_id: session.canonicalUserId,
          p_period: validPeriod,
        }
      );

      if (!rankError && userRankData) {
        userRank = userRankData;
      }
    }

    return NextResponse.json({
      success: true,
      period: validPeriod,
      leaderboard: items,
      hasMore,
      nextOffset: safeOffset + items.length,
      userRank,
      timezone: "Asia/Kolkata",
    });
  } catch (err: any) {
    console.error("Leaderboard route exception:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
