"use client";

import Link from "next/link";
import { Sparkles, Flame, User as UserIcon } from "lucide-react";
import { useTelegram } from "@/components/providers/TelegramProvider";

export function Header({
  title,
  showStreak = true,
  streak = 1,
}: {
  title?: string;
  showStreak?: boolean;
  streak?: number;
}) {
  const { session, isDevPreview } = useTelegram();

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0c1020]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Brand or Page Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-primary-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {title || "CCCGuru"}
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none">
              NIELIT CCC 2026
            </p>
          </div>
        </div>

        {/* Right side: Streak and Profile preview */}
        <div className="flex items-center gap-2">
          {isDevPreview && (
            <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
              Preview Mode
            </span>
          )}

          {showStreak && (
            <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/60 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-full text-xs font-bold">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{streak}d</span>
            </div>
          )}

          <Link
            href="/profile"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 overflow-hidden"
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
