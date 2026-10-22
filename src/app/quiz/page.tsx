"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Zap,
  Target,
  Clock,
  Play,
  ChevronRight,
  Loader2,
  AlertCircle,
  Award,
  Layers,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useTelegram } from "@/components/providers/TelegramProvider";
import { formatTimer } from "@/lib/utils";
import type { LatestAttemptSummary } from "@/types/database";

interface QuizItem {
  id: string;
  title: string;
  seriesTitle: string;
  questionCount: number;
  duration: number;
  difficulty: string;
  isPaid: boolean;
  hasQuestions: boolean;
  latestAttempt?: LatestAttemptSummary | null;
}

interface QuizCatalogData {
  quizItems: QuizItem[];
  userStats: {
    quizzesCompleted: number;
    totalQuestionsSolved: number;
    avgAccuracy: number;
    bestStreak: number;
    dayStreak?: number;
    totalPoints: number;
  };
}

export default function QuizHomePage() {
  const { triggerHaptic, user, session } = useTelegram();
  const [data, setData] = useState<QuizCatalogData | null>(null);
  const [loginStreak, setLoginStreak] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const studentId = session?.studentId || (user?.id ? `tg_${user.id}` : "");
  const canonicalUserId = session?.canonicalUserId || "";

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (studentId) params.set("studentId", studentId);
      if (canonicalUserId) params.set("canonicalUserId", canonicalUserId);
      const url = params.toString()
        ? `/api/quiz/catalog?${params.toString()}`
        : "/api/quiz/catalog";

      const [catalogRes, dashRes] = await Promise.all([
        fetch(url),
        fetch("/api/mini-app/dashboard").catch(() => null),
      ]);

      if (!catalogRes.ok) throw new Error("Failed to load quiz catalog.");
      const json = await catalogRes.json();
      setData(json);

      if (dashRes && dashRes.ok) {
        const dashJson = await dashRes.json();
        if (dashJson?.stats?.dayStreak) {
          setLoginStreak(dashJson.stats.dayStreak);
        }
      } else if (json?.userStats?.dayStreak) {
        setLoginStreak(json.userStats.dayStreak);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load quizzes");
    } finally {
      setIsLoading(false);
    }
  }, [studentId, canonicalUserId]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const stats = data?.userStats || {
    quizzesCompleted: 0,
    avgAccuracy: 0,
    bestStreak: 0,
    dayStreak: 1,
    totalPoints: 0,
  };

  const quizItems = data?.quizItems || [];
  const featuredQuiz = quizItems[0] || null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col pb-24">
      <Header
        title="CCC Quiz"
        streak={loginStreak}
        points={stats.totalPoints}
      />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 space-y-5">
        {/* Top Hero Banner: Featured Sprint from Supabase */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-700 text-white p-5 shadow-xl shadow-emerald-700/20">
          <div className="relative z-10 space-y-3">
            <div>
              <h2 className="text-xl font-black">
                {featuredQuiz ? featuredQuiz.title : "CCC Interactive Quiz ⚡"}
              </h2>
              <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                {featuredQuiz
                  ? `${featuredQuiz.seriesTitle} • ${featuredQuiz.questionCount} live practice questions with instant answer keys!`
                  : "Interactive quiz sprint with instant feedback."}
              </p>
            </div>

            {featuredQuiz && featuredQuiz.latestAttempt && (
              <div className="flex items-center gap-2 text-xs pt-0.5">
                <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full font-bold">
                  Last Score: {featuredQuiz.latestAttempt.score} / {featuredQuiz.latestAttempt.totalMarks} ({featuredQuiz.latestAttempt.accuracy}%)
                </span>
                <Link
                  href={`/results/${featuredQuiz.latestAttempt.id}`}
                  onClick={() => triggerHaptic("selection")}
                  className="underline text-amber-300 font-bold hover:text-white flex items-center gap-0.5"
                >
                  <span>View Result</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {featuredQuiz ? (
              <Link
                href={`/quiz/${featuredQuiz.id}`}
                onClick={() => triggerHaptic("selection")}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
              >
                {featuredQuiz.latestAttempt ? (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Reattempt Quiz ({featuredQuiz.questionCount} Qs)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Quiz ({featuredQuiz.questionCount} Qs)</span>
                  </>
                )}
              </Link>
            ) : (
              <div className="py-2.5 text-center text-xs text-emerald-200">
                No active quiz sprint currently available.
              </div>
            )}
          </div>
        </section>

        {/* Player Stats Grid (Quizzes Solved & Accuracy) */}
        <section className="grid grid-cols-2 gap-3">
          {/* Quizzes Completed */}
          <div className="bg-white dark:bg-[#121626] border-2 border-slate-200/80 dark:border-slate-800 border-b-4 rounded-2xl p-3 text-center shadow-xs flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 border border-primary-200 dark:border-primary-800">
              <Award className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                {stats.quizzesCompleted}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                Quizzes Solved
              </span>
            </div>
          </div>

          {/* Average Accuracy */}
          <div className="bg-white dark:bg-[#121626] border-2 border-slate-200/80 dark:border-slate-800 border-b-4 rounded-2xl p-3 text-center shadow-xs flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
              <Target className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-sm font-black text-slate-900 dark:text-white block leading-tight">
                {stats.avgAccuracy}%
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                Avg. Accuracy
              </span>
            </div>
          </div>
        </section>

        {/* Database-Driven Quiz List Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary-600" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Available Quizzes
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              {quizItems.length} Quizzes
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3 py-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
              <p className="text-xs text-slate-400">Loading quizzes...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
              <p className="text-xs text-rose-700 dark:text-rose-300 font-bold">{error}</p>
              <button
                onClick={fetchCatalog}
                className="px-3 py-1 bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                Retry
              </button>
            </div>
          ) : quizItems.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6">
              <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No Quizzes Available Yet
              </h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Quiz items from the test series will appear here once published.
              </p>
              <Link
                href="/tests"
                className="px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-transform inline-block"
              >
                Browse Mock Tests
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {quizItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#121626] border-2 border-slate-200/80 dark:border-slate-800 border-b-4 rounded-2xl p-4 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 shrink-0">
                          Quiz
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            item.difficulty.toLowerCase() === "beginner" || item.difficulty.toLowerCase() === "easy"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : item.difficulty.toLowerCase() === "intermediate" || item.difficulty.toLowerCase() === "medium"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                          }`}
                        >
                          {item.difficulty}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          {item.seriesTitle}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug truncate">
                        {item.title}
                      </h4>

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium pt-1">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-slate-400" />
                          {item.questionCount} Questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          ~{item.duration} mins
                        </span>
                      </div>
                    </div>

                    {/* Action Button: Reattempt if attempted, or Play */}
                    {item.latestAttempt ? (
                      <Link
                        href={`/quiz/${item.id}`}
                        onClick={() => triggerHaptic("medium")}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs border-b-3 border-amber-700 active:border-b-0 active:translate-y-1 shadow-md shadow-amber-500/20 shrink-0 flex items-center gap-1.5 self-center"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reattempt</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/quiz/${item.id}`}
                        onClick={() => triggerHaptic("selection")}
                        className="px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-black text-xs border-b-3 border-primary-800 active:border-b-0 active:translate-y-1 shadow-md shadow-primary-600/20 shrink-0 flex items-center gap-1 self-center"
                      >
                        <span>Play</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>

                  {/* Inline Result Card if Attempted */}
                  {item.latestAttempt && (
                    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-black text-slate-700 dark:text-slate-300">
                          Score: {item.latestAttempt.score} / {item.latestAttempt.totalMarks}
                        </span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border ${
                            item.latestAttempt.isPassed
                              ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                              : "bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-300"
                          }`}
                        >
                          {item.latestAttempt.isPassed ? "PASSED ✓" : "NEEDS PRACTICE"}
                        </span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-[10px]">
                          {item.latestAttempt.accuracy}% Accuracy
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                        <span>Time: {formatTimer(item.latestAttempt.timeTakenSeconds)}</span>
                        <Link
                          href={`/results/${item.latestAttempt.id}`}
                          onClick={() => triggerHaptic("selection")}
                          className="text-primary-600 dark:text-primary-400 font-bold hover:underline flex items-center gap-0.5"
                        >
                          <span>View Result</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
