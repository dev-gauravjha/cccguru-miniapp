import { NextRequest, NextResponse } from "next/server";
import { getStudentSession, createPreviewSession } from "@/lib/telegram/auth";
import { getStudentResults } from "@/lib/test-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let session = await getStudentSession();
  if (!session && process.env.NEXT_PUBLIC_DEV_PREVIEW === "true") {
    session = createPreviewSession();
  }

  const { searchParams } = new URL(req.url);
  const queryStudentId = searchParams.get("studentId");
  const queryCanonicalId = searchParams.get("canonicalUserId");

  const studentId = queryStudentId || session?.studentId || "preview_student_demo";
  const canonicalUserId =
    queryCanonicalId ||
    session?.canonicalUserId ||
    (studentId === "preview_student_demo"
      ? "00000000-0000-0000-0000-000000000001"
      : undefined);

  const results = await getStudentResults(studentId, canonicalUserId);

  return NextResponse.json({
    results,
  });
}
