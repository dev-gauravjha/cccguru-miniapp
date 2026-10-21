"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Trophy,
  Clock,
  RotateCcw,
  Sparkles,
  User as UserIcon,
  AlertCircle,
  Loader2,
  Crown,
  Medal,
  Shield,
  Star,
} from "lucide-react";
import type { LeaderboardEntry, UserLeaderboardRank } from "@/types/database";
import { LeagueBadge } from "@/components/gamified/GamifiedWidgets";

type PeriodType = "daily" | "monthly" | "all_time";

const PAGE_SIZE = 15;

interface LeaderboardViewProps {
  isWebsiteViewOnly?: boolean;
}

export function LeaderboardView({ isWebsiteViewOnly = false }: LeaderboardViewProps) {
  const [period, setPeriod] = useState<PeriodType>("daily");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserLeaderboardRank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  // 1. Initial / Period change fetch (15 items)
  const fetchInitialLeaderboard = useCallback(
    async (targetPeriod: PeriodType, showRefreshingState = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (showRefreshingState) setIsRefreshing(true);
      else setIsLoading(true);

      setError(null);
      setLoadMoreError(null);

      try {
        const res = await fetch(
          `/api/leaderboard?period=${targetPeriod}&limit=${PAGE_SIZE}&offset=0`
        );
        if (!res.ok) throw new Error("Failed to load leaderboard rankings");

        const json = await res.json();
        const items: LeaderboardEntry[] = json.leaderboard || [];

        setLeaderboard(items);
        setUserRank(json.userRank || null);
        setHasMore(json.hasMore ?? (items.length === PAGE_SIZE));
      } catch (err: any) {
        setError(err.message || "Failed to load rankings");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    []
  );

  // 2. Fetch Next Batch of 15 records on scroll
  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore || isLoading || isLoadingMore) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(null);

    const currentOffset = leaderboard.length;

    try {
      const res = await fetch(
        `/api/leaderboard?period=${period}&limit=${PAGE_SIZE}&offset=${currentOffset}`
      );
      if (!res.ok) throw new Error("Failed to load more rankings");

      const json = await res.json();
      const newItems: LeaderboardEntry[] = json.leaderboard || [];

      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setLeaderboard((prev) => {
          const existingIds = new Set(prev.map((e) => e.canonical_user_id));
          const uniqueNewItems = newItems.filter(
            (item) => !existingIds.has(item.canonical_user_id)
          );
          return [...prev, ...uniqueNewItems];
        });

        // Determine if more items remain
        if (newItems.length < PAGE_SIZE || json.hasMore === false) {
          setHasMore(false);
        }
      }
    } catch (err: any) {
      setLoadMoreError("Could not load more rankings. Tap to retry.");
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [hasMore, isLoading, isLoadingMore, leaderboard.length, period]);

  // Initial load or period change
  useEffect(() => {
    setLeaderboard([]);
    setHasMore(true);
    fetchInitialLeaderboard(period);
  }, [fetchInitialLeaderboard, period]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingRef.current) {
          loadMore();
        }
      },
      { rootMargin: "250px" } // Pre-fetch 250px before reaching bottom
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, loadMore]);

  const handlePeriodChange = (newPeriod: PeriodType) => {
    if (newPeriod === period || isLoading) return;
    setPeriod(newPeriod);
  };

  // Determine whether current user exists in the currently loaded leaderboard
  const isCurrentUserInList = Boolean(
    userRank?.canonical_user_id &&
      leaderboard.some(
        (entry) => entry.canonical_user_id === userRank.canonical_user_id
      )
  );

  // Show sticky card ONLY when the current user is NOT in the loaded leaderboard list
  const showStickyRankCard =
    !isWebsiteViewOnly && Boolean(userRank) && !isCurrentUserInList;

  const topThree = leaderboard.slice(0, 3);
  const remainingRanks = leaderboard.slice(3);

  // Reorder for podium presentation: [2nd, 1st, 3rd]
  const podiumOrder =
    topThree.length >= 3
      ? [topThree[1], topThree[0], topThree[2]]
      : topThree.length === 2
      ? [topThree[1], topThree[0]]
      : topThree;

  return (
    <div
      className={`w-full max-w-md mx-auto space-y-4 transition-all duration-300 ${
        showStickyRankCard ? "pb-36" : "pb-24"
      }`}
    >
      {/* 3D Tactile Period Selection Tabs */}
      <div className="bg-slate-200/90 dark:bg-slate-800/90 p-1.5 rounded-2xl flex items-center justify-between text-xs font-black shadow-inner border border-slate-300/80 dark:border-slate-700/80">
        {(
          [
            { id: "daily", label: "Daily Sprint ☀️" },
            { id: "monthly", label: "Monthly Cup 📅" },
            { id: "all_time", label: "All Time 👑" },
          ] as const
        ).map((tab) => {
          const isActive = period === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handlePeriodChange(tab.id)}
              className={`flex-1 py-2 rounded-xl transition-all font-black text-xs cursor-pointer ${
                isActive
                  ? "bg-white dark:bg-[#121626] text-primary-600 dark:text-primary-400 shadow-md border-b-2 border-primary-500 scale-[1.02]"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Timezone & Refresh Header */}
      <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1 font-semibold">
          <Clock className="w-3.5 h-3.5 text-primary-500" />
          Resets at 00:00 IST (Asia/Kolkata)
        </span>
        <button
          onClick={() => fetchInitialLeaderboard(period, true)}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-1 font-black text-primary-600 dark:text-primary-400 hover:opacity-80 active:scale-95 transition-all cursor-pointer"
        >
          <RotateCcw
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4 py-16 text-center">
          <Loader2 className="w-9 h-9 animate-spin text-primary-600 mx-auto" />
          <p className="text-xs text-slate-500 font-bold">
            Synchronizing student scoreboard for{" "}
            {period === "daily"
              ? "today"
              : period === "monthly"
              ? "this month"
              : "all time"}
            ...
          </p>
        </div>
      ) : error ? (
        /* Error State */
        <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 p-6 rounded-3xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
            {error}
          </p>
          <button
            onClick={() => fetchInitialLeaderboard(period)}
            className="btn-3d-rose px-4 py-1.5 rounded-xl text-xs font-bold"
          >
            Try Again
          </button>
        </div>
      ) : leaderboard.length === 0 ? (
        /* Empty State */
        <div className="game-card p-8 text-center space-y-3">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 rounded-3xl flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto border-2 border-amber-300 dark:border-amber-700">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
            No Test Scores Yet Today
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            {period === "daily"
              ? "Be the first student in India to finish a practice test today and claim the #1 Top Scholar spot!"
              : period === "monthly"
              ? "Be the first to score points this month and lead the student rankings!"
              : "All-time scoreboard is ready. Earn points by passing CCC practice tests!"}
          </p>
        </div>
      ) : (
        /* Leaderboard Content */
        <div className="space-y-4">
          {/* Top 3 Duolingo / Clash Royale Podium */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-4 items-end">
              {podiumOrder.map((entry) => {
                const isFirst = entry.rank === 1;
                const isSecond = entry.rank === 2;
                const isThird = entry.rank === 3;
                const isCurrentUser =
                  userRank?.canonical_user_id === entry.canonical_user_id;

                return (
                  <div
                    key={entry.canonical_user_id}
                    className={`relative rounded-3xl p-3 text-center flex flex-col items-center justify-between transition-all border-2 border-b-[6px] ${
                      isFirst
                        ? "bg-gradient-to-b from-amber-500/25 via-amber-400/10 to-transparent border-amber-400 dark:border-amber-500 border-b-amber-600 shadow-xl shadow-amber-500/20 min-h-[195px] z-10"
                        : isSecond
                        ? "bg-gradient-to-b from-slate-300/25 via-slate-200/10 to-transparent border-slate-300 dark:border-slate-600 border-b-slate-500 min-h-[170px]"
                        : "bg-gradient-to-b from-orange-500/25 via-orange-400/10 to-transparent border-orange-300 dark:border-orange-700 border-b-orange-600 min-h-[158px]"
                    } ${
                      isCurrentUser
                        ? "ring-2 ring-primary-500 shadow-md shadow-primary-500/30"
                        : ""
                    }`}
                  >
                    {/* Golden Crown for 1st place with glow */}
                    {isFirst && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-tr from-amber-400 to-yellow-400 rounded-full flex items-center justify-center text-slate-950 shadow-md animate-crown border border-amber-300">
                        <Crown className="w-5 h-5 fill-current" />
                      </div>
                    )}

                    {/* Avatar with Podium Ring */}
                    <div className="relative mt-2">
                      <div
                        className={`rounded-full overflow-hidden flex items-center justify-center bg-slate-200 dark:bg-slate-700 ${
                          isFirst
                            ? "w-14 h-14 ring-4 ring-amber-400/70 shadow-md"
                            : isSecond
                            ? "w-11 h-11 ring-3 ring-slate-300 dark:ring-slate-500"
                            : "w-11 h-11 ring-3 ring-orange-400/70"
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
                              isFirst ? "w-7 h-7" : "w-5 h-5"
                            }`}
                          />
                        )}
                      </div>

                      {/* Rank Medal Badge */}
                      <span
                        className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-sm border border-white dark:border-slate-900 ${
                          isFirst
                            ? "bg-amber-500"
                            : isSecond
                            ? "bg-slate-500"
                            : "bg-orange-600"
                        }`}
                      >
                        {entry.rank}
                      </span>
                    </div>

                    {/* Name & Points */}
                    <div className="w-full mt-2 space-y-1">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate px-1 flex items-center justify-center gap-1">
                        <span className="truncate">{entry.display_name}</span>
                        {isCurrentUser && (
                          <span className="text-[9px] bg-primary-600 text-white font-black px-1 rounded shrink-0">
                            You
                          </span>
                        )}
                      </p>

                      <div
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black shadow-xs ${
                          isFirst
                            ? "bg-amber-400 text-slate-950"
                            : isSecond
                            ? "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                            : "bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-200"
                        }`}
                      >
                        <Sparkles className="w-3 h-3 fill-current" />
                        <span>{entry.points} pts</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Remaining Ranks (4+) with League Badges */}
          {remainingRanks.length > 0 && (
            <div className="space-y-2 pt-1">
              {remainingRanks.map((entry) => {
                const isCurrentUser =
                  userRank?.canonical_user_id === entry.canonical_user_id;

                return (
                  <div
                    key={entry.canonical_user_id}
                    className={`flex items-center justify-between p-3 rounded-2xl border-2 border-b-4 transition-all ${
                      isCurrentUser
                        ? "bg-primary-50 dark:bg-primary-950/50 border-primary-500 dark:border-primary-500 border-b-primary-700 shadow-md"
                        : "bg-white dark:bg-[#121626] border-slate-200 dark:border-slate-800 border-b-slate-300 dark:border-b-slate-900 hover:border-primary-400"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Rank Number */}
                      <span
                        className={`w-7 text-center font-black text-xs ${
                          isCurrentUser
                            ? "text-primary-600 dark:text-primary-400 font-black"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        #{entry.rank}
                      </span>

                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700">
                        {entry.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={entry.avatar_url}
                            alt={entry.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon className="w-4 h-4 text-slate-500" />
                        )}
                      </div>

                      {/* Name & League Badge */}
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                          <span className="truncate">{entry.display_name}</span>
                          {isCurrentUser && (
                            <span className="text-[9px] bg-primary-600 text-white font-black px-1.5 py-0.2 rounded-full shrink-0">
                              You
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <LeagueBadge rank={entry.rank} />
                          <span className="text-[10px] text-slate-400 font-medium">
                            • {entry.tests_completed} test{entry.tests_completed === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Points Pill */}
                    <div
                      className={`flex items-center gap-1 shrink-0 font-black text-xs px-2.5 py-1 rounded-xl shadow-2xs ${
                        isCurrentUser
                          ? "bg-primary-600 text-white border-b-2 border-primary-800"
                          : "text-amber-700 dark:text-amber-300 bg-amber-400/20 border border-amber-400/30"
                      }`}
                    >
                      <Star className="w-3 h-3 fill-current text-amber-500" />
                      <span>{entry.points} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sentinel for Infinite Scroll Trigger */}
          <div ref={sentinelRef} className="h-4 w-full" />

          {/* Infinite Scroll Loading Spinner */}
          {isLoadingMore && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs font-black text-primary-600 dark:text-primary-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading next rankings...</span>
            </div>
          )}

          {/* Load More Error / Retry */}
          {loadMoreError && (
            <div className="text-center py-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl p-3 border-2 border-rose-300 dark:border-rose-900">
              <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mb-1.5">
                {loadMoreError}
              </p>
              <button
                onClick={() => loadMore()}
                className="btn-3d-rose px-3 py-1 rounded-xl text-xs font-bold"
              >
                Retry
              </button>
            </div>
          )}

          {/* End of list reached */}
          {!hasMore && leaderboard.length > 0 && !isLoading && (
            <div className="text-center py-4 text-[11px] text-slate-400 dark:text-slate-500 font-bold border-t border-slate-200 dark:border-slate-800 mt-4">
              ✨ All {leaderboard.length} ranked learners loaded for this period
            </div>
          )}
        </div>
      )}

      {/* Sticky Bottom: My Rank Card (ONLY SHOWN IF USER IS ABSENT FROM LOADED ENTRIES) */}
      {showStickyRankCard && userRank && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 px-4 pointer-events-none transition-all duration-300">
          <div className="max-w-md mx-auto pointer-events-auto bg-slate-900/95 dark:bg-[#0c1020]/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border-2 border-primary-500/60 border-b-4 border-b-primary-700 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-3 min-w-0">
              {/* User Avatar with Rank badge */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-slate-800 ring-2 ring-primary-500 overflow-hidden flex items-center justify-center">
                  {userRank.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={userRank.avatar_url}
                      alt={userRank.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                {userRank.rank ? (
                  <span className="absolute -bottom-1 -right-1 bg-primary-600 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-slate-900 shadow-xs">
                    #{userRank.rank}
                  </span>
                ) : null}
              </div>

              {/* User Display Name & Rank Status */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-black text-white truncate max-w-[130px]">
                    {userRank.display_name || "You"}
                  </p>
                  <span className="bg-primary-500/30 text-primary-300 border border-primary-500/40 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                    Your Standing
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                  {userRank.rank ? (
                    <span>National Rank #{userRank.rank}</span>
                  ) : (
                    <span className="text-amber-400 font-bold">
                      Unranked this period
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Score & Points */}
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Your Score
              </span>
              <div className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-xl">
                <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                <span className="text-sm font-black text-amber-300">
                  {userRank.points}
                </span>
                <span className="text-[10px] font-bold text-amber-400/80">pts</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
