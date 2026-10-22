"use client";

import { useState, useEffect, useCallback } from "react";
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
  ArrowRight,
  Sparkles,
  Check,
  Send,
  Link2,
  Mail,
  Lock,
  X,
  Loader2,
  Trophy,
  Flame,
  Star,
  Target,
  Zap,
  ClipboardCheck,
  FileCheck,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useTelegram } from "@/components/providers/TelegramProvider";
import { GameCard } from "@/components/gamified/GameCard";
import { GameButton } from "@/components/gamified/GameButton";
import {
  StreakFlame,
  GameProgressBar,
  getPlayerLevel,
} from "@/components/gamified/GamifiedWidgets";
import { getSavedLanguage, setSavedLanguage, LanguageMode } from "@/lib/language";
import { getPlayerBadges } from "@/lib/badges";

export default function ProfilePage() {
  const { user, session, isDevPreview, logout, triggerHaptic } = useTelegram();
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [langPreference, setLangPreference] = useState<LanguageMode>("hi");

  // Dashboard stats state
  const [stats, setStats] = useState<{
    testsTaken: number;
    avgAccuracy: number;
    totalQuestionsSolved: number;
    dayStreak: number;
    totalPoints: number;
    preparationPercentage: number;
  }>({
    testsTaken: 0,
    avgAccuracy: 0,
    totalQuestionsSolved: 0,
    dayStreak: 1,
    totalPoints: 0,
    preparationPercentage: 20,
  });

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

  // Sync saved language preference on mount
  useEffect(() => {
    setLangPreference(getSavedLanguage());

    const handleLangChange = (e: any) => {
      if (e.detail) setLangPreference(e.detail);
    };
    window.addEventListener("ccc_language_changed", handleLangChange);
    return () => {
      window.removeEventListener("ccc_language_changed", handleLangChange);
    };
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/mini-app/dashboard");
      if (res.ok) {
        const json = await res.json();
        if (json.stats) {
          setStats((prev) => ({
            ...prev,
            ...json.stats,
            totalPoints: json.stats.totalPoints ?? prev.totalPoints,
          }));
        }
      }
    } catch {
      // fallback to initial stats
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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

  // Player level based on verified total points
  const playerLevel = getPlayerLevel(
    stats.totalPoints,
    stats.totalQuestionsSolved,
    stats.avgAccuracy
  );

  // Multi-tier Badges computed from shared badges model
  const badges = getPlayerBadges(stats);
  const unlockedBadges = badges.filter((b) => b.isUnlocked);
  const lockedBadges = badges.filter((b) => !b.isUnlocked);
  const unlockedCount = unlockedBadges.length;
  const totalBadges = badges.length;
  const badgeProgressPercent = Math.round((unlockedCount / totalBadges) * 100);

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
      <Header
        title="Player Profile"
        streak={stats.dayStreak}
        points={stats.totalPoints}
      />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3.5 pb-12 space-y-4">
        {/* Player Character RPG Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-800 via-primary-700 to-indigo-800 text-white p-5 shadow-lg shadow-primary-800/25 border-2 border-primary-500/40 border-b-[6px] border-b-primary-950 space-y-4">
          <div className="flex items-center gap-3.5">
            {/* Avatar with Level Ring */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-purple-600 text-white flex items-center justify-center font-black text-2xl shadow-md overflow-hidden ring-3 ring-amber-300">
                {session?.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.photoUrl}
                    alt={studentName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-8 h-8" />
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs border border-amber-200">
                Lvl {playerLevel.level}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white leading-tight truncate">
                  {studentName}
                </h2>
                <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                  <Shield className="w-2.5 h-2.5" />
                  Verified
                </span>
              </div>

              {studentUsername && (
                <p className="text-xs text-primary-200 font-semibold mt-0.5">
                  @{studentUsername}
                </p>
              )}

              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 mt-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                {playerLevel.title}
              </span>
            </div>
          </div>

          {/* Level Points Progress Bar */}
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/15 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1 text-amber-200">
                <Star className="w-3.5 h-3.5 fill-current text-amber-300" />
                Player Points
              </span>
              <span className="text-white/90">
                {stats.totalPoints} / {playerLevel.nextThreshold} Points
              </span>
            </div>
            <GameProgressBar
              progress={(stats.totalPoints / playerLevel.nextThreshold) * 100}
              color="amber"
              height="sm"
            />
          </div>

          {isDevPreview && (
            <div className="bg-amber-400/20 border border-amber-300/40 p-2.5 rounded-xl text-xs text-amber-200 font-semibold">
              Preview Mode Active: Launched in browser. Genuine Telegram identity is verified when launched inside Telegram.
            </div>
          )}
        </div>

        {/* Player Stats Matrix (4 Tactile Tiles) */}
        <div className="grid grid-cols-4 gap-2">
          <Link
            href="/results"
            onClick={() => triggerHaptic("selection")}
            className="block cursor-pointer"
            title="View Test Results"
          >
            <GameCard className="p-2.5 text-center flex flex-col items-center justify-center hover:border-primary-400 dark:hover:border-primary-600 transition-all group">
              <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-950/80 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <Target className="w-4 h-4" />
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white leading-none">
                {stats.testsTaken}
              </div>
              <div className="text-[9px] text-slate-500 font-bold uppercase mt-1 flex items-center justify-center gap-0.5">
                <span>Tests</span>
                <ChevronRight className="w-2.5 h-2.5 text-slate-400" />
              </div>
            </GameCard>
          </Link>

          <GameCard className="p-2.5 text-center flex flex-col items-center justify-center">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white leading-none">
              {stats.avgAccuracy}%
            </div>
            <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">
              Accuracy
            </div>
          </GameCard>

          <GameCard className="p-2.5 text-center flex flex-col items-center justify-center">
            <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-1">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-flame" />
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white leading-none">
              {stats.dayStreak}d
            </div>
            <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">
              Streak
            </div>
          </GameCard>

          <GameCard className="p-2.5 text-center flex flex-col items-center justify-center">
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1">
              <Zap className="w-4 h-4 fill-purple-500 text-purple-500" />
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white leading-none">
              {stats.totalQuestionsSolved}
            </div>
            <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">
              Solved
            </div>
          </GameCard>
        </div>

        {/* View Results & Test History Action Card */}
        <Link
          href="/results"
          onClick={() => triggerHaptic("medium")}
          className="game-card p-3.5 flex items-center justify-between group hover:border-primary-400 dark:hover:border-primary-500 transition-all border-b-4 border-b-primary-600/30 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-primary-500/20 shrink-0 group-hover:scale-105 transition-transform">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  My Test Results & History
                </h3>
                <span className="text-[9px] font-black bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 px-2 py-0.2 rounded-full border border-primary-200 dark:border-primary-800">
                  {stats.testsTaken} {stats.testsTaken === 1 ? "Test" : "Tests"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Check scorecards, accuracy & official answer keys
              </p>
            </div>
          </div>

          <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all shrink-0">
            <ChevronRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Collapsed Badges & Achievements Section */}
        <section className="game-card p-4 space-y-3 border-amber-300/70 dark:border-amber-700/60 bg-gradient-to-br from-amber-500/5 via-transparent to-primary-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Badges & Trophies
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">
                  Gamified syllabus milestones
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-xs">
                {unlockedCount} / {totalBadges} Earned
              </span>
            </div>
          </div>

          {/* Badge Collection Progress Bar */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-500 dark:text-slate-400">
                Cabinet Completion
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-black">
                {badgeProgressPercent}%
              </span>
            </div>
            <GameProgressBar
              progress={badgeProgressPercent}
              color="amber"
              height="sm"
            />
          </div>

          {/* Quick Preview Chips Row: Earned Emojis + Next Targets */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              {unlockedBadges.length > 0 ? (
                unlockedBadges.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-sm shadow-2xs shrink-0"
                    title={`${b.title} (${b.level})`}
                  >
                    {b.emoji}
                  </div>
                ))
              ) : (
                <span className="text-[11px] text-slate-400 italic">
                  Take tests to unlock your first trophy!
                </span>
              )}
              {unlockedBadges.length > 5 && (
                <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg shrink-0">
                  +{unlockedBadges.length - 5}
                </span>
              )}
            </div>

            <Link
              href="/profile/badges"
              onClick={() => triggerHaptic("medium")}
              className="btn-3d btn-3d-amber inline-flex items-center gap-1 text-[11px] font-black px-3 py-1.5 rounded-xl shrink-0 cursor-pointer shadow-xs"
            >
              <span>View All ({totalBadges})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* Membership Tier Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 text-white p-4 shadow-sm border-2 border-emerald-400/40 border-b-[5px] border-b-emerald-950 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-200 uppercase tracking-wider">
              Membership Status
            </span>
            <span className="text-[9px] font-black bg-white text-emerald-800 px-2 py-0.5 rounded-full uppercase">
              Free Access Active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h3 className="text-sm font-black">CCC Master Learner Pass</h3>
          </div>
          <p className="text-[11px] text-emerald-100 leading-relaxed">
            Unlimited access to all 9 chapter tests, full mock series, and official answer keys.
          </p>
        </div>

        {/* CCCGuru Cross-Platform Account Sync */}
        <div className="game-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
                <Link2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  Cross-Platform Sync
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  Sync with CCCGuru.in & Android App
                </p>
              </div>
            </div>

            {linkedEmail ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                <Check className="w-3 h-3" />
                Linked
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                Not Linked
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {linkedEmail
              ? `Linked to ${linkedEmail}. Your leaderboard scores and attempts are synced.`
              : "Link your CCCGuru website email to maintain one canonical identity across Telegram and the website."}
          </p>

          {!linkedEmail ? (
            <button
              onClick={() => {
                triggerHaptic("selection");
                setLinkError(null);
                setLinkSuccess(null);
                setIsLinkModalOpen(true);
              }}
              className="btn-3d-primary w-full py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Link2 className="w-4 h-4" />
              <span>Link CCCGuru Account</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1 font-semibold">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Unified Canonical User ID active</span>
            </div>
          )}
        </div>

        {/* Preferences and External Links */}
        <div className="game-card p-2 divide-y divide-slate-100 dark:divide-slate-800">
          {/* Language Preference */}
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 flex items-center justify-center">
                <Languages className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Question Language
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {langPreference === "hi"
                    ? "Hindi only (saved)"
                    : langPreference === "en"
                    ? "English only (saved)"
                    : "Bilingual: Hindi & English (saved)"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-bold">
              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setLangPreference("en");
                  setSavedLanguage("en");
                }}
                className={`px-2 py-1 rounded-md text-xs font-black cursor-pointer transition-colors ${
                  langPreference === "en"
                    ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs"
                    : "text-slate-500"
                }`}
                title="English only"
              >
                EN
              </button>
              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setLangPreference("hi");
                  setSavedLanguage("hi");
                }}
                className={`px-2 py-1 rounded-md text-xs font-black cursor-pointer transition-colors ${
                  langPreference === "hi"
                    ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs"
                    : "text-slate-500"
                }`}
                title="हिन्दी"
              >
                हिन्दी
              </button>
              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setLangPreference("bilingual");
                  setSavedLanguage("bilingual");
                }}
                className={`px-2 py-1 rounded-md text-xs font-black cursor-pointer transition-colors ${
                  langPreference === "bilingual"
                    ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs"
                    : "text-slate-500"
                }`}
                title="Bilingual / Both"
              >
                Both
              </button>
            </div>
          </div>

          {/* Theme Switcher */}
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
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
              className="text-xs font-black text-primary-600 dark:text-primary-400 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
            >
              Toggle
            </button>
          </div>

          {/* View Results Link */}
          <Link
            href="/results"
            onClick={() => triggerHaptic("selection")}
            className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 flex items-center justify-center">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Past Results & Scorecards
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Review completed tests, accuracy & answer keys
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>

          {/* Badges Cabinet Link */}
          <Link
            href="/profile/badges"
            onClick={() => triggerHaptic("selection")}
            className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Badges & Trophy Showcase
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {unlockedCount} / {totalBadges} Badges earned
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>

          {/* Official Website Link */}
          <a
            href="https://www.cccguru.in"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
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
            className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Telegram Community
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  t.me/nielitcccexam • Daily updates
                </span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-white dark:bg-[#121626] border-2 border-rose-200 dark:border-rose-900/60 border-b-4 border-b-rose-300 dark:border-b-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out / Reset Session</span>
        </button>

        {/* Version info */}
        <p className="text-center text-[10px] text-slate-400 font-semibold">
          CCCGuru Mini App v1.0.0 • Connected to Supabase Production
        </p>
      </div>

      {/* Account Linking Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121626] border-2 border-slate-300 dark:border-slate-800 border-b-[6px] border-b-slate-400 dark:border-b-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
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
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-bold">
                {linkError}
              </div>
            )}

            {linkSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
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
                  className="btn-3d-slate flex-1 py-2 px-3 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLinking || !linkEmail || !linkPassword}
                  className="btn-3d-primary flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  {isLinking ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Linking...</span>
                    </>
                  ) : (
                    <span>Link Account</span>
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
