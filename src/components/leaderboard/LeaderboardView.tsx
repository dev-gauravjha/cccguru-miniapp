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
} from "lucide-react";
import type { LeaderboardEntry, UserLeaderboardRank } from "@/types/database";

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
      {/* Period Selection Tabs */}
      <div className="bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-2xl flex items-center justify-between text-xs font-bold shadow-inner">
        {(
          [
            { id: "daily", label: "Daily" },
            { id: "monthly", label: "Monthly" },
            { id: "all_time", label: "All Time" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => handlePeriodChange(tab.id)}
            className={`flex-1 py-2 rounded-xl transition-all ${
              period === tab.id
                ? "bg-white dark:bg-[#121626] text-primary-600 dark:text-primary-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timezone & Refresh Header */}
      <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1 font-medium">
          <Clock className="w-3.5 h-3.5 text-primary-500" />
          Period resets at 00:00 IST (Asia/Kolkata)
        </span>
        <button
          onClick={() => fetchInitialLeaderboard(period, true)}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-1 font-bold text-primary-600 dark:text-primary-400 hover:opacity-80 active:scale-95 transition-all"
        >
          <RotateCcw
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4 py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            Loading rankings for {period === "daily" ? "today" : period === "monthly" ? "this month" : "all time"}...
          </p>
        </div>
      ) : error ? (
        /* Error State */
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-6 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
            {error}
          </p>
          <button
            onClick={() => fetchInitialLeaderboard(period)}
            className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold active:scale-95 transition-all"
          >
            Try Again
          </button>
        </div>
      ) : leaderboard.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-[#121626] border border-slate-200 dark:border-slate-800 p-8 rounded-3xl text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-950/50 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
            <Trophy className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No Scores Recorded Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {period === "daily"
              ? "No tests completed yet today in Asia/Kolkata. Complete a mock test to claim the #1 rank!"
              : period === "monthly"
              ? "Be the first to complete a test this month and lead the scoreboard!"
              : "All-time scoreboard is ready. Earn points by completing practice tests!"}
          </p>
        </div>
      ) : (
        /* Leaderboard Content */
        <div className="space-y-4">
          {/* Top 3 Podium Cards */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-2 items-end">
              {podiumOrder.map((entry) => {
                const isFirst = entry.rank === 1;
                const isSecond = entry.rank === 2;
                const isThird = entry.rank === 3;
                const isCurrentUser =
                  userRank?.canonical_user_id === entry.canonical_user_id;

                return (
                  <div
                    key={entry.canonical_user_id}
                    className={`relative rounded-2xl p-3 text-center flex flex-col items-center justify-between transition-all ${
                      isFirst
                        ? "bg-gradient-to-b from-amber-500/20 via-amber-500/10 to-transparent border-2 border-amber-400 dark:border-amber-500 shadow-lg shadow-amber-500/10 min-h-[165px]"
                        : isSecond
                        ? "bg-gradient-to-b from-slate-400/20 to-transparent border border-slate-300 dark:border-slate-600 min-h-[148px]"
                        : "bg-gradient-to-b from-orange-600/20 to-transparent border border-orange-300 dark:border-orange-700 min-h-[138px]"
                    } ${
                      isCurrentUser
                        ? "ring-2 ring-primary-500 shadow-md shadow-primary-500/20"
                        : ""
                    }`}
                  >
                    {/* Crown for 1st place */}
                    {isFirst && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-full flex items-center justify-center text-white shadow-md">
                        <Trophy className="w-3.5 h-3.5 fill-current" />
                      </div>
                    )}

                    {/* Avatar */}
                    <div className="relative mt-2">
                      <div
                        className={`rounded-full overflow-hidden flex items-center justify-center bg-slate-200 dark:bg-slate-700 ${
                          isFirst
                            ? "w-14 h-14 ring-4 ring-amber-400/50"
                            : "w-11 h-11 ring-2 ring-slate-300 dark:ring-slate-600"
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
                      <span
                        className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-xs ${
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
                    <div className="w-full mt-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate px-1 flex items-center justify-center gap-1">
                        <span className="truncate">{entry.display_name}</span>
                        {isCurrentUser && (
                          <span className="text-[9px] bg-primary-500 text-white font-extrabold px-1 rounded shrink-0">
                            You
                          </span>
                        )}
                      </p>
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black mt-1 ${
                          isFirst
                            ? "bg-amber-500 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{entry.points}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Remaining Ranks (4+) with Infinite Scroll */}
          {remainingRanks.length > 0 && (
            <div className="space-y-2 pt-1">
              {remainingRanks.map((entry) => {
                const isCurrentUser =
                  userRank?.canonical_user_id === entry.canonical_user_id;

                return (
                  <div
                    key={entry.canonical_user_id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isCurrentUser
                        ? "bg-primary-50 dark:bg-primary-950/40 border-primary-400 dark:border-primary-600 ring-2 ring-primary-500/20 shadow-sm"
                        : "bg-white dark:bg-[#121626] border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank Number */}
                      <span
                        className={`w-7 text-center font-bold text-xs ${
                          isCurrentUser
                            ? "text-primary-600 dark:text-primary-400 font-extrabold"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        #{entry.rank}
                      </span>

                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
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

                      {/* Name & Tests Count */}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                          <span className="truncate">{entry.display_name}</span>
                          {isCurrentUser && (
                            <span className="text-[9px] bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300 font-extrabold px-1.5 py-0.2 rounded-full shrink-0">
                              You
                            </span>
                          )}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {entry.tests_completed} test
                          {entry.tests_completed === 1 ? "" : "s"} completed
                        </span>
                      </div>
                    </div>

                    {/* Points */}
                    <div
                      className={`flex items-center gap-1 shrink-0 font-black text-sm px-2.5 py-1 rounded-xl ${
                        isCurrentUser
                          ? "bg-primary-600 text-white"
                          : "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{entry.points}</span>
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
            <div className="flex items-center justify-center gap-2 py-4 text-xs font-semibold text-primary-600 dark:text-primary-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading next rankings...</span>
            </div>
          )}

          {/* Load More Error / Retry */}
          {loadMoreError && (
            <div className="text-center py-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl p-3 border border-rose-200 dark:border-rose-900">
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1.5">
                {loadMoreError}
              </p>
              <button
                onClick={() => loadMore()}
                className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-xl active:scale-95 transition-all"
              >
                Retry
              </button>
            </div>
          )}

          {/* End of list reached */}
          {!hasMore && leaderboard.length > 0 && !isLoading && (
            <div className="text-center py-4 text-[11px] text-slate-400 dark:text-slate-500 font-medium border-t border-slate-200/60 dark:border-slate-800/60 mt-4">
              All {leaderboard.length} ranked learners loaded for this period
            </div>
          )}
        </div>
      )}

      {/* Sticky Bottom: My Rank Card (ONLY SHOWN IF USER IS ABSENT FROM LOADED ENTRIES) */}
      {showStickyRankCard && userRank && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 px-4 pointer-events-none transition-all duration-300">
          <div className="max-w-md mx-auto pointer-events-auto bg-slate-900/95 dark:bg-[#101424]/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-3 min-w-0">
              {/* User Avatar with Rank badge */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-slate-800 ring-2 ring-primary-500/50 overflow-hidden flex items-center justify-center">
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
                  <p className="text-xs font-bold text-white truncate max-w-[130px]">
                    {userRank.display_name || "You"}
                  </p>
                  <span className="bg-primary-500/20 text-primary-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                    You
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {userRank.rank ? (
                    <span>Global Rank #{userRank.rank}</span>
                  ) : (
                    <span className="text-amber-400 font-medium">
                      Unranked this period
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Score & Points */}
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 font-medium block">
                Your Score
              </span>
              <div className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
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
