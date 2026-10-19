"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  HelpCircle,
  Clock,
  Play,
  CheckCircle2,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useTelegram } from "@/components/providers/TelegramProvider";

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
      <Header title="Chapter-wise Practice" />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-8 space-y-4">
        {/* Banner */}
        <div className="bg-gradient-to-r from-primary-800 to-purple-900 text-white p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-xs text-primary-200 font-semibold mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>NIELIT CCC Complete Syllabus</span>
          </div>
          <h2 className="text-base font-bold">9 Standard CCC Chapters</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Master every syllabus topic individually with targeted question sets.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <span className="text-xs">Loading CCC chapters...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl text-center">
            <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
            <p className="text-xs text-rose-700 dark:text-rose-400 font-medium mb-3">
              {error}
            </p>
            <button
              onClick={fetchChapters}
              className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Chapter List */}
        {!isLoading && chapters.length > 0 && (
          <div className="space-y-3">
            {chapters.map((chap) => (
              <div
                key={chap.id}
                className="bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-2xl shadow-xs space-y-3 hover:border-primary-400 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 font-extrabold text-sm flex items-center justify-center shrink-0 border border-primary-200 dark:border-primary-800">
                    {chap.sort_order}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                      Chapter {chap.sort_order}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                      {chap.title}
                    </h3>
                    {chap.hindi_title && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        {chap.hindi_title}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      {chap.questionCount || 100} Qs
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {chap.duration || 90} mins
                    </span>
                  </div>

                  <Link
                    href={`/exam/${chap.testItemId}`}
                    onClick={() => triggerHaptic("medium")}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-4 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Start Test</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
