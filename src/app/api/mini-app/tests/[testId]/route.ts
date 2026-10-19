import { NextRequest, NextResponse } from "next/server";
import { getTestSeriesItemById } from "@/lib/test-engine";

interface RouteParams {
  params: Promise<{ testId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { testId } = await params;
  const item = await getTestSeriesItemById(testId);

  if (!item) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}
