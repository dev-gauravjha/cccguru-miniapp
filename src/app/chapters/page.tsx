"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Compass,
  HelpCircle,
  Clock,
  Play,
  CheckCircle2,
  ChevronRight,
  Loader2,
  AlertCircle,
  Star,
  Award,
  Sparkles,
  Zap,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useTelegram } from "@/components/providers/TelegramProvider";
import { GameButton } from "@/components/gamified/GameButton";
import { GameCard } from "@/components/gamified/GameCard";

// Detailed topic highlights for each of the 9 NIELIT CCC chapters
const CHAPTER_METADATA: Record<
  number,
  { emoji: string; highlight: string; hindiHighlight: string; color: string }
> = {
  1: {
    emoji: "💻",
    highlight: "Hardware, CPU, RAM/ROM, Input/Output & Storage devices",
    hindiHighlight: "हार्डवेयर, सीपीयू, मेमोरी एवं इनपुट/आउटपुट डिवाइसेस",
    color: "from-blue-600 to-indigo-600",
  },
  2: {
    emoji: "🖥️",
    highlight: "GUI OS, Windows, Linux, Desktop files & directories",
    hindiHighlight: "ऑपरेटिंग सिस्टम, विंडोज/लिनक्स, फाइल एवं डायरेक्टरी",
    color: "from-indigo-600 to-purple-600",
  },
  3: {
    emoji: "📝",
    highlight: "LibreOffice Writer, text formatting, tables & mail merge",
    hindiHighlight: "लिब्रेऑफिस राइटर, टेक्स्ट फॉर्मेटिंग, टेबल व मेल मर्ज",
    color: "from-purple-600 to-pink-600",
  },
  4: {
    emoji: "📊",
    highlight: "LibreOffice Calc, spreadsheets, formulas, functions & charts",
    hindiHighlight: "लिब्रेऑफिस कैल्क, स्प्रेडशीट, फॉर्मूला व चार्ट्स",
    color: "from-emerald-600 to-teal-600",
  },
  5: {
    emoji: "📽️",
    highlight: "LibreOffice Impress, slide creation, transitions & master slides",
    hindiHighlight: "लिब्रेऑफिस इम्प्रेस, स्लाइड निर्माण व ट्रांज़िशन्स",
    color: "from-amber-600 to-orange-600",
  },
  6: {
    emoji: "🌐",
    highlight: "Internet, LAN/WAN, IP addresses, search engines & browsers",
    hindiHighlight: "इंटरनेट, लैन/वैन, आईपी एड्रेस, सर्च इंजन व ब्राउज़र",
    color: "from-cyan-600 to-blue-600",
  },
  7: {
    emoji: "📧",
    highlight: "Email protocols (POP3/SMTP/IMAP), social networks & e-Gov portals",
    hindiHighlight: "ई-मेल प्रोटोकॉल, सोशल मीडिया व ई-गवर्नेंस सेवाएं",
    color: "from-rose-600 to-red-600",
  },
  8: {
    emoji: "💳",
    highlight: "Digital payments, UPI, OTP, QR Code, AEPS, USSD & Internet Banking",
    hindiHighlight: "डिजिटल बैंकिंग, यूपीआई, ओटीपी, एईपीएस व नेट बैंकिंग",
    color: "from-teal-600 to-emerald-700",
  },
  9: {
    emoji: "🔒",
    highlight: "Cyber security, malware, firewalls, IT Act & future digital skills",
    hindiHighlight: "साइबर सुरक्षा, मैलवेयर, फायरवॉल व आईटी एक्ट 2000",
    color: "from-violet-600 to-indigo-800",
  },
  10: {
    emoji: "🤖",
    highlight: "Future skills, Artificial Intelligence, IoT, Cloud Computing & Big Data",
    hindiHighlight: "भविष्य के कौशल, एआई, इंटरनेट ऑफ थिंग्स व क्लाउड कंप्यूटिंग",
    color: "from-fuchsia-600 to-purple-800",
  },
};

export default function ChaptersPage() {
  const { triggerHaptic } = useTelegram();
  const [chapters, setChapters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChapters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mini-app/chapters");
      if (!res.ok) throw new Error("Failed to load chapters");
      const json = await res.json();
      setChapters(json.chapters || []);
    } catch (err: any) {
      setError(err.message || "Failed to load chapters");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col">
      <Header title="Chapter Roadmap" />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3.5 pb-12 space-y-4">
        {/* Gamified Learning Roadmap Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-primary-700 to-purple-800 text-white p-5 shadow-lg shadow-primary-700/25 border-2 border-primary-500/40 border-b-[6px] border-b-primary-950">
          <div className="relative z-10 space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
              <Compass className="w-3.5 h-3.5 text-amber-300" />
              NIELIT CCC Syllabus Roadmap
            </span>
            <h2 className="text-lg font-black tracking-tight">
              {chapters.length > 0 ? `${chapters.length} Official Syllabus Chapters 🗺️` : "NIELIT CCC Chapters 🗺️"}
            </h2>
            <p className="text-xs text-primary-100 leading-relaxed max-w-[320px]">
              Progress along the CCC learning path. Complete each chapter test to earn +100 XP and build exam readiness.
            </p>
          </div>

          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            <span className="text-xs font-bold">Loading syllabus chapters...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800 p-4 rounded-2xl text-center space-y-2">
            <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
            <p className="text-xs text-rose-700 dark:text-rose-400 font-bold">
              {error}
            </p>
            <button
              onClick={fetchChapters}
              className="btn-3d-rose px-4 py-1.5 rounded-xl text-xs font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Gamified Roadmap Nodes */}
        {!isLoading && chapters.length > 0 && (
          <div className="relative space-y-3 pt-1">
            {chapters.map((chap, index) => {
              const meta = CHAPTER_METADATA[chap.sort_order] || {
                emoji: "📚",
                highlight: "Standard CCC syllabus topic",
                hindiHighlight: "सीसीसी पाठ्यक्रम अध्याय",
                color: "from-primary-600 to-indigo-600",
              };

              return (
                <div key={chap.id} className="relative group">
                  {/* Stepping node card */}
                  <div className="game-card p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      {/* 3D Round Node Avatar */}
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.color} text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md border-b-3 border-black/30 group-hover:scale-105 transition-transform`}
                      >
                        <span>{meta.emoji}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/80 px-2 py-0.5 rounded-md border border-primary-200 dark:border-primary-800">
                            Chapter {chap.sort_order} of {chapters.length || 10}
                          </span>
                          <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current text-amber-500" />
                            +100 XP
                          </span>
                        </div>

                        <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                          {chap.title}
                        </h3>

                        {chap.hindi_title && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                            {chap.hindi_title}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Topic Highlight Pill */}
                    <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/80 p-2.5 rounded-xl text-xs space-y-0.5">
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        💡 {meta.highlight}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {meta.hindiHighlight}
                      </p>
                    </div>

                    {/* Footer Stats & Tactile Start Button */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2.5 text-xs text-slate-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-primary-500" />
                          {chap.questionCount || 100} Qs
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {chap.duration || 90}m
                        </span>
                      </div>

                      <Link
                        href={`/exam/${chap.testItemId}`}
                        onClick={() => triggerHaptic("medium")}
                        className="btn-3d-primary px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start Test</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
