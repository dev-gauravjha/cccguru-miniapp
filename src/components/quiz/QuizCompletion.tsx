"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Flame,
  Award,
  Zap,
} from "lucide-react";
import { ConfettiEffects } from "@/components/quiz/ConfettiEffects";
import { useTelegram } from "@/components/providers/TelegramProvider";
import { playFinishSound } from "@/lib/quiz-sounds";

interface QuizCompletionProps {
  score: number;
  totalQuestions: number;
  accuracy: number;
  isPassed: boolean;
  pointsAwarded: number;
  bestStreak: number;
  title: string;
  onPlayAgain: () => void;
}

export function QuizCompletion({
  score,
  totalQuestions,
  accuracy,
  isPassed,
  pointsAwarded,
  bestStreak,
  title,
  onPlayAgain,
}: QuizCompletionProps) {
  const { triggerHaptic } = useTelegram();
  const [showConfetti, setShowConfetti] = useState(isPassed);

  useEffect(() => {
    if (isPassed) {
      triggerHaptic("success");
      playFinishSound();
      setShowConfetti(true);
    }
  }, [isPassed, triggerHaptic]);


  const incorrectCount = Math.max(0, totalQuestions - score);

  return (
    <div className="min-h-[85vh] flex flex-col justify-between py-6 px-4 animate-in fade-in duration-300">
      <ConfettiEffects active={showConfetti} count={35} />

      {/* Top Victory Celebration */}
      <div className="text-center space-y-4 pt-2">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/30 mx-auto animate-pop">
            <Trophy className="w-13 h-13 drop-shadow-md" />
          </div>
          {isPassed && (
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-md">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          )}
        </div>

        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-950/60 px-3 py-1 rounded-full">
            {title}
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {accuracy >= 80
              ? "Outstanding Performance! 🌟"
              : accuracy >= 50
              ? "Quiz Completed! 🎉"
              : "Good Effort! Keep Practicing 💪"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            {isPassed
              ? "You achieved the CCC passing standard (≥ 50%) and earned leaderboard points!"
              : "NIELIT CCC exam requires 50%+ passing marks to earn leaderboard points."}
          </p>
        </div>

        {/* Passing / Leaderboard Status Banner */}
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold text-center flex items-center justify-center gap-2 max-w-sm mx-auto shadow-sm ${
            isPassed
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200"
              : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200"
          }`}
        >
          {isPassed ? (
            <>
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>+{pointsAwarded} Leaderboard Points Awarded!</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Score &lt; 50%: 0 pts awarded. Score 50%+ to rank!</span>
            </>
          )}
        </div>
      </div>

      {/* 4 Duolingo-Style Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-3 my-6 max-w-sm mx-auto w-full">
        {/* Score */}
        <div className="bg-white dark:bg-[#121626] border-2 border-slate-200 dark:border-slate-800 border-b-4 rounded-2xl p-4 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Final Score
          </span>
          <div className="flex items-center justify-center gap-1.5 mt-1 font-black text-xl text-primary-600 dark:text-primary-400">
            <span>{score}</span>
            <span className="text-xs text-slate-400">/ {totalQuestions}</span>
          </div>
        </div>

        {/* Accuracy */}
        <div className="bg-white dark:bg-[#121626] border-2 border-slate-200 dark:border-slate-800 border-b-4 rounded-2xl p-4 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Accuracy
          </span>
          <p
            className={`font-black text-xl mt-1 ${
              accuracy >= 50
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {accuracy}%
          </p>
        </div>

        {/* Streak */}
        <div className="bg-white dark:bg-[#121626] border-2 border-slate-200 dark:border-slate-800 border-b-4 rounded-2xl p-4 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Max Streak
          </span>
          <div className="flex items-center justify-center gap-1 font-black text-xl text-orange-500 mt-1">
            <Flame className="w-5 h-5 fill-current animate-flame" />
            <span>{bestStreak}</span>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white dark:bg-[#121626] border-2 border-slate-200 dark:border-slate-800 border-b-4 rounded-2xl p-4 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Exam Status
          </span>
          <p
            className={`font-black text-base mt-1 ${
              isPassed
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {isPassed ? "PASSED ✅" : "FAILED ❌"}
          </p>
        </div>
      </div>

      {/* Action Buttons (Duolingo 3D Style) */}
      <div className="space-y-3 max-w-sm mx-auto w-full pt-2">
        <button
          onClick={onPlayAgain}
          className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wider border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Play Again</span>
        </button>

        <Link
          href="/leaderboard"
          className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-extrabold text-sm border-b-4 border-slate-950 dark:border-slate-900 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>View Leaderboard</span>
        </Link>

        <Link
          href="/quiz"
          className="w-full py-2.5 text-center text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors block"
        >
          Back to Quiz Hub
        </Link>
      </div>
    </div>
  );
}
