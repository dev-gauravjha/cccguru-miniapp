"use client";

import React from "react";
import { Flame, Sparkles, Star, Trophy, Shield, Zap, Target } from "lucide-react";

/**
 * Animated Fire Streak Badge
 */
export function StreakFlame({
  streak = 1,
  showLabel = true,
  size = "md",
  className = "",
}: {
  streak?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeMap = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2",
  };

  const iconSizeMap = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div
      className={`inline-flex items-center font-black rounded-full bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-400/30 shadow-xs ${
        sizeMap[size]
      } ${className}`}
      title={`${streak}-day learning streak!`}
    >
      <Flame className={`${iconSizeMap[size]} text-orange-500 fill-orange-500 animate-flame shrink-0`} />
      <span className="tracking-tight">{streak}d</span>
      {showLabel && <span className="text-[10px] uppercase font-bold text-orange-500/80">Streak</span>}
    </div>
  );
}

/**
 * Points & Level Badge (Replaces XP)
 */
export function PointsPill({
  points,
  xp,
  level,
  variant = "points",
}: {
  points?: number;
  xp?: number;
  level?: number;
  variant?: "points" | "xp" | "level";
}) {
  if (variant === "level") {
    return (
      <div className="inline-flex items-center gap-1 bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-300 px-2.5 py-0.5 rounded-full text-xs font-black shadow-2xs">
        <Sparkles className="w-3.5 h-3.5 fill-current text-purple-500" />
        <span>LVL {level || 1}</span>
      </div>
    );
  }

  const displayPoints = points ?? xp ?? 0;

  return (
    <div className="inline-flex items-center gap-1 bg-amber-400/20 border border-amber-400/40 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full text-xs font-black shadow-2xs">
      <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
      <span>{displayPoints} pts</span>
    </div>
  );
}

// Backward-compatibility alias
export const XpPill = PointsPill;

/**
 * Duolingo-Style Progress Bar with Shimmer
 */
export function GameProgressBar({
  progress = 0,
  color = "emerald",
  height = "md",
  showLabel = false,
  label = "Progress",
}: {
  progress: number;
  color?: "emerald" | "amber" | "purple" | "blue";
  height?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
}) {
  const clamped = Math.min(100, Math.max(0, progress));

  const heightClasses = {
    sm: "h-2",
    md: "h-3.5",
    lg: "h-5",
  };

  const bgColors = {
    emerald: "bg-emerald-500 border-b-2 border-emerald-700",
    amber: "bg-amber-400 border-b-2 border-amber-600",
    purple: "bg-purple-600 border-b-2 border-purple-800",
    blue: "bg-sky-500 border-b-2 border-sky-700",
  };

  return (
    <div className="w-full space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>{label}</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        className={`w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-300/80 dark:border-slate-700/80 shadow-inner ${heightClasses[height]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 relative overflow-hidden ${bgColors[color]}`}
          style={{ width: `${clamped}%` }}
        >
          {/* Top highlight line for 3D feel */}
          <div className="absolute inset-x-0 top-0 h-1 bg-white/40 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Educational Achievement Badge (for Leaderboard)
 */
export function LeagueBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full text-[10px] shadow-sm uppercase tracking-wider">
        <Trophy className="w-3 h-3 fill-current" />
        <span>Top Scholar #1</span>
      </div>
    );
  }
  if (rank <= 3) {
    return (
      <div className="inline-flex items-center gap-1 bg-gradient-to-r from-slate-200 to-slate-400 text-slate-900 font-black px-2 py-0.5 rounded-full text-[10px] shadow-xs uppercase">
        <Trophy className="w-3 h-3 fill-current" />
        <span>Top 3 Scholar</span>
      </div>
    );
  }
  if (rank <= 10) {
    return (
      <div className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase">
        <Star className="w-3 h-3 fill-current" />
        <span>Top 10 Scholar</span>
      </div>
    );
  }
  if (rank <= 25) {
    return (
      <div className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase">
        <Star className="w-3 h-3" />
        <span>Honor Roll</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold px-2 py-0.5 rounded-full text-[10px] uppercase">
      <span>Active Learner</span>
    </div>
  );
}

/**
 * Helper to compute player level from points (or tests/questions)
 */
export function getPlayerLevel(
  pointsOrTests: number = 0,
  totalQuestions: number = 0,
  avgAccuracy: number = 0
) {
  let points = pointsOrTests;
  // If legacy 3-parameter call was made and pointsOrTests is small relative to questions
  if (totalQuestions > 0 && pointsOrTests < totalQuestions) {
    points = pointsOrTests * 10 + Math.floor(totalQuestions * 0.5) + avgAccuracy;
  }

  if (points >= 500)
    return { level: 5, title: "CCC Grandmaster 👑", nextThreshold: 1000, points, xp: points };
  if (points >= 300)
    return { level: 4, title: "CCC Scholar ⚡", nextThreshold: 500, points, xp: points };
  if (points >= 150)
    return { level: 3, title: "CCC Specialist 🛡️", nextThreshold: 300, points, xp: points };
  if (points >= 50)
    return { level: 2, title: "CCC Apprentice 🚀", nextThreshold: 150, points, xp: points };
  return { level: 1, title: "CCC Cadet 🎯", nextThreshold: 50, points, xp: points };
}
