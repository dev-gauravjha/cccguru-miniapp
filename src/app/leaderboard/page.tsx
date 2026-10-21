import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";

export const metadata: Metadata = {
  title: "Leaderboard | CCCGuru NIELIT Exam Preparation",
  description:
    "Official CCCGuru Daily, Monthly, and All-Time Leaderboard. Compete with students across India preparing for NIELIT CCC exam.",
};

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col">
      <Header title="Leaderboard" />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4">
        {/* Intro Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-primary-600 to-indigo-600 text-white p-4 mb-4 shadow-md">
          <div className="relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              Unified Scoreboard
            </span>
            <h2 className="text-base font-extrabold mt-1">
              NIELIT CCC Top Learners 🏆
            </h2>
            <p className="text-xs text-amber-100 mt-0.5 leading-relaxed">
              Earn +1 point for each correct question in published mock tests.
              Rankings updated live across India.
            </p>
          </div>
        </div>

        <LeaderboardView />
      </main>
    </div>
  );
}
