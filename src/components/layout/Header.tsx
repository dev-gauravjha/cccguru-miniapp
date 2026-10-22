"use client";

import Link from "next/link";
import { Sparkles, Flame, Star, User as UserIcon } from "lucide-react";
import { useTelegram } from "@/components/providers/TelegramProvider";

export function Header({
  title,
  showStreak = true,
  streak = 1,
  points,
  xp,
}: {
  title?: string;
  showStreak?: boolean;
  streak?: number;
  points?: number;
  xp?: number;
}) {
  const { session, isDevPreview, triggerHaptic } = useTelegram();
  const displayPoints = points ?? xp;

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#090b14]/95 backdrop-blur-md border-b-2 border-slate-200/80 dark:border-slate-800/80 px-4 py-2.5 shadow-2xs">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Brand / Logo */}
        <Link
          href="/"
          onClick={() => triggerHaptic("light")}
          className="flex items-center gap-2 group active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-primary-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-primary-500/25 border-b-2 border-purple-800 group-hover:rotate-6 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                {title || "CCCGuru"}
              </h1>
              <span className="text-[9px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded-md">
                2026
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold leading-none">
              NIELIT CCC Learning
            </p>
          </div>
        </Link>

        {/* Game Stats Status Bar (Streak, Points, Profile) */}
        <div className="flex items-center gap-1.5">
          {isDevPreview && (
            <span className="hidden sm:inline-block text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full font-bold">
              Preview
            </span>
          )}

          {/* Points Pill */}
          {displayPoints !== undefined && (
            <div
              className="flex items-center gap-1 bg-amber-400/15 border border-amber-400/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full text-xs font-black shadow-2xs"
              title={`${displayPoints} Points`}
            >
              <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
              <span>{displayPoints} pts</span>
            </div>
          )}

          {/* Streak Flame */}
          {showStreak && (
            <div
              className="flex items-center gap-1 bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-full text-xs font-black shadow-2xs cursor-default"
              title={`${streak}-day learning streak`}
            >
              <Flame className="w-3.5 h-3.5 fill-current text-orange-500 animate-flame" />
              <span>{streak}d</span>
            </div>
          )}

          {/* Player Avatar */}
          <Link
            href="/profile"
            onClick={() => triggerHaptic("selection")}
            className="relative w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-primary-500/60 dark:border-primary-400/60 flex items-center justify-center text-slate-700 dark:text-slate-300 overflow-hidden shadow-xs hover:border-primary-500 active:scale-90 transition-all ml-0.5"
            title="Player Profile"
          >
            {session?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.photoUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-4 h-4" />
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
