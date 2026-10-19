import { NextRequest, NextResponse } from "next/server";
import {
  verifyTelegramInitData,
  setStudentSessionCookie,
  createPreviewSession,
} from "@/lib/telegram/auth";
import type { StudentSession } from "@/types/telegram";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, isPreviewMode } = body;

    // Graceful Browser Preview Mode (for development testing)
    if (isPreviewMode) {
      const isAllowedPreview =
        process.env.NODE_ENV !== "production" ||
        process.env.NEXT_PUBLIC_DEV_PREVIEW === "true";

      if (!isAllowedPreview) {
        return NextResponse.json(
          { error: "Browser preview mode is disabled in production" },
          { status: 403 }
        );
      }

      const previewSession = createPreviewSession();
      await setStudentSessionCookie(previewSession);

      return NextResponse.json({
        success: true,
        session: previewSession,
        preview: true,
      });
    }

    if (!initData) {
      return NextResponse.json(
        { error: "Missing initData payload" },
        { status: 400 }
      );
    }

    // Verify official Telegram signature
    const verification = verifyTelegramInitData(initData);
    if (!verification.isValid || !verification.user) {
      return NextResponse.json(
        { error: verification.error || "Authentication verification failed" },
        { status: 401 }
      );
    }

    const tgUser = verification.user;
    const session: StudentSession = {
      studentId: `tg_${tgUser.id}`,
      studentType: "telegram",
      telegramUser: tgUser,
      name: `${tgUser.first_name} ${tgUser.last_name || ""}`.trim(),
      username: tgUser.username,
      photoUrl: tgUser.photo_url,
      authDate: verification.authDate || Math.floor(Date.now() / 1000),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };

    await setStudentSessionCookie(session);

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
