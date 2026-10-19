"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Layers, Award, User } from "lucide-react";
import { useTelegram } from "@/components/providers/TelegramProvider";

export function BottomNav() {
  const pathname = usePathname();
  const { triggerHaptic } = useTelegram();

  // Hide bottom navigation during active test exam
  if (pathname.startsWith("/exam/")) {
    return null;
  }

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Mocks", href: "/tests", icon: Layers },
    { label: "Chapters", href: "/chapters", icon: BookOpen },
    { label: "Results", href: "/results", icon: Award },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#101424]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 safe-bottom shadow-lg">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
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
              className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
                isActive
                  ? "text-primary-600 dark:text-primary-400 font-semibold"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "scale-110" : ""
                  }`}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary-600 dark:bg-primary-400 rounded-full" />
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
