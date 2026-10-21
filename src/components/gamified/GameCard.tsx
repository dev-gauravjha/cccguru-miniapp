"use client";

import React from "react";

export type GameCardVariant = "default" | "primary" | "amber" | "emerald" | "rose" | "dark";

interface GameCardProps {
  children: React.ReactNode;
  variant?: GameCardVariant;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const variantBorders: Record<GameCardVariant, string> = {
  default:
    "bg-white dark:bg-[#121626] border-slate-200/90 dark:border-slate-800 border-b-slate-300 dark:border-b-slate-900",
  primary:
    "bg-gradient-to-br from-primary-900/90 via-primary-800 to-indigo-900 border-primary-500/40 border-b-primary-700 text-white",
  amber:
    "bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent border-amber-300 dark:border-amber-600/50 border-b-amber-400 dark:border-b-amber-700",
  emerald:
    "bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-transparent border-emerald-300 dark:border-emerald-600/50 border-b-emerald-400 dark:border-b-emerald-700",
  rose:
    "bg-gradient-to-br from-rose-500/10 via-rose-400/5 to-transparent border-rose-300 dark:border-rose-600/50 border-b-rose-400 dark:border-b-rose-700",
  dark:
    "bg-slate-900 text-white border-slate-700 border-b-slate-800",
};

export function GameCard({
  children,
  variant = "default",
  className = "",
  onClick,
  hoverable = true,
}: GameCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border-2 border-b-[5px] p-4 transition-all duration-150 ${
        variantBorders[variant]
      } ${
        hoverable ? "hover:border-primary-400 active:translate-y-[1px]" : ""
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
