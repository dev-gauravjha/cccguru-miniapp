"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  RotateCcw,
  Home,
  Check,
  X,
  Languages,
  Loader2,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useTelegram } from "@/components/providers/TelegramProvider";
import { formatTimer } from "@/lib/utils";
import type {
  StudentTestAttempt,
  EvaluatedQuestionReview,
} from "@/types/database";

interface ResultDetailPageProps {
  params: Promise<{ attemptId: string }>;
}

export default function ResultDetailPage({ params }: ResultDetailPageProps) {
  const { attemptId } = use(params);
  const router = useRouter();
  const { triggerHaptic } = useTelegram();

  const [attempt, setAttempt] = useState<StudentTestAttempt | null>(null);
  const [evaluatedReviews, setEvaluatedReviews] = useState<
    EvaluatedQuestionReview[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewFilter, setReviewFilter] = useState<
    "all" | "correct" | "incorrect" | "unattempted"
  >("all");
  const [languageMode, setLanguageMode] = useState<"en" | "hi" | "both">("both");

  const fetchAttemptReview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mini-app/results/${attemptId}`);
      if (!res.ok) throw new Error("Failed to load test evaluation");
      const json = await res.json();
      setAttempt(json.attempt);
      setEvaluatedReviews(json.evaluatedReviews || []);
    } catch (err: any) {
      setError(err.message || "Failed to load test evaluation");
    } finally {
      setIsLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    fetchAttemptReview();
  }, [fetchAttemptReview]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Calculating Official Evaluation...
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Grading responses against trusted NIELIT CCC answer keys.
        </p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Unable to Load Result
        </h3>
        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 max-w-xs mb-4">
          {error || "Attempt could not be found."}
        </p>
        <button
          onClick={() => router.push("/results")}
          className="bg-primary-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
        >
          Return to Results History
        </button>
      </div>
    );
  }

  // Calculate official CCC grade
  const total = attempt.total_marks || attempt.total_questions || 100;
  const percentage = Math.round((attempt.score / total) * 100);
  const isPassed = percentage >= 50;

  let grade = "Failed";
  if (percentage >= 85) grade = "Grade S (Great)";
  else if (percentage >= 75) grade = "Grade A (Excellent)";
  else if (percentage >= 65) grade = "Grade B (Good)";
  else if (percentage >= 55) grade = "Grade C (Satisfactory)";
  else if (percentage >= 50) grade = "Grade D (Pass)";

  // Filter questions for review
  const filteredReviews = evaluatedReviews.filter((q) => {
    if (reviewFilter === "correct") return q.is_correct;
    if (reviewFilter === "incorrect")
      return q.user_selected_option && !q.is_correct;
    if (reviewFilter === "unattempted") return !q.user_selected_option;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col">
      <Header title="Result Evaluation" />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-12 space-y-5">
        {/* Score & Grade Hero Card */}
        <div
          className={`p-6 rounded-3xl text-white shadow-xl text-center space-y-4 relative overflow-hidden ${
            isPassed
              ? "bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800"
              : "bg-gradient-to-br from-rose-600 via-rose-700 to-red-800"
          }`}
        >
          <div className="relative z-10 space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full uppercase tracking-wider">
              {isPassed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Exam Passed
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  Needs Practice
                </>
              )}
            </span>

            <div className="text-4xl font-black tracking-tight">
              {attempt.score}{" "}
              <span className="text-xl font-normal opacity-80">/ {total}</span>
            </div>

            <div className="text-sm font-bold opacity-90">{grade}</div>
          </div>

          {/* Quick Metrics Bar inside hero */}
          <div className="relative z-10 grid grid-cols-3 gap-2 bg-black/15 backdrop-blur-xs p-3 rounded-2xl text-center text-xs">
            <div>
              <span className="text-white/70 text-[10px]">Percentage</span>
              <p className="font-extrabold text-sm">{percentage}%</p>
            </div>
            <div>
              <span className="text-white/70 text-[10px]">Accuracy</span>
              <p className="font-extrabold text-sm">{attempt.accuracy}%</p>
            </div>
            <div>
              <span className="text-white/70 text-[10px]">Time Spent</span>
              <p className="font-extrabold text-sm">
                {formatTimer(attempt.time_taken_seconds)}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Card */}
        <div className="bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-2xl shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Attempt Breakdown
          </h4>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 p-3 rounded-xl">
              <div className="text-emerald-700 dark:text-emerald-400 font-black text-lg leading-none">
                {attempt.correct_count}
              </div>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold mt-1 block">
                Correct
              </span>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60 p-3 rounded-xl">
              <div className="text-rose-700 dark:text-rose-400 font-black text-lg leading-none">
                {attempt.incorrect_count}
              </div>
              <span className="text-[10px] text-rose-800 dark:text-rose-300 font-semibold mt-1 block">
                Incorrect
              </span>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
              <div className="text-slate-700 dark:text-slate-300 font-black text-lg leading-none">
                {attempt.unanswered_count}
              </div>
              <span className="text-[10px] text-slate-500 font-semibold mt-1 block">
                Skipped
              </span>
            </div>
          </div>

          {/* Leaderboard Points Earned Banner (Enforces CCC rule: Score >= 50% to qualify) */}
          {isPassed ? (
            <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-teal-500/15 border border-amber-300 dark:border-amber-700/60 p-3.5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                  <Sparkles className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-900 dark:text-white">
                    +{attempt.correct_count} Leaderboard Points Earned!
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Passed ({percentage}%) • Ranked on Live Scoreboard
                  </p>
                </div>
              </div>
              <Link
                href="/leaderboard"
                onClick={() => triggerHaptic("medium")}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                Leaderboard
              </Link>
            </div>
          ) : (
            <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3.5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    0 Points for Leaderboard
                  </p>
                  <p className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold">
                    Score ≥ 50% required to enter leaderboard (You got {percentage}%)
                  </p>
                </div>
              </div>
              <Link
                href="/leaderboard"
                onClick={() => triggerHaptic("selection")}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold active:scale-95 transition-all"
              >
                View Ranks
              </Link>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Link
              href={`/exam/${attempt.test_item_id}`}
              onClick={() => triggerHaptic("medium")}
              className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reattempt Test</span>
            </Link>
            <Link
              href="/"
              className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center"
            >
              <Home className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Question Solutions Review Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Answer Review & Explanations
            </h3>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-semibold">
              <button
                onClick={() => setLanguageMode("en")}
                className={`px-1.5 py-0.5 rounded ${
                  languageMode === "en" ? "bg-white text-primary-600 shadow-2xs font-bold" : "text-slate-500"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguageMode("hi")}
                className={`px-1.5 py-0.5 rounded ${
                  languageMode === "hi" ? "bg-white text-primary-600 shadow-2xs font-bold" : "text-slate-500"
                }`}
              >
                HI
              </button>
              <button
                onClick={() => setLanguageMode("both")}
                className={`px-1.5 py-0.5 rounded ${
                  languageMode === "both" ? "bg-white text-primary-600 shadow-2xs font-bold" : "text-slate-500"
                }`}
              >
                Both
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-semibold">
            <button
              onClick={() => setReviewFilter("all")}
              className={`px-3 py-1 rounded-full ${
                reviewFilter === "all"
                  ? "bg-primary-600 text-white"
                  : "bg-white dark:bg-[#121626] text-slate-600 border border-slate-200 dark:border-slate-800"
              }`}
            >
              All ({evaluatedReviews.length})
            </button>
            <button
              onClick={() => setReviewFilter("correct")}
              className={`px-3 py-1 rounded-full ${
                reviewFilter === "correct"
                  ? "bg-emerald-600 text-white"
                  : "bg-white dark:bg-[#121626] text-slate-600 border border-slate-200 dark:border-slate-800"
              }`}
            >
              Correct ({attempt.correct_count})
            </button>
            <button
              onClick={() => setReviewFilter("incorrect")}
              className={`px-3 py-1 rounded-full ${
                reviewFilter === "incorrect"
                  ? "bg-rose-600 text-white"
                  : "bg-white dark:bg-[#121626] text-slate-600 border border-slate-200 dark:border-slate-800"
              }`}
            >
              Incorrect ({attempt.incorrect_count})
            </button>
            <button
              onClick={() => setReviewFilter("unattempted")}
              className={`px-3 py-1 rounded-full ${
                reviewFilter === "unattempted"
                  ? "bg-slate-700 text-white"
                  : "bg-white dark:bg-[#121626] text-slate-600 border border-slate-200 dark:border-slate-800"
              }`}
            >
              Skipped ({attempt.unanswered_count})
            </button>
          </div>

          {/* Solution Cards */}
          <div className="space-y-3 pt-1">
            {filteredReviews.map((q, idx) => {
              const options = (["A", "B", "C", "D"] as const).filter((k) =>
                Boolean(
                  (q as any)[`option_${k.toLowerCase()}_en`]?.trim() ||
                    (q as any)[`option_${k.toLowerCase()}_hi`]?.trim()
                )
              );

              return (
                <div
                  key={q.id}
                  className="bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-2xl shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      Question {idx + 1}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        q.is_correct
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : q.user_selected_option
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {q.is_correct ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Correct
                        </>
                      ) : q.user_selected_option ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          Incorrect
                        </>
                      ) : (
                        "Skipped"
                      )}
                    </span>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-1.5 text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                    {(languageMode === "en" || languageMode === "both") && (
                      <p>{q.question_en}</p>
                    )}
                    {(languageMode === "hi" || languageMode === "both") &&
                      q.question_hi && (
                        <p className="text-slate-800 dark:text-slate-200 font-medium font-sans">
                          {q.question_hi}
                        </p>
                      )}
                  </div>

                  {/* Options with Answer Key Highlights */}
                  <div className="space-y-2 pt-1">
                    {options.map((key) => {
                      const isCorrectAnswer = q.correct_option === key;
                      const isUserChoice = q.user_selected_option === key;
                      const optEn = (q as any)[`option_${key.toLowerCase()}_en`];
                      const optHi = (q as any)[`option_${key.toLowerCase()}_hi`];

                      let borderClass =
                        "border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40";
                      if (isCorrectAnswer) {
                        borderClass =
                          "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500";
                      } else if (isUserChoice && !isCorrectAnswer) {
                        borderClass =
                          "border-rose-400 bg-rose-50/60 dark:bg-rose-950/40 font-semibold text-rose-900 dark:text-rose-200";
                      }

                      return (
                        <div
                          key={key}
                          className={`p-3 rounded-xl border text-sm flex items-start gap-3 ${borderClass}`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                              isCorrectAnswer
                                ? "bg-emerald-600 text-white"
                                : isUserChoice
                                ? "bg-rose-600 text-white"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-600"
                            }`}
                          >
                            {key}
                          </div>
                          <div className="flex-1 space-y-1 min-w-0 pt-0.5">
                            {(languageMode === "en" || languageMode === "both") &&
                              optEn && <div className="leading-relaxed">{optEn}</div>}
                            {(languageMode === "hi" || languageMode === "both") &&
                              optHi && (
                                <div className="text-slate-700 dark:text-slate-300 font-medium font-sans leading-relaxed">
                                  {optHi}
                                </div>
                              )}
                          </div>
                          {isCorrectAnswer && (
                            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold shrink-0">
                              Correct Key
                            </span>
                          )}
                          {isUserChoice && !isCorrectAnswer && (
                            <span className="text-xs text-rose-700 dark:text-rose-400 font-bold shrink-0">
                              Your Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Section */}
                  {(q.explanation_en || q.explanation_hi) && (
                    <div className="bg-primary-50/60 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/60 p-3.5 rounded-xl text-sm space-y-1.5">
                      <span className="text-xs font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wider block">
                        Explanation
                      </span>
                      {(languageMode === "en" || languageMode === "both") &&
                        q.explanation_en && (
                          <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                            {q.explanation_en}
                          </p>
                        )}
                      {(languageMode === "hi" || languageMode === "both") &&
                        q.explanation_hi && (
                          <p className="text-slate-700 dark:text-slate-300 font-medium font-sans leading-relaxed">
                            {q.explanation_hi}
                          </p>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
