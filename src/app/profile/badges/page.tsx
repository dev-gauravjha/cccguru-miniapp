"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  ArrowLeft,
  Flame,
  Zap,
  Target,
  Trophy,
  CheckCircle2,
  Lock,
  Sparkles,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { GameProgressBar } from "@/components/gamified/GamifiedWidgets";
import { useTelegram } from "@/components/providers/TelegramProvider";
import { getPlayerBadges, type BadgeItem } from "@/lib/badges";
import { getPlayerLevel } from "@/components/gamified/GamifiedWidgets";

export default function BadgesPage() {
  const router = useRouter();
  const { triggerHaptic } = useTelegram();

  const [stats, setStats] = useState({
    testsTaken: 0,
    totalPoints: 0,
    dayStreak: 0,
    totalQuestionsSolved: 0,
    avgAccuracy: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "unlocked" | "locked">("all");

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/mini-app/dashboard");
      if (res.ok) {
        const json = await res.json();
        if (json.stats) {
          setStats((prev) => ({
            ...prev,
            ...json.stats,
            totalPoints: json.stats.totalPoints ?? prev.totalPoints,
          }));
        }
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const allBadges = useMemo(() => getPlayerBadges(stats), [stats]);

  const unlockedCount = useMemo(
    () => allBadges.filter((b) => b.isUnlocked).length,
    [allBadges]
  );

  const playerLevel = useMemo(
    () =>
      getPlayerLevel(
        stats.totalPoints,
        stats.totalQuestionsSolved,
        stats.avgAccuracy
      ),
    [stats]
  );

  const categories = useMemo(() => {
    return [
      { id: "all", label: "All Badges" },
      { id: "tests", label: "Mock Tests" },
      { id: "streak", label: "Streaks" },
      { id: "points", label: "Points" },
      { id: "solver", label: "Questions" },
      { id: "accuracy", label: "Accuracy" },
    ];
  }, []);

  const filteredBadges = useMemo(() => {
    return allBadges.filter((badge) => {
      // Category filter
      if (selectedCategory !== "all" && badge.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (filterStatus === "unlocked" && !badge.isUnlocked) return false;
      if (filterStatus === "locked" && badge.isUnlocked) return false;
      return true;
    });
  }, [allBadges, selectedCategory, filterStatus]);

  const totalBadges = allBadges.length;
  const overallPercentage = Math.round((unlockedCount / totalBadges) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col select-none">
      <Header
        title="Badges & Trophies"
        streak={stats.dayStreak}
        points={stats.totalPoints}
      />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3.5 pb-16 space-y-4">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            onClick={() => triggerHaptic("light")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </Link>

          <Link
            href="/results"
            onClick={() => triggerHaptic("light")}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
          >
            <span>My Results</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Hero Trophy Showcase Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-amber-700 to-indigo-900 text-white p-5 shadow-lg border-2 border-amber-400/40 border-b-[6px] border-b-amber-950 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Award className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 block">
                  Achievement Showcase
                </span>
                <h2 className="text-base font-black text-white leading-tight">
                  Trophy Cabinet 🏆
                </h2>
              </div>
            </div>

            <div className="text-right">
              <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-1 rounded-full shadow-xs">
                {unlockedCount} / {totalBadges} Earned
              </span>
            </div>
          </div>

          {/* Overall Completion Progress */}
          <div className="bg-black/20 backdrop-blur-xs p-3 rounded-2xl border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-amber-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Collection Progress
              </span>
              <span className="text-white">{overallPercentage}% Complete</span>
            </div>
            <GameProgressBar
              progress={overallPercentage}
              color="amber"
              height="sm"
            />
          </div>

          <p className="text-[11px] text-amber-100/90 leading-relaxed font-medium">
            Complete mock tests, maintain daily study streaks, and solve questions to level up your badges!
          </p>
        </div>

        {/* Quick Filter: Unlocked vs Locked vs All */}
        <div className="flex items-center justify-between gap-1.5 bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => {
              triggerHaptic("selection");
              setFilterStatus("all");
            }}
            className={`flex-1 py-1.5 rounded-xl text-center cursor-pointer transition-all ${
              filterStatus === "all"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            All ({allBadges.length})
          </button>
          <button
            onClick={() => {
              triggerHaptic("selection");
              setFilterStatus("unlocked");
            }}
            className={`flex-1 py-1.5 rounded-xl text-center cursor-pointer transition-all ${
              filterStatus === "unlocked"
                ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs font-black"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Earned ({unlockedCount})
          </button>
          <button
            onClick={() => {
              triggerHaptic("selection");
              setFilterStatus("locked");
            }}
            className={`flex-1 py-1.5 rounded-xl text-center cursor-pointer transition-all ${
              filterStatus === "locked"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Locked ({totalBadges - unlockedCount})
          </button>
        </div>

        {/* Category Horizontal Scroll Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                triggerHaptic("selection");
                setSelectedCategory(cat.id);
              }}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all border ${
                selectedCategory === cat.id
                  ? "bg-primary-600 text-white border-primary-600 shadow-xs"
                  : "bg-white dark:bg-[#121626] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Badge Cards Grid */}
        <div className="space-y-3">
          {filteredBadges.map((badge) => {
            const isDone = badge.isUnlocked;

            return (
              <div
                key={badge.id}
                className={`game-card p-4 space-y-3 transition-all ${
                  isDone
                    ? "border-amber-300 dark:border-amber-500/50 bg-gradient-to-br from-amber-500/5 to-transparent shadow-xs"
                    : "opacity-85 border-slate-200 dark:border-slate-800/80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border shadow-xs ${
                        isDone
                          ? "bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700/80 ring-2 ring-amber-400/20"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 grayscale"
                      }`}
                    >
                      {badge.emoji}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-950/80 px-2 py-0.5 rounded-md border border-primary-200 dark:border-primary-800">
                          {badge.level}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {badge.categoryLabel}
                        </span>
                      </div>

                      <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                        {badge.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                        {badge.desc}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        EARNED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full">
                        <Lock className="w-3 h-3" />
                        LOCKED
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar towards completion */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-500 dark:text-slate-400">
                      Requirement Progress
                    </span>
                    <span
                      className={`font-black ${
                        isDone
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {Math.min(badge.currentValue, badge.targetValue)} / {badge.targetValue} {badge.unit} ({badge.progressPercent}%)
                    </span>
                  </div>
                  <GameProgressBar
                    progress={badge.progressPercent}
                    color={isDone ? "emerald" : "amber"}
                    height="sm"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Next Steps CTA */}
        <div className="bg-gradient-to-r from-primary-600 to-indigo-700 rounded-3xl p-4 text-white text-center space-y-2.5 border-2 border-primary-400/40 border-b-[5px] border-b-primary-950">
          <h4 className="text-sm font-black">Ready to unlock more badges?</h4>
          <p className="text-xs text-primary-100 leading-relaxed max-w-xs mx-auto">
            Take full-length timed tests or quick practice sprints to level up faster!
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <Link
              href="/tests"
              onClick={() => triggerHaptic("medium")}
              className="btn-3d bg-white text-primary-700 font-black text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer hover:bg-slate-50"
            >
              Take Mock Test
            </Link>
            <Link
              href="/quiz"
              onClick={() => triggerHaptic("medium")}
              className="btn-3d btn-3d-amber font-black text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer"
            >
              Quiz Sprint ⚡
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
