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
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useTelegram } from "@/components/providers/TelegramProvider";
import { formatDate, formatTimer } from "@/lib/utils";
import type { StudentTestAttempt } from "@/types/database";

export default function ResultsHistoryPage() {
  const { triggerHaptic } = useTelegram();
  const [results, setResults] = useState<StudentTestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mini-app/results");
      if (!res.ok) throw new Error("Failed to load test history");
      const json = await res.json();
      setResults(json.results || []);
    } catch (err: any) {
      setError(err.message || "Failed to load results history");
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col">
      <Header title="My Results & History" />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-8 space-y-4">
        {/* Analytics Card */}
        {totalAttempts > 0 && (
          <div className="bg-gradient-to-br from-primary-800 to-indigo-900 text-white p-4 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary-200">
                Performance Summary
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                {totalAttempts} Tests Taken
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl">
                <span className="text-[10px] text-primary-200">
                  Average Score
                </span>
                <div className="text-lg font-black text-white mt-0.5">
                  {avgScore} pts
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl">
                <span className="text-[10px] text-primary-200">
                  Overall Accuracy
                </span>
                <div className="text-lg font-black text-white mt-0.5">
                  {avgAccuracy}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <span className="text-xs">Loading past test results...</span>
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
              onClick={fetchResults}
              className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && results.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No Tests Attempted Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Practice official CCC mock tests to view your scores, accuracy, and detailed answer reviews here.
              </p>
            </div>
            <Link
              href="/tests"
              onClick={() => triggerHaptic("medium")}
              className="inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Browse Mock Tests</span>
            </Link>
          </div>
        )}

        {/* Results List */}
        {!isLoading && results.length > 0 && (
          <div className="space-y-3">
            {results.map((r) => {
              const isPassed = r.score >= (r.total_marks || 100) * 0.5;

              return (
                <Link
                  key={r.id}
                  href={`/results/${r.id}`}
                  onClick={() => triggerHaptic("light")}
                  className="bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-2xl shadow-xs block space-y-3 hover:border-primary-400 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                        <Calendar className="w-3 h-3" />
                        {formatDate(r.submitted_at || r.created_at)}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {r.test_item?.title || "CCC Practice Test"}
                      </h4>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0 ${
                        isPassed
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                      }`}
                    >
                      {isPassed ? "PASSED" : "FAILED"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 p-2.5 rounded-xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400">Score</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {r.score} / {r.total_marks}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Accuracy</span>
                      <p className="font-bold text-emerald-600">
                        {r.accuracy}%
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Time</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {formatTimer(r.time_taken_seconds)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-primary-600 dark:text-primary-400 pt-1">
                    <span>Review Answer Solutions</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
