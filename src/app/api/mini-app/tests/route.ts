import { NextRequest, NextResponse } from "next/server";
import {
  getTestCategories,
  getTestSeries,
  getTestSeriesItems,
} from "@/lib/test-engine";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId") || undefined;
  const seriesId = searchParams.get("seriesId") || undefined;

  const [categories, seriesList, items] = await Promise.all([
    getTestCategories(),
    getTestSeries({ categoryId }),
    getTestSeriesItems(seriesId, categoryId),
  ]);

  return NextResponse.json({
    categories,
    series: seriesList,
    items,
  });
}
