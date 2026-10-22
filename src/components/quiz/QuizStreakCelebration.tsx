"use client";

import React, { useEffect, useState } from "react";
import { GuruMascot } from "@/components/gamified/GuruMascot";
import { Sparkles, Flame, Zap, Trophy, Star } from "lucide-react";
import type { LanguageMode } from "@/lib/language";

interface StreakMilestoneOverlayProps {
  milestone: number | null; // e.g. 5, 10, 15
  languageMode: LanguageMode;
  onDismiss: () => void;
}

/**
 * Duolingo-inspired Mascot Slide-Up Milestone Celebration Overlay.
 * Renders in a fixed overlay so question layout does not shift.
 * Character slides up from bottom with spring bounce, plays celebration, and dismisses smoothly.
 */
export function StreakMilestoneOverlay({
  milestone,
  languageMode,
  onDismiss,
}: StreakMilestoneOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!milestone) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    // Duration: 1.8s for 5, 2.3s for 10+
    const duration = milestone >= 10 ? 2300 : 1800;
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 200);
    }, duration);

    return () => clearTimeout(timer);
  }, [milestone, onDismiss]);

  if (!milestone || !isVisible) return null;

  const isEpic = milestone >= 10;
  const isHindi = languageMode === "hi";
  const isBilingual = languageMode === "bilingual";

  // Bilingual celebratory texts based on user requirements
  const titleEn = isEpic
    ? `UNSTOPPABLE! ${milestone} in a row!`
    : `Awesome! ${milestone} in a row!`;
  const titleHi = isEpic
    ? `कमाल! लगातार ${milestone} सही!`
    : `शानदार! लगातार ${milestone} सही!`;

  return (
    <div
      onClick={() => {
        setIsVisible(false);
        setTimeout(onDismiss, 150);
      }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-28 sm:pb-32 px-4 pointer-events-auto bg-black/40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
    >
      {/* Background Radial Celebration Glow */}
      <div
        className={`absolute w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isEpic
            ? "bg-amber-400/35 animate-golden-aura"
            : "bg-purple-500/30 animate-pulse"
        }`}
      />

      {/* Floating Sparkles & Stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-10 text-amber-300 animate-bounce">
          <Sparkles className="w-6 h-6 fill-current" />
        </div>
        <div className="absolute top-1/4 right-12 text-amber-300 animate-pulse delay-100">
          <Star className="w-7 h-7 fill-current" />
        </div>
        <div className="absolute top-1/2 left-1/4 text-purple-300 animate-ping delay-200">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="absolute top-1/3 right-1/4 text-emerald-300 animate-bounce delay-150">
          <Star className="w-5 h-5 fill-current" />
        </div>
      </div>

      {/* Mascot & Banner Container (Springs up from bottom of viewport) */}
      <div className="relative flex flex-col items-center text-center space-y-3 animate-spring-up cursor-pointer">
        {/* Animated Cartoon Character */}
        <div className="relative animate-mascot-bounce">
          <GuruMascot
            size={isEpic ? 136 : 112}
            pose={isEpic ? "epic" : "celebrate"}
            className="drop-shadow-2xl"
          />

          {/* Golden Crown Aura Tag */}
          <div
            className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg border ${
              isEpic
                ? "bg-amber-400 text-slate-950 border-amber-200 animate-bounce"
                : "bg-primary-600 text-white border-primary-300 animate-pop"
            }`}
          >
            {isEpic ? (
              <>
                <Trophy className="w-3.5 h-3.5 text-slate-950 fill-current" />
                <span>GODLIKE STREAK 🔥</span>
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 text-orange-200 fill-orange-200" />
                <span>HOT STREAK 🔥</span>
              </>
            )}
          </div>
        </div>

        {/* Milestone Celebration Banner */}
        <div
          className={`max-w-xs px-5 py-3.5 rounded-3xl border-2 shadow-2xl backdrop-blur-md animate-streak-pop space-y-1 ${
            isEpic
              ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 border-amber-200 border-b-4 border-b-amber-800"
              : "bg-gradient-to-r from-purple-600 via-primary-600 to-indigo-700 text-white border-primary-300 border-b-4 border-b-purple-950"
          }`}
        >
          {isBilingual ? (
            <>
              <h3 className="text-base font-black leading-tight tracking-tight">
                {titleEn}
              </h3>
              <p
                className={`text-xs font-bold font-sans ${
                  isEpic ? "text-slate-900" : "text-primary-100"
                }`}
              >
                {titleHi}
              </p>
            </>
          ) : isHindi ? (
            <h3 className="text-base font-black leading-tight font-sans">
              {titleHi}
            </h3>
          ) : (
            <h3 className="text-base font-black leading-tight tracking-tight">
              {titleEn}
            </h3>
          )}
        </div>

        <span className="text-[10px] text-white/70 font-semibold tracking-wide">
          Tap anywhere to continue
        </span>
      </div>
    </div>
  );
}

interface ProgressiveStreakBannerProps {
  streak: number;
  isCorrect: boolean;
  languageMode: LanguageMode;
}

/**
 * Compact Progressive Streak Badge displayed inside the Answer Feedback Sheet.
 * Provides instant motivation for 1, 2, 3, 4 consecutive correct answers,
 * and encouraging compassionate feedback for wrong answers.
 */
export function ProgressiveStreakBanner({
  streak,
  isCorrect,
  languageMode,
}: ProgressiveStreakBannerProps) {
  const isHindi = languageMode === "hi";
  const isBilingual = languageMode === "bilingual";

  if (!isCorrect) {
    // Incorrect answer encouragement: Compassionate, supportive Duolingo style
    const msgEn = "Almost! Keep going!";
    const msgHi = "कोई बात नहीं, फिर कोशिश करो!";

    return (
      <div className="flex items-center gap-2 bg-rose-200/80 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800/80 px-3 py-1.5 rounded-xl animate-in fade-in slide-in-from-bottom-1">
        <GuruMascot size={26} pose="encourage" className="shrink-0" />
        <span className="text-xs font-bold text-rose-900 dark:text-rose-200 leading-tight">
          {isBilingual ? `${msgEn} • ${msgHi}` : isHindi ? msgHi : msgEn}
        </span>
      </div>
    );
  }

  // 1st Correct Answer
  if (streak <= 1) {
    const msgEn = "Great!";
    const msgHi = "बहुत बढ़िया!";

    return (
      <div className="inline-flex items-center gap-1.5 bg-emerald-200/80 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 px-2.5 py-1 rounded-xl animate-pop">
        <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300 fill-current" />
        <span className="text-xs font-black text-emerald-900 dark:text-emerald-100">
          {isBilingual ? `${msgEn} / ${msgHi}` : isHindi ? msgHi : msgEn}
        </span>
      </div>
    );
  }

  // 2 to 4 Consecutive Correct Answers
  let titleEn = "Nice streak!";
  let titleHi = "शानदार लय!";
  let pose: "happy" | "celebrate" = "happy";

  if (streak === 2) {
    titleEn = "Nice streak! 2 in a row!";
    titleHi = "शानदार लय! लगातार 2 सही!";
    pose = "happy";
  } else if (streak === 3) {
    titleEn = "Hot streak! 3 in a row!";
    titleHi = "लगातार 3 सही!";
    pose = "happy";
  } else if (streak === 4) {
    titleEn = "On fire! 4 in a row!";
    titleHi = "धमाकेदार! लगातार 4 सही!";
    pose = "celebrate";
  } else {
    // 5+ streak ongoing
    titleEn = `${streak} in a row!`;
    titleHi = `लगातार ${streak} सही!`;
    pose = streak >= 10 ? "celebrate" : "happy";
  }

  return (
    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/15 via-amber-500/20 to-orange-500/15 dark:from-orange-500/25 dark:to-amber-500/25 border border-orange-400/50 dark:border-orange-500/60 px-3 py-1.5 rounded-xl animate-pop shadow-xs">
      <GuruMascot size={26} pose={pose} className="shrink-0" />
      <div className="flex items-center gap-1.5">
        <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-flame shrink-0" />
        <span className="text-xs font-black text-orange-950 dark:text-orange-200 tracking-tight">
          {isBilingual
            ? `${titleEn} • ${titleHi}`
            : isHindi
            ? titleHi
            : titleEn}
        </span>
      </div>
    </div>
  );
}
