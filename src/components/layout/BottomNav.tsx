"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Zap,
  Layers,
  Trophy,
  User,
} from "lucide-react";
import { useTelegram } from "@/components/providers/TelegramProvider";

export function BottomNav() {
  const pathname = usePathname();
  const { triggerHaptic } = useTelegram();

  // Hide bottom navigation during active test exam or active quiz
  if (pathname.startsWith("/exam/") || pathname.startsWith("/quiz/")) {
    return null;
  }

  const navItems = [
    { label: "Learn", href: "/", icon: Compass, color: "text-purple-600 dark:text-purple-400" },
    { label: "Quiz", href: "/quiz", icon: Zap, color: "text-amber-500 dark:text-amber-400", badge: "⚡" },
    { label: "Mocks", href: "/tests", icon: Layers, color: "text-blue-600 dark:text-blue-400" },
    { label: "Ranks", href: "/leaderboard", icon: Trophy, color: "text-amber-500 dark:text-amber-400" },
    { label: "Profile", href: "/profile", icon: User, color: "text-indigo-600 dark:text-indigo-400" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0c1020]/95 backdrop-blur-lg border-t-2 border-slate-200 dark:border-slate-800 safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-1.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => triggerHaptic("selection")}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-150 active:scale-95 group ${
                isActive
                  ? "font-black"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {/* Active glow background pill */}
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full shadow-[0_0_8px_rgba(139,50,244,0.6)] animate-pulse" />
              )}

              <div
                className={`relative p-1 rounded-xl transition-all duration-150 ${
                  isActive
                    ? "bg-primary-50 dark:bg-primary-950/60 -translate-y-1"
                    : "group-hover:bg-slate-100 dark:group-hover:bg-slate-800/50"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive
                      ? `${item.color} scale-110 drop-shadow-sm`
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                />
                {item.badge && !isActive && (
                  <span className="absolute -top-1 -right-1 text-[8px] leading-none">
                    {item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] mt-0.5 tracking-tight transition-colors ${
                  isActive
                    ? "text-slate-900 dark:text-white font-extrabold"
                    : "font-semibold"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
