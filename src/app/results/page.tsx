"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle,
  Play,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useTelegram } from "@/components/providers/TelegramProvider";
import { formatDate, formatTimer } from "@/lib/utils";
import type { StudentTestAttempt } from "@/types/database";

export default function ResultsHistoryPage() {
  const { triggerHaptic, user, session } = useTelegram();
  const [results, setResults] = useState<StudentTestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const studentId = session?.studentId || (user?.id ? `tg_${user.id}` : "");
  const canonicalUserId = session?.canonicalUserId || "";

  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (studentId) params.set("studentId", studentId);
      if (canonicalUserId) params.set("canonicalUserId", canonicalUserId);
      const url = params.toString()
        ? `/api/mini-app/results?${params.toString()}`
        : "/api/mini-app/results";

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load test history");
      const json = await res.json();
      setResults(json.results || []);
    } catch (err: any) {
      setError(err.message || "Failed to load results history");
    } finally {
      setIsLoading(false);
    }
  }, [studentId, canonicalUserId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Overall performance calculations
  const totalAttempts = results.length;
  const avgScore =
    totalAttempts > 0
      ? (
          results.reduce((acc, r) => acc + (r.score || 0), 0) / totalAttempts
        ).toFixed(1)
      : "0";
  const avgAccuracy =
    totalAttempts > 0
      ? Math.round(
          results.reduce((acc, r) => acc + (r.accuracy || 0), 0) / totalAttempts
        )
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col select-none">
      <Header title="My Results & History" />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3.5 pb-12 space-y-4">
        {/* Analytics Card */}
        {totalAttempts > 0 && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-950 text-white p-5 shadow-lg border-2 border-indigo-400/40 border-b-[6px] border-b-indigo-950 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-200 tracking-wide uppercase">
                Performance Dashboard 📊
              </span>
              <span className="text-xs bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full font-black">
                {totalAttempts} Tests Taken
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-indigo-200 font-bold block">
                  Average Score
                </span>
                <div className="text-xl font-black text-white mt-0.5">
                  {avgScore} pts
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-indigo-200 font-bold block">
                  Overall Accuracy
                </span>
                <div className="text-xl font-black text-emerald-300 mt-0.5">
                  {avgAccuracy}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
            <span className="text-xs font-bold">Loading past exam scores...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="game-card bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 p-5 rounded-2xl text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-xs text-rose-700 dark:text-rose-400 font-bold mb-3">
              {error}
            </p>
            <button
              onClick={fetchResults}
              className="btn-3d btn-3d-rose px-4 py-2 rounded-xl text-xs font-black cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && results.length === 0 && (
          <div className="text-center py-12 game-card p-6 space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-primary-100 dark:bg-primary-950/70 border-2 border-primary-400 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto shadow-md">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                No Tests Attempted Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Take authentic CCC mock tests to earn points, track your grade, and unlock your position on the national scoreboard!
              </p>
            </div>
            <Link
              href="/tests"
              onClick={() => triggerHaptic("medium")}
              className="btn-3d btn-3d-primary inline-flex items-center gap-1.5 text-xs font-black px-5 py-2.5 rounded-2xl shadow-md cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Take a Mock Test</span>
            </Link>
          </div>
        )}

        {/* Results List */}
        {!isLoading && results.length > 0 && (
          <div className="space-y-3">
            {results.map((r) => {
              const isPassed = r.score >= (r.total_marks || 100) * 0.5;

              return (
                <div
                  key={r.id}
                  className="game-card p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(r.submitted_at || r.created_at)}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                        {r.test_item?.title || "CCC Practice Test"}
                      </h4>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0 border ${
                        isPassed
                          ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                          : "bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                      }`}
                    >
                      {isPassed ? "PASSED" : "FAILED"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 p-2.5 rounded-2xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Score</span>
                      <p className="font-black text-slate-800 dark:text-slate-200 text-sm">
                        {r.score} / {r.total_marks}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Accuracy</span>
                      <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {r.accuracy}%
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Time</span>
                      <p className="font-black text-slate-800 dark:text-slate-200 text-sm">
                        {formatTimer(r.time_taken_seconds)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      href={`/results/${r.id}`}
                      onClick={() => triggerHaptic("light")}
                      className="text-xs font-black text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                    >
                      <span>Review Solutions</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <Link
                      href={`/exam/${r.test_item_id}`}
                      onClick={() => triggerHaptic("medium")}
                      className="btn-3d-amber px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reattempt</span>
                    </Link>
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

