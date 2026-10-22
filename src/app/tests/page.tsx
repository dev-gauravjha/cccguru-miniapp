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
  Shield,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useTelegram } from "@/components/providers/TelegramProvider";
import { GameButton } from "@/components/gamified/GameButton";
import { GameCard } from "@/components/gamified/GameCard";

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

  const getDifficultyDetails = (diff: string) => {
    switch (diff?.toLowerCase()) {
      case "easy":
        return {
          label: "Easy",
          points: "+75 pts",
          badgeClass:
            "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700",
        };
      case "hard":
        return {
          label: "Hard",
          points: "+150 pts",
          badgeClass:
            "text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700",
        };
      default:
        return {
          label: "Medium",
          points: "+100 pts",
          badgeClass:
            "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700",
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col">
      <Header title="Mock Tests" />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3.5 pb-12 space-y-4">
        {/* Practice Center Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 text-white p-5 shadow-lg shadow-blue-700/25 border-2 border-indigo-400/40 border-b-[6px] border-b-indigo-950">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-200">
              <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Languages className="w-3.5 h-3.5" />
                Bilingual (EN / HI)
              </span>
              <span className="bg-amber-400/25 text-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-extrabold">
                <Target className="w-3.5 h-3.5" />
                Exam Practice
              </span>
            </div>

            <h2 className="text-lg font-black tracking-tight">
              {selectedCategory === "all"
                ? "NIELIT CCC Mock Test Series 📝"
                : selectedCategoryObj?.title || "CCC Practice Center"}
            </h2>

            <p className="text-xs text-indigo-100 max-w-[320px]">
              Full-length timed exams with authentic NIELIT marking. Solve questions, earn points, and climb the national leaderboard.
            </p>
          </div>

          <div className="absolute -right-4 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        </div>

        {/* Tactile Category Filter Tabs */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => {
                setSelectedCategory("all");
                triggerHaptic("selection");
              }}
              className={`btn-3d px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap flex items-center gap-1.5 transition-all ${
                selectedCategory === "all"
                  ? "btn-3d-primary shadow-xs"
                  : "bg-white dark:bg-[#121626] text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-800 border-b-4 border-b-slate-300 dark:border-b-slate-900"
              }`}
            >
              <span>All Tests</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  selectedCategory === "all"
                    ? "bg-white/25 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}
              >
                {items.length}
              </span>
            </button>

            {categories.map((cat) => {
              const count = getCategoryCount(cat.id);
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    triggerHaptic("selection");
                  }}
                  className={`btn-3d px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? "btn-3d-primary shadow-xs"
                      : "bg-white dark:bg-[#121626] text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-800 border-b-4 border-b-slate-300 dark:border-b-slate-900"
                  }`}
                >
                  <span>{cat.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected
                        ? "bg-white/25 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
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
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            <span className="text-xs font-bold">Loading practice tests...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800 p-4 rounded-2xl text-center space-y-2">
            <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
            <p className="text-xs text-rose-700 dark:text-rose-400 font-bold">
              {error}
            </p>
            <button
              onClick={fetchTests}
              className="btn-3d-rose px-4 py-1.5 rounded-xl text-xs font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredItems.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-[#121626] border-2 border-slate-200 dark:border-slate-800 border-b-[5px] rounded-3xl p-6 space-y-3">
            <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
              No Tests in This Category
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              New practice tests are currently being prepared for this category.
            </p>
            <button
              onClick={() => setSelectedCategory("all")}
              className="btn-3d-primary px-4 py-2 rounded-xl text-xs font-black"
            >
              View All Sets ({items.length})
            </button>
          </div>
        )}

        {/* Test Items List */}
        {!isLoading && filteredItems.length > 0 && (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const diff = getDifficultyDetails(item.difficulty || "Medium");
              const isQuiz = Boolean(
                (item.test_type || item.type || "").toLowerCase().includes("quiz")
              );

              return (
                <div key={item.id} className="game-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-950/80 px-2 py-0.5 rounded-md border border-primary-200 dark:border-primary-800">
                          {item.test_type || "Mock Test"}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1 ${diff.badgeClass}`}
                        >
                          <Shield className="w-3 h-3" />
                          {diff.label}
                        </span>
                      </div>

                      <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                        {item.title}
                      </h3>
                    </div>

                    <span className="text-[10px] font-black bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {diff.points}
                    </span>
                  </div>

                  {/* Meta stats and 3D Action button */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {item.duration || 90} mins
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-primary-500" />
                        {item.question_count || 100} Qs
                      </span>
                    </div>

                    {isQuiz ? (
                      <Link
                        href={`/quiz/${item.id}`}
                        onClick={() => triggerHaptic("selection")}
                        className="btn-3d-amber px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 fill-current" />
                        <span>Play Quiz</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/exam/${item.id}`}
                        onClick={() => triggerHaptic("medium")}
                        className="btn-3d-primary px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Test</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
