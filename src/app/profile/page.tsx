"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  Shield,
  Languages,
  Moon,
  Sun,
  LogOut,
  ExternalLink,
  BookOpen,
  Award,
  ChevronRight,
  Sparkles,
  Check,
  Send,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useTelegram } from "@/components/providers/TelegramProvider";

export default function ProfilePage() {
  const { user, session, isDevPreview, logout, triggerHaptic } = useTelegram();
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [langPreference, setLangPreference] = useState<"en" | "hi">("hi");

  const studentName = session?.name || "Student";
  const studentUsername = session?.username || (isDevPreview ? "demo_student" : "N/A");
  const studentId = session?.studentId || "preview_student_demo";

  const toggleTheme = () => {
    triggerHaptic("selection");
    const nextTheme = themeMode === "light" ? "dark" : "light";
    setThemeMode(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = async () => {
    triggerHaptic("medium");
    if (confirm("Are you sure you want to log out of your session?")) {
      await logout();
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col">
      <Header title="Student Profile" />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-12 space-y-4">
        {/* Profile Card */}
        <div className="bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white flex items-center justify-center font-black text-xl shadow-md overflow-hidden">
              {session?.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.photoUrl}
                  alt={studentName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-7 h-7" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                {studentName}
              </h2>
              {studentUsername && (
                <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold mt-0.5">
                  @{studentUsername}
                </p>
              )}
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                <Shield className="w-3 h-3 text-emerald-500" />
                Verified Telegram Student
              </span>
            </div>
          </div>

          {isDevPreview && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 rounded-2xl text-xs text-amber-800 dark:text-amber-300">
              <p className="font-bold">Preview Environment Active</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                Running in standard web browser mode. When launched inside Telegram, your genuine Telegram identity and photo are verified automatically.
              </p>
            </div>
          )}
        </div>

        {/* Subscription & Entitlement Info */}
        <div className="bg-gradient-to-r from-primary-900 to-purple-900 text-white p-4 rounded-3xl shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary-200 uppercase tracking-wider">
              Membership Tier
            </span>
            <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">
              ACTIVE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold">CCC Free Access Tier</h3>
          </div>
          <p className="text-xs text-slate-300">
            Unlimited access to all 9 chapter tests and full mock test series.
          </p>
        </div>

        {/* Preferences Menu */}
        <div className="bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-2 shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
          {/* Language Preference */}
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 flex items-center justify-center">
                <Languages className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Language Preference
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Default test question language
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-bold">
              <button
                onClick={() => setLangPreference("en")}
                className={`px-2 py-1 rounded ${
                  langPreference === "en" ? "bg-white text-primary-600 shadow-2xs" : "text-slate-500"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLangPreference("hi")}
                className={`px-2 py-1 rounded ${
                  langPreference === "hi" ? "bg-white text-primary-600 shadow-2xs" : "text-slate-500"
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          {/* Theme Switcher */}
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                {themeMode === "light" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Theme Appearance
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {themeMode === "light" ? "Light theme" : "Dark theme"}
                </span>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="text-xs font-bold text-primary-600 dark:text-primary-400 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
            >
              Toggle
            </button>
          </div>

          {/* Official Website Link */}
          <a
            href="https://www.cccguru.in"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  CCCGuru Public Portal
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Visit www.cccguru.in for syllabus & notes
                </span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>

          {/* Telegram Support Channel */}
          <a
            href="https://t.me/nielitcccexam"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Telegram Community
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  t.me/nielitcccexam • Daily updates & study material
                </span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-white dark:bg-[#121626] border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out / Reset Session</span>
        </button>

        {/* Version info */}
        <p className="text-center text-[10px] text-slate-400 font-medium">
          CCCGuru Mini App v1.0.0 • Connected to Supabase Production
        </p>
      </div>
    </div>
  );
}
