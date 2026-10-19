"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Flame,
  Target,
  Trophy,
  ArrowRight,
  Clock,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  Layers,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useTelegram } from "@/components/providers/TelegramProvider";
import { formatDate } from "@/lib/utils";

interface DashboardData {
  student: {
    id: string;
    name: string;
    username?: string;
    photoUrl?: string;
    isDevPreview?: boolean;
  } | null;
  stats: {
    testsTaken: number;
    avgAccuracy: number;
    totalQuestionsSolved: number;
    dayStreak: number;
    preparationPercentage: number;
  };
  featuredSeries: any[];
  mockTests: any[];
  chapterTests: any[];
  recentResults: any[];
}

export default function HomePage() {
  const { session, triggerHaptic } = useTelegram();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mini-app/dashboard");
      if (!res.ok) throw new Error("Failed to load dashboard data");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const studentName = session?.name || data?.student?.name || "Student";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col">
      <Header streak={data?.stats?.dayStreak || 1} />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-8 space-y-5">
        {/* Student Welcome Banner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-600 text-white p-5 shadow-lg shadow-primary-600/20">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Target: CCC Exam 2026
            </span>
            <h2 className="text-xl font-bold tracking-tight">
              Namaste, {studentName}! 👋
            </h2>
            <p className="text-xs text-primary-100 mt-1 max-w-[260px] leading-relaxed">
              Boost your preparation with official bilingual mock tests & instant answer keys.
            </p>

            {/* Quick Action Button */}
            <div className="mt-4 flex items-center gap-2.5">
              {data?.mockTests?.[0] && (
                <Link
                  href={`/exam/${data.mockTests[0].id}`}
                  onClick={() => triggerHaptic("medium")}
                  className="bg-white text-primary-700 hover:bg-primary-50 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Practice Test</span>
                </Link>
              )}
            </div>
          </div>

          {/* Background Decorative Rings */}
          <div className="absolute -right-6 -bottom-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute right-4 top-2 text-white/10 font-black text-7xl select-none pointer-events-none">
            CCC
          </div>
        </section>

        {/* Learning Progress Metrics */}
        <section className="grid grid-cols-3 gap-2.5">
          <div className="bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 p-3.5 rounded-2xl shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-2">
              <Target className="w-4 h-4" />
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white leading-none">
              {data?.stats?.testsTaken ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Tests Taken
            </div>
          </div>

          <div className="bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 p-3.5 rounded-2xl shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white leading-none">
              {data?.stats?.avgAccuracy ?? 0}%
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Accuracy
            </div>
          </div>

          <div className="bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 p-3.5 rounded-2xl shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-2">
              <Flame className="w-4 h-4" />
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white leading-none">
              {data?.stats?.dayStreak ?? 1}d
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Streak
            </div>
          </div>
        </section>

        {/* Loading State Skeleton */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <span className="text-xs">Loading CCC tests & syllabus...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl text-center">
            <p className="text-xs text-rose-700 dark:text-rose-400 font-medium mb-2">
              {error}
            </p>
            <button
              onClick={fetchDashboard}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Chapter-wise Practice Tests */}
        {!isLoading && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  Chapter-wise Practice
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  9 Official NIELIT CCC Syllabus Chapters
                </p>
              </div>
              <Link
                href="/chapters"
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 flex items-center hover:underline"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {data?.chapterTests?.slice(0, 3).map((chap: any) => (
                <Link
                  key={chap.chapterId}
                  href={`/exam/${chap.testItemId}`}
                  onClick={() => triggerHaptic("light")}
                  className="bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 p-3.5 rounded-xl hover:border-primary-400 transition-colors flex items-center justify-between group shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 font-bold text-xs flex items-center justify-center shrink-0">
                      Ch {chap.sortOrder}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                        {chap.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {chap.hindiTitle || `${chap.questionCount} Questions`}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 text-slate-400 group-hover:text-primary-600">
                    <span className="text-[11px] font-semibold text-primary-600 bg-primary-50 dark:bg-primary-950/50 px-2 py-0.5 rounded-md">
                      Start
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Full Mock Test Series */}
        {!isLoading && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  Full Mock Tests
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Timed 100-question exam simulations
                </p>
              </div>
              <Link
                href="/tests"
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 flex items-center hover:underline"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {data?.mockTests?.slice(0, 4).map((test: any) => (
                <div
                  key={test.id}
                  className="bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-2xl shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 px-2 py-0.5 rounded-md">
                        {test.test_type || "Full Mock Test"}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
                        {test.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full shrink-0">
                      Free
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {test.duration} mins
                      </span>
                      <span>•</span>
                      <span>{test.question_count || 100} Qs</span>
                    </div>

                    <Link
                      href={`/exam/${test.id}`}
                      onClick={() => triggerHaptic("medium")}
                      className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1"
                    >
                      <span>Take Test</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Results History */}
        {!isLoading && data?.recentResults && data.recentResults.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Attempts
              </h3>
              <Link
                href="/results"
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
              >
                All History
              </Link>
            </div>

            <div className="space-y-2">
              {data.recentResults.map((res: any) => (
                <Link
                  key={res.id}
                  href={`/results/${res.id}`}
                  className="bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 p-3 rounded-xl flex items-center justify-between hover:border-primary-400 transition-colors"
                >
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {res.test_item?.title || "CCC Practice Test"}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatDate(res.submitted_at || res.created_at)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      Score: {res.score} / {res.total_marks}
                    </span>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      {res.accuracy}% Accuracy
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
