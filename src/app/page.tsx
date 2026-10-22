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
  BookOpen,
  Layers,
  ChevronRight,
  Loader2,
  Zap,
  Star,
  Award,
  AlertCircle,
  HelpCircle,
  Crown,
  User as UserIcon,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useTelegram } from "@/components/providers/TelegramProvider";
import { GameButton } from "@/components/gamified/GameButton";
import { GameCard } from "@/components/gamified/GameCard";
import {
  StreakFlame,
  getPlayerLevel,
} from "@/components/gamified/GamifiedWidgets";
import { GuruMascot } from "@/components/gamified/GuruMascot";
import type { LeaderboardEntry } from "@/types/database";

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
    totalPoints?: number;
    preparationPercentage: number;
  };
  featuredSeries: any[];
  mockTests: any[];
  chapterTests: any[];
  recentResults: any[];
}

interface UserRankData {
  rank: number | null;
  points: number;
  display_name: string;
}

export default function HomePage() {
  const { session, triggerHaptic } = useTelegram();
  const [data, setData] = useState<DashboardData | null>(null);
  const [userRank, setUserRank] = useState<UserRankData | null>(null);
  const [topPerformers, setTopPerformers] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHomeData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dashRes, lbRes] = await Promise.all([
        fetch("/api/mini-app/dashboard"),
        fetch("/api/leaderboard?period=daily&limit=10").catch(() => null),
      ]);

      if (!dashRes.ok) throw new Error("Failed to load dashboard data");
      const dashJson = await dashRes.json();
      setData(dashJson);

      if (typeof window !== "undefined") {
        if (dashJson?.stats?.dayStreak !== undefined) {
          try {
            localStorage.setItem("ccc_day_streak", String(dashJson.stats.dayStreak));
          } catch {}
        }
        if (dashJson?.stats?.totalPoints !== undefined) {
          try {
            localStorage.setItem("ccc_total_points", String(dashJson.stats.totalPoints));
          } catch {}
        }
      }

      if (lbRes && lbRes.ok) {
        const lbJson = await lbRes.json();
        if (lbJson.leaderboard) {
          setTopPerformers(lbJson.leaderboard);
        }
        if (lbJson.userRank) {
          setUserRank(lbJson.userRank);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const studentName = session?.name || data?.student?.name || "Student";
  const testsTaken = data?.stats?.testsTaken ?? 0;
  const questionsSolved = data?.stats?.totalQuestionsSolved ?? 0;
  const accuracy = data?.stats?.avgAccuracy ?? 0;
  const streak = data?.stats?.dayStreak ?? 1;

  // Real player points: unified from verified ledger and evaluated attempts
  const totalPoints =
    data?.stats?.totalPoints ??
    (userRank?.points !== undefined && userRank.points > 0 ? userRank.points : 0);

  const playerLevel = getPlayerLevel(totalPoints, questionsSolved, accuracy);

  // Default mock test
  const defaultMock = data?.mockTests?.[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col selection:bg-purple-500 selection:text-white">
      {/* A. Header */}
      <Header streak={streak} points={totalPoints} />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3.5 pb-12 space-y-4">
        {/* B. Welcome Section (Compact, Above the fold) */}
        <section className="bg-white dark:bg-[#121626] border-2 border-slate-200 dark:border-slate-800 border-b-[4px] border-b-slate-300 dark:border-b-slate-900 rounded-3xl p-4 shadow-2xs flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/80 px-2 py-0.5 rounded-md border border-primary-200 dark:border-primary-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              {playerLevel.title}
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">
              Namaste, {studentName}! 👋
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Ready for today&apos;s challenge?
            </p>
          </div>

          <div className="shrink-0 p-1 bg-purple-50 dark:bg-purple-950/60 rounded-2xl border border-purple-200 dark:border-purple-800/60 shadow-inner">
            <GuruMascot size={52} />
          </div>
        </section>

        {/* C. Gamification Stats (3 Compact Cards Row) */}
        <section className="grid grid-cols-3 gap-2.5">
          {/* 1. Daily Streak */}
          <div className="game-card p-3 text-center flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-1 border border-orange-200 dark:border-orange-800">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-flame" />
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white leading-none">
              {streak} Days
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-1">
              Streak
            </div>
          </div>

          {/* 2. Total Points */}
          <div className="game-card p-3 text-center flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1 border border-amber-200 dark:border-amber-800">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white leading-none">
              {totalPoints}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-1">
              Points
            </div>
          </div>

          {/* 3. Tests Taken */}
          <Link
            href="/tests"
            onClick={() => triggerHaptic("selection")}
            className="game-card p-3 text-center flex flex-col items-center justify-center hover:border-primary-400 dark:hover:border-primary-600 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-950/80 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-1 border border-primary-200 dark:border-primary-800 group-hover:scale-105 transition-transform">
              <Target className="w-4 h-4" />
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white leading-none">
              {testsTaken}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-1">
              Tests Taken
            </div>
          </Link>
        </section>

        {/* Error State if fetch failed */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800 p-3.5 rounded-2xl text-center space-y-2">
            <p className="text-xs text-rose-700 dark:text-rose-400 font-bold">
              {error}
            </p>
            <button
              onClick={fetchHomeData}
              className="btn-3d-rose px-3.5 py-1.5 rounded-xl text-xs font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* E. Study & Practice Modules (2x2 Grid) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              Study & Practice
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              4 Modules
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* 1. Full Mock Test Card */}
            <Link
              href="/tests"
              onClick={() => triggerHaptic("medium")}
              className="game-card p-3.5 flex flex-col justify-between group active:scale-[0.98] transition-transform space-y-3"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center border-2 border-blue-200 dark:border-blue-800 shadow-2xs group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight group-hover:text-primary-600 transition-colors">
                    Full Mock Test
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium line-clamp-1">
                    {defaultMock?.question_count || 100} Qs • {defaultMock?.duration || 90}m timed
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] font-black text-blue-600 dark:text-blue-400">
                <span>Start Test</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* 2. Chapter-wise Tests Card */}
            <Link
              href="/chapters"
              onClick={() => triggerHaptic("medium")}
              className="game-card p-3.5 flex flex-col justify-between group active:scale-[0.98] transition-transform space-y-3"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border-2 border-emerald-200 dark:border-emerald-800 shadow-2xs group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight group-hover:text-emerald-600 transition-colors">
                    Chapter Tests
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium line-clamp-1">
                    10 Syllabus Chapters
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                <span>Explore Map</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* 3. Speed Quiz Card */}
            <Link
              href="/quiz"
              onClick={() => triggerHaptic("medium")}
              className="game-card p-3.5 flex flex-col justify-between group active:scale-[0.98] transition-transform space-y-3"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center border-2 border-amber-200 dark:border-amber-800 shadow-2xs group-hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight group-hover:text-amber-600 transition-colors">
                    Speed Quiz
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium line-clamp-1">
                    Instant scoring & Points
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] font-black text-amber-600 dark:text-amber-400">
                <span>Start Quiz</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* 4. Leaderboard Card */}
            <Link
              href="/leaderboard"
              onClick={() => triggerHaptic("medium")}
              className="game-card p-3.5 flex flex-col justify-between group active:scale-[0.98] transition-transform space-y-3"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center border-2 border-purple-200 dark:border-purple-800 shadow-2xs group-hover:scale-105 transition-transform">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight group-hover:text-purple-600 transition-colors">
                    Leaderboard
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium line-clamp-1">
                    {userRank?.rank ? `Your Rank #${userRank.rank}` : "National Student Ranks"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] font-black text-purple-600 dark:text-purple-400">
                <span>View Ranks</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </section>

        {/* F. Daily Challenge (Conditional: Live Speed Quiz Sprint) */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white p-3.5 shadow-sm border-2 border-emerald-400/50 border-b-[5px] border-b-emerald-800">
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="space-y-1 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
                Daily Challenge
              </span>
              <h4 className="text-xs font-black truncate">
                Daily Practice Quiz
              </h4>
              <p className="text-[10px] text-emerald-100 line-clamp-1 font-medium">
                Instant answer keys, streak boosts & live scoring.
              </p>
            </div>

            <Link
              href="/quiz"
              onClick={() => triggerHaptic("medium")}
              className="btn-3d-amber px-3.5 py-1.5 rounded-xl text-xs font-black shrink-0 flex items-center gap-1 shadow-md"
            >
              <span>Play</span>
              <Play className="w-3 h-3 fill-current" />
            </Link>
          </div>
        </section>

        {/* G. Top 10 Performers Leaderboard Section */}
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-500 flex items-center justify-center">
                <Trophy className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Top 10 Performers 🏆
              </h3>
            </div>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Live Today
            </span>
          </div>

          {isLoading && topPerformers.length === 0 ? (
            <div className="game-card p-6 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Loading top performers...</p>
            </div>
          ) : topPerformers.length === 0 ? (
            <div className="game-card p-6 text-center space-y-2">
              <Trophy className="w-8 h-8 text-amber-500 mx-auto opacity-70" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Be Today&apos;s #1 Scholar!
              </h4>
              <p className="text-[11px] text-slate-400">
                Take a test or speed quiz to earn points and appear on the leaderboard.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Top 3 Podium Cards */}
              <div className="grid grid-cols-3 gap-2 items-end pt-2 pb-1">
                {[
                  topPerformers.find((p) => p.rank === 2),
                  topPerformers.find((p) => p.rank === 1),
                  topPerformers.find((p) => p.rank === 3),
                ]
                  .filter((p): p is LeaderboardEntry => Boolean(p))
                  .map((entry) => {
                    const isFirst = entry.rank === 1;
                    const isSecond = entry.rank === 2;
                    const isThird = entry.rank === 3;
                    const medalEmoji = isFirst ? "🥇" : isSecond ? "🥈" : "🥉";

                    return (
                      <div
                        key={`${entry.canonical_user_id}-${entry.rank}`}
                        className={`relative rounded-2xl p-2.5 text-center flex flex-col items-center justify-between border-2 border-b-4 transition-all ${
                          isFirst
                            ? "bg-gradient-to-b from-amber-400/20 via-amber-300/10 to-transparent border-amber-400 dark:border-amber-500 border-b-amber-600 shadow-md min-h-[145px] z-10"
                            : isSecond
                            ? "bg-gradient-to-b from-slate-300/20 via-slate-200/10 to-transparent border-slate-300 dark:border-slate-600 border-b-slate-500 min-h-[132px]"
                            : "bg-gradient-to-b from-orange-400/20 via-orange-300/10 to-transparent border-orange-300 dark:border-orange-600 border-b-orange-500 min-h-[125px]"
                        }`}
                      >
                        {isFirst && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-full flex items-center justify-center text-slate-950 shadow-sm border border-amber-200">
                            <Crown className="w-3.5 h-3.5 fill-current" />
                          </div>
                        )}

                        <div className="relative mt-1">
                          <div
                            className={`rounded-full overflow-hidden flex items-center justify-center bg-slate-200 dark:bg-slate-700 ${
                              isFirst
                                ? "w-11 h-11 ring-3 ring-amber-400 shadow-sm"
                                : isSecond
                                ? "w-9 h-9 ring-2 ring-slate-300 dark:ring-slate-500"
                                : "w-9 h-9 ring-2 ring-orange-400"
                            }`}
                          >
                            {entry.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={entry.avatar_url}
                                alt={entry.display_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UserIcon
                                className={`text-slate-500 ${
                                  isFirst ? "w-5 h-5" : "w-4 h-4"
                                }`}
                              />
                            )}
                          </div>
                          <span className="absolute -bottom-1 -right-1 text-xs leading-none">
                            {medalEmoji}
                          </span>
                        </div>

                        <div className="w-full mt-1.5 space-y-0.5">
                          <p className="text-[11px] font-black text-slate-900 dark:text-white truncate px-0.5">
                            {entry.display_name}
                          </p>
                          <div
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black ${
                              isFirst
                                ? "bg-amber-400 text-slate-950"
                                : isSecond
                                ? "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                                : "bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-200"
                            }`}
                          >
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>{entry.points} pts</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Ranks 4 to 10 Rows */}
              {topPerformers
                .filter((p) => p.rank > 3)
                .slice(0, 7)
                .map((entry) => (
                  <div
                    key={`${entry.canonical_user_id}-${entry.rank}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#121626] border border-slate-200 dark:border-slate-800 border-b-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 text-center font-black text-xs text-slate-400">
                        #{entry.rank}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700">
                        {entry.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={entry.avatar_url}
                            alt={entry.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {entry.display_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 text-[11px] font-black text-amber-700 dark:text-amber-300 bg-amber-400/15 border border-amber-400/25 px-2 py-0.5 rounded-lg">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{entry.points} pts</span>
                    </div>
                  </div>
                ))}

              {/* View Full Leaderboard Button */}
              <div className="pt-2">
                <Link
                  href="/leaderboard"
                  onClick={() => triggerHaptic("medium")}
                  className="btn-3d-primary w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md uppercase tracking-wider"
                >
                  <Trophy className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>View Full Leaderboard</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
