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
  Star,
  Trophy,
  Target,
  Zap,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useTelegram } from "@/components/providers/TelegramProvider";
import { formatTimer } from "@/lib/utils";
import { ConfettiEffects } from "@/components/quiz/ConfettiEffects";
import { playFinishSound, playTapSound } from "@/lib/quiz-sounds";
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

      // If passed, play finish sound fanfare!
      const total = json.attempt?.total_marks || json.attempt?.total_questions || 100;
      const pct = Math.round(((json.attempt?.score || 0) / total) * 100);
      if (pct >= 50) {
        setTimeout(() => {
          playFinishSound();
        }, 300);
      }
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
        <div className="w-16 h-16 rounded-3xl bg-primary-100 dark:bg-primary-950 flex items-center justify-center border-2 border-primary-500/30 shadow-lg mb-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">
          Calculating Exam Score...
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
          Evaluating answers against verified NIELIT CCC exam keys and grading your performance.
        </p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/70 border-2 border-rose-500/30 flex items-center justify-center text-rose-500 mb-4 shadow-lg">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
          Unable to Load Result
        </h3>
        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 max-w-xs mb-4">
          {error || "Attempt could not be found."}
        </p>
        <button
          onClick={() => router.push("/results")}
          className="btn-3d btn-3d-primary px-5 py-2.5 rounded-2xl text-xs font-black shadow-md cursor-pointer"
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
  let gradeBadgeColor = "bg-rose-500/20 text-rose-300 border-rose-400/40";
  if (percentage >= 85) {
    grade = "Grade S (Great)";
    gradeBadgeColor = "bg-amber-400/25 text-amber-200 border-amber-300/40";
  } else if (percentage >= 75) {
    grade = "Grade A (Excellent)";
    gradeBadgeColor = "bg-emerald-400/25 text-emerald-200 border-emerald-300/40";
  } else if (percentage >= 65) {
    grade = "Grade B (Good)";
    gradeBadgeColor = "bg-teal-400/25 text-teal-200 border-teal-300/40";
  } else if (percentage >= 55) {
    grade = "Grade C (Satisfactory)";
    gradeBadgeColor = "bg-blue-400/25 text-blue-200 border-blue-300/40";
  } else if (percentage >= 50) {
    grade = "Grade D (Pass)";
    gradeBadgeColor = "bg-indigo-400/25 text-indigo-200 border-indigo-300/40";
  }

  // Filter questions for review
  const filteredReviews = evaluatedReviews.filter((q) => {
    if (reviewFilter === "correct") return q.is_correct;
    if (reviewFilter === "incorrect")
      return q.user_selected_option && !q.is_correct;
    if (reviewFilter === "unattempted") return !q.user_selected_option;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col select-none">
      <Header title="Result Evaluation" />

      {/* Confetti Celebration on Passing */}
      <ConfettiEffects active={isPassed} count={36} />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3.5 pb-12 space-y-4">
        {/* 1. Gamified Score & Grade Hero Card */}
        <div
          className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-xl text-center space-y-4 border-2 ${
            isPassed
              ? "bg-gradient-to-br from-emerald-600 via-teal-700 to-indigo-900 border-emerald-400/50 border-b-[6px] border-b-emerald-950 shadow-emerald-700/25"
              : "bg-gradient-to-br from-indigo-800 via-purple-900 to-slate-900 border-indigo-400/40 border-b-[6px] border-b-slate-950 shadow-indigo-900/25"
          }`}
        >
          {/* Top Status Pill */}
          <div className="relative z-10 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full uppercase tracking-wider">
              {isPassed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Exam Qualified</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-300" />
                  <span>Needs Practice</span>
                </>
              )}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full border backdrop-blur-md ${gradeBadgeColor}`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{grade}</span>
            </span>
          </div>

          {/* Central Score Display */}
          <div className="relative z-10 space-y-1">
            <div className="text-5xl font-black tracking-tight flex items-baseline justify-center gap-1">
              <span>{attempt.score}</span>
              <span className="text-xl font-bold opacity-70">/ {total}</span>
            </div>
            <p className="text-xs font-bold text-white/80">
              {isPassed
                ? "Congratulations! You passed the NIELIT CCC benchmark."
                : "Keep practicing! A score of 50% or above is required to pass."}
            </p>
          </div>

          {/* Quick Metrics Bar inside hero */}
          <div className="relative z-10 grid grid-cols-3 gap-2 bg-black/25 backdrop-blur-md p-3 rounded-2xl text-center border border-white/10">
            <div>
              <span className="text-white/70 text-[10px] font-bold block">
                Percentage
              </span>
              <p className="font-black text-sm text-emerald-300">{percentage}%</p>
            </div>
            <div>
              <span className="text-white/70 text-[10px] font-bold block">
                Accuracy
              </span>
              <p className="font-black text-sm text-amber-300">{attempt.accuracy}%</p>
            </div>
            <div>
              <span className="text-white/70 text-[10px] font-bold block">
                Time Taken
              </span>
              <p className="font-black text-sm text-white">
                {formatTimer(attempt.time_taken_seconds)}
              </p>
            </div>
          </div>

          {/* Subtle Ambient Glow */}
          <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -left-6 -top-6 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
        </div>

        {/* 2. Leaderboard & XP Points Reward Banner */}
        {isPassed ? (
          <div className="game-card p-4 bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-teal-500/15 border-2 border-amber-300 dark:border-amber-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md border-b-2 border-amber-700 shrink-0">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>+{attempt.score} XP Points Earned!</span>
                  <span className="bg-amber-400/30 text-amber-700 dark:text-amber-300 text-[10px] px-1.5 py-0.2 rounded-md font-extrabold">
                    Ranked
                  </span>
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  Score ≥ 50% qualified for the Live Scoreboard
                </p>
              </div>
            </div>
            <Link
              href="/leaderboard"
              onClick={() => {
                playTapSound();
                triggerHaptic("medium");
              }}
              className="btn-3d btn-3d-amber px-3.5 py-2 rounded-xl text-xs font-black shrink-0 cursor-pointer shadow-sm"
            >
              Leaderboard
            </Link>
          </div>
        ) : (
          <div className="game-card p-4 bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center font-black shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                  Practice Mode Completed
                </p>
                <p className="text-[11px] text-rose-500 dark:text-rose-400 font-bold">
                  Score ≥ 50% needed for Leaderboard (You got {percentage}%)
                </p>
              </div>
            </div>
            <Link
              href="/leaderboard"
              onClick={() => {
                playTapSound();
                triggerHaptic("selection");
              }}
              className="btn-3d btn-3d-slate px-3.5 py-2 rounded-xl text-xs font-black shrink-0 cursor-pointer"
            >
              View Ranks
            </Link>
          </div>
        )}

        {/* 3. Detailed Attempt Breakdown & Action Buttons */}
        <div className="game-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Score Breakdown
            </h4>
            <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
              Total {total} Questions
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            {/* Correct */}
            <div className="bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-300 dark:border-emerald-800 border-b-4 border-b-emerald-600 p-3 rounded-2xl">
              <div className="text-emerald-700 dark:text-emerald-400 font-black text-xl leading-none">
                {attempt.correct_count}
              </div>
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-extrabold mt-1 block">
                Correct
              </span>
            </div>

            {/* Incorrect */}
            <div className="bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-300 dark:border-rose-800 border-b-4 border-b-rose-600 p-3 rounded-2xl">
              <div className="text-rose-700 dark:text-rose-400 font-black text-xl leading-none">
                {attempt.incorrect_count}
              </div>
              <span className="text-[11px] text-rose-800 dark:text-rose-300 font-extrabold mt-1 block">
                Incorrect
              </span>
            </div>

            {/* Skipped */}
            <div className="bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 border-b-4 border-b-slate-400 dark:border-b-slate-900 p-3 rounded-2xl">
              <div className="text-slate-700 dark:text-slate-300 font-black text-xl leading-none">
                {attempt.unanswered_count}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-extrabold mt-1 block">
                Skipped
              </span>
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            <Link
              href={`/exam/${attempt.test_item_id}`}
              onClick={() => {
                playTapSound();
                triggerHaptic("medium");
              }}
              className="btn-3d btn-3d-primary flex-1 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-primary-600/20 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reattempt Test</span>
            </Link>
            <Link
              href="/"
              onClick={() => {
                playTapSound();
                triggerHaptic("selection");
              }}
              className="btn-3d btn-3d-slate py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
          </div>
        </div>

        {/* 4. Question Solutions Review Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Solution Review & Notes 💡</span>
            </h3>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[10px] font-extrabold border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  playTapSound();
                  setLanguageMode("en");
                }}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  languageMode === "en"
                    ? "bg-primary-600 text-white shadow-2xs font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => {
                  playTapSound();
                  setLanguageMode("hi");
                }}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  languageMode === "hi"
                    ? "bg-primary-600 text-white shadow-2xs font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                HI
              </button>
              <button
                onClick={() => {
                  playTapSound();
                  setLanguageMode("both");
                }}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  languageMode === "both"
                    ? "bg-primary-600 text-white shadow-2xs font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Both
              </button>
            </div>
          </div>

          {/* Tactile Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-black">
            <button
              onClick={() => {
                playTapSound();
                setReviewFilter("all");
              }}
              className={`btn-3d px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                reviewFilter === "all"
                  ? "btn-3d-primary"
                  : "btn-3d-slate text-slate-600 dark:text-slate-400"
              }`}
            >
              All ({evaluatedReviews.length})
            </button>
            <button
              onClick={() => {
                playTapSound();
                setReviewFilter("correct");
              }}
              className={`btn-3d px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                reviewFilter === "correct"
                  ? "btn-3d-emerald text-white"
                  : "btn-3d-slate text-slate-600 dark:text-slate-400"
              }`}
            >
              Correct ({attempt.correct_count})
            </button>
            <button
              onClick={() => {
                playTapSound();
                setReviewFilter("incorrect");
              }}
              className={`btn-3d px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                reviewFilter === "incorrect"
                  ? "btn-3d-rose text-white"
                  : "btn-3d-slate text-slate-600 dark:text-slate-400"
              }`}
            >
              Incorrect ({attempt.incorrect_count})
            </button>
            <button
              onClick={() => {
                playTapSound();
                setReviewFilter("unattempted");
              }}
              className={`btn-3d px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                reviewFilter === "unattempted"
                  ? "bg-slate-700 text-white border-b-4 border-b-slate-900"
                  : "btn-3d-slate text-slate-600 dark:text-slate-400"
              }`}
            >
              Skipped ({attempt.unanswered_count})
            </button>
          </div>

          {/* Gamified Solution Cards */}
          <div className="space-y-3 pt-1">
            {filteredReviews.length === 0 ? (
              <div className="game-card p-6 text-center text-slate-500 text-xs">
                No questions found under this filter.
              </div>
            ) : (
              filteredReviews.map((q, idx) => {
                const options = (["A", "B", "C", "D"] as const).filter((k) =>
                  Boolean(
                    (q as any)[`option_${k.toLowerCase()}_en`]?.trim() ||
                      (q as any)[`option_${k.toLowerCase()}_hi`]?.trim()
                  )
                );

                return (
                  <div
                    key={q.id}
                    className="game-card p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
                        Question {idx + 1}
                      </span>
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1 border ${
                          q.is_correct
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                            : q.user_selected_option
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {q.is_correct ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Correct (+1)</span>
                          </>
                        ) : q.user_selected_option ? (
                          <>
                            <X className="w-3.5 h-3.5" />
                            <span>Incorrect</span>
                          </>
                        ) : (
                          <span>Skipped</span>
                        )}
                      </span>
                    </div>

                    {/* Question Text */}
                    <div className="space-y-1.5 text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                      {(languageMode === "en" || languageMode === "both") && (
                        <p>{q.question_en}</p>
                      )}
                      {languageMode === "both" && q.question_hi && (
                        <div className="border-t border-dashed border-slate-200 dark:border-slate-800 my-1" />
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
                          "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 border-b-2";
                        if (isCorrectAnswer) {
                          borderClass =
                            "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 font-bold text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30 border-b-4 border-b-emerald-700";
                        } else if (isUserChoice && !isCorrectAnswer) {
                          borderClass =
                            "border-rose-400 bg-rose-50/80 dark:bg-rose-950/60 font-semibold text-rose-900 dark:text-rose-200 border-b-4 border-b-rose-600";
                        }

                        return (
                          <div
                            key={key}
                            className={`p-3 rounded-2xl border text-sm flex items-start gap-3 transition-all ${borderClass}`}
                          >
                            <div
                              className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border-b-2 ${
                                isCorrectAnswer
                                  ? "bg-emerald-600 text-white border-emerald-800"
                                  : isUserChoice
                                  ? "bg-rose-600 text-white border-rose-800"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                              }`}
                            >
                              {key}
                            </div>
                            <div className="flex-1 space-y-1 min-w-0 pt-0.5">
                              {(languageMode === "en" || languageMode === "both") &&
                                optEn && (
                                  <div className="leading-relaxed font-bold">
                                    {optEn}
                                  </div>
                                )}
                              {(languageMode === "hi" || languageMode === "both") &&
                                optHi && (
                                  <div className="text-slate-700 dark:text-slate-300 font-medium font-sans leading-relaxed">
                                    {optHi}
                                  </div>
                                )}
                            </div>
                            {isCorrectAnswer && (
                              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-black shrink-0 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800">
                                Official Key ✓
                              </span>
                            )}
                            {isUserChoice && !isCorrectAnswer && (
                              <span className="text-[11px] text-rose-700 dark:text-rose-400 font-black shrink-0 bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded-lg border border-rose-300 dark:border-rose-800">
                                Your Choice ✗
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Section */}
                    {(q.explanation_en || q.explanation_hi) && (
                      <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 p-3.5 rounded-2xl text-xs sm:text-sm space-y-1.5">
                        <span className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Detailed Explanation</span>
                        </span>
                        {(languageMode === "en" || languageMode === "both") &&
                          q.explanation_en && (
                            <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
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
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

