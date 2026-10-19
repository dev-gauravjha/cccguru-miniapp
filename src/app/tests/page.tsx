"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Layers,
  Clock,
  HelpCircle,
  Play,
  Filter,
  CheckCircle,
  Sparkles,
  Loader2,
  AlertCircle,
  Languages,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useTelegram } from "@/components/providers/TelegramProvider";
import { getDifficultyColor } from "@/lib/utils";

export default function TestsPage() {
  const { triggerHaptic } = useTelegram();
  const [categories, setCategories] = useState<any[]>([]);
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mini-app/tests");
      if (!res.ok) throw new Error("Failed to load test catalog");
      const json = await res.json();
      setCategories(json.categories || []);
      setSeriesList(json.series || []);
      setItems(json.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to load test series");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  // Helper to resolve category ID for each item
  const getItemCategoryId = useCallback(
    (item: any) => {
      return (
        item.test_series?.category_id ||
        seriesList.find((s) => s.id === item.series_id)?.category_id ||
        null
      );
    },
    [seriesList]
  );

  const filteredItems = items.filter((item) => {
    if (selectedCategory === "all") return true;
    return getItemCategoryId(item) === selectedCategory;
  });

  const getCategoryCount = (catId: string) => {
    return items.filter((item) => getItemCategoryId(item) === catId).length;
  };

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col">
      <Header title="CCC Mock Tests" />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-8 space-y-4">
        {/* Banner */}
        <div className="bg-gradient-to-r from-primary-900 to-indigo-900 text-white p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-xs text-primary-300 font-semibold mb-1">
            <Languages className="w-3.5 h-3.5" />
            <span>Bilingual (English & Hindi)</span>
          </div>
          <h2 className="text-base font-bold">
            {selectedCategory === "all"
              ? "NIELIT CCC Full Mock Tests"
              : selectedCategoryObj?.title || "CCC Practice Tests"}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            {selectedCategory === "all"
              ? "All official NIELIT CCC practice sets & chapter tests."
              : `Showing ${filteredItems.length} test set${
                  filteredItems.length === 1 ? "" : "s"
                } in this category.`}
          </p>
        </div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => {
                setSelectedCategory("all");
                triggerHaptic("selection");
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === "all"
                  ? "bg-primary-600 text-white shadow-xs"
                  : "bg-white dark:bg-[#121626] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <span>All Sets</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedCategory === "all"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}
              >
                {items.length}
              </span>
            </button>
            {categories.map((cat) => {
              const count = getCategoryCount(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    triggerHaptic("selection");
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? "bg-primary-600 text-white shadow-xs"
                      : "bg-white dark:bg-[#121626] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <span>{cat.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedCategory === cat.id
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <span className="text-xs">Loading mock test sets...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl text-center">
            <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
            <p className="text-xs text-rose-700 dark:text-rose-400 font-medium mb-3">
              {error}
            </p>
            <button
              onClick={fetchTests}
              className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredItems.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6">
            <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No Test Sets Found in This Category
            </h4>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Tests for this category will be available soon.
            </p>
            <button
              onClick={() => setSelectedCategory("all")}
              className="px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs active:scale-95 transition-transform"
            >
              View All Sets ({items.length})
            </button>
          </div>
        )}

        {/* Items List */}
        {!isLoading && filteredItems.length > 0 && (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-2xl shadow-xs space-y-3 hover:border-primary-400 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 px-2 py-0.5 rounded-md">
                        {item.test_type || "Mock Test"}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getDifficultyColor(
                          item.difficulty || "Medium"
                        )}`}
                      >
                        {item.difficulty || "Medium"}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full shrink-0">
                    {item.test_series?.is_paid ? "Premium" : "Free"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {item.duration || 90} mins
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      {item.question_count || 100} Qs
                    </span>
                  </div>

                  <Link
                    href={`/exam/${item.id}`}
                    onClick={() => triggerHaptic("medium")}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-4 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Start Test</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
