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
  Link2,
  Mail,
  Lock,
  X,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useTelegram } from "@/components/providers/TelegramProvider";

export default function ProfilePage() {
  const { user, session, isDevPreview, logout, triggerHaptic } = useTelegram();
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [langPreference, setLangPreference] = useState<"en" | "hi">("hi");

  // Account Linking State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkPassword, setLinkPassword] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);
  const [linkedEmail, setLinkedEmail] = useState<string | null>(
    session?.authUserId ? "Linked CCCGuru Account" : null
  );

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkEmail || !linkPassword) return;

    setIsLinking(true);
    setLinkError(null);
    setLinkSuccess(null);
    triggerHaptic("medium");

    try {
      const res = await fetch("/api/telegram/link-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: linkEmail,
          password: linkPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to link account");
      }

      setLinkSuccess(data.message || "Account successfully linked!");
      setLinkedEmail(data.email || linkEmail);
      triggerHaptic("success");
      setTimeout(() => {
        setIsLinkModalOpen(false);
        setLinkPassword("");
      }, 1500);
    } catch (err: any) {
      setLinkError(err.message || "Failed to link account");
      triggerHaptic("error");
    } finally {
      setIsLinking(false);
    }
  };

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

        {/* CCCGuru Account Linking (Cross-Platform Sync) */}
        <div className="bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Link2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Cross-Platform Account Sync
                </h3>
                <p className="text-[10px] text-slate-400">
                  Sync with CCCGuru.in & Android App
                </p>
              </div>
            </div>

            {linkedEmail ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                <Check className="w-3 h-3" />
                Linked
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                Not Linked
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            {linkedEmail
              ? `Linked to ${linkedEmail}. Your leaderboard points and mock test attempts sync automatically.`
              : "Link your CCCGuru email to maintain one canonical identity across Telegram, Website, and the upcoming Android app."}
          </p>

          {!linkedEmail ? (
            <button
              onClick={() => {
                triggerHaptic("selection");
                setLinkError(null);
                setLinkSuccess(null);
                setIsLinkModalOpen(true);
              }}
              className="w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Link2 className="w-4 h-4" />
              Link CCCGuru Account
            </button>
          ) : (
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Unified Canonical User ID active
            </div>
          )}
        </div>

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

      {/* Account Linking Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Link CCCGuru Account
                </h3>
              </div>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your CCCGuru.in account credentials to merge your Telegram stats and rank with your primary account.
            </p>

            {linkError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
                {linkError}
              </div>
            )}

            {linkSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
                <Check className="w-4 h-4" />
                {linkSuccess}
              </div>
            )}

            <form onSubmit={handleLinkAccount} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="flex-1 py-2 px-3 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLinking || !linkEmail || !linkPassword}
                  className="flex-1 py-2 px-3 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isLinking ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Linking...
                    </>
                  ) : (
                    "Link Account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

