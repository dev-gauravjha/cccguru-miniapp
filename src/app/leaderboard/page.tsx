import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { Trophy, Sparkles, Shield, Flame } from "lucide-react";

export const metadata: Metadata = {
  title: "Leaderboard | CCCGuru NIELIT Exam Preparation",
  description:
    "Official CCCGuru Daily, Monthly, and All-Time Leaderboard. Learn and excel with students across India preparing for NIELIT CCC exam.",
};

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col">
      <Header title="Leaderboard" />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-3.5">
        {/* National Rankings Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-primary-600 to-indigo-700 text-white p-5 mb-4 shadow-lg shadow-amber-600/25 border-2 border-amber-400/40 border-b-[6px] border-b-amber-900">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <Trophy className="w-3 h-3 fill-amber-300 text-amber-300" />
                National Rankings
              </span>
              <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                Live Scores
              </span>
            </div>

            <h2 className="text-lg font-black tracking-tight">
              Top CCC Scholars 🏆
            </h2>

            <p className="text-xs text-amber-100 leading-relaxed max-w-[320px]">
              Earn verified points by passing mock tests & quizzes. Climb the national student ranks across India!
            </p>
          </div>

          <div className="absolute -right-4 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        </div>

        <LeaderboardView />
      </main>
    </div>
  );
}
