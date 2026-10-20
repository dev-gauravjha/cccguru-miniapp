"use client";

import React, { useState, useEffect, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Flag,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Languages,
  X,
  Loader2,
  Send,
  HelpCircle,
} from "lucide-react";
import { useTelegram } from "@/components/providers/TelegramProvider";
import { formatTimer, getDifficultyColor } from "@/lib/utils";
import { showPostSubmissionAd, preloadMonetagAd } from "@/lib/monetag";
import type { SanitizedQuestion, TestSeriesItem } from "@/types/database";

type LanguageMode = "en" | "hi" | "both";

interface ExamPageProps {
  params: Promise<{ testId: string }>;
}

export default function ExamPage({ params }: ExamPageProps) {
  const { testId } = use(params);
  const router = useRouter();
  const { triggerHaptic, setBackButton, session, user } = useTelegram();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingStatus, setSubmittingStatus] = useState<string>("Evaluating...");

  const [attemptId, setAttemptId] = useState<string>("");
  const [testItem, setTestItem] = useState<TestSeriesItem | null>(null);
  const [questions, setQuestions] = useState<SanitizedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // User answers map: questionId -> { selectedOption, isFlagged, timeSpent }
  const [userAnswers, setUserAnswers] = useState<
    Record<
      string,
      {
        selectedOption: "A" | "B" | "C" | "D" | null;
        isFlagged: boolean;
        timeSpent: number;
      }
    >
  >({});

  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [languageMode, setLanguageMode] = useState<LanguageMode>("both");
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questionStartTime = useRef<number>(Date.now());

  // 1. Initialize Test Attempt on Server
  const initAttempt = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mini-app/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testItemId: testId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start test attempt");
      }

      const data = await res.json();
      setAttemptId(data.attemptId);
      setTestItem(data.testItem);
      setQuestions(data.questions);
      setTimeLeft((data.durationMinutes || 90) * 60);

      // Prepopulate empty answers state
      const initialMap: typeof userAnswers = {};
      data.questions.forEach((q: SanitizedQuestion) => {
        initialMap[q.id] = {
          selectedOption: null,
          isFlagged: false,
          timeSpent: 0,
        };
      });
      setUserAnswers(initialMap);
    } catch (err: any) {
      setError(err.message || "Could not load test questions");
    } finally {
      setIsLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    initAttempt();
  }, [initAttempt]);

  // 2. Setup Telegram BackButton
  useEffect(() => {
    setBackButton(true, () => {
      setShowExitModal(true);
    });
    return () => {
      setBackButton(false);
    };
  }, [setBackButton]);

  // 3. Timer Countdown
  useEffect(() => {
    if (isLoading || isSubmitting || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading, isSubmitting, timeLeft]);

  // 4. Save Answer to Server
  const persistAnswerToServer = useCallback(
    async (
      questionId: string,
      selectedOption: "A" | "B" | "C" | "D" | null,
      isFlagged: boolean,
      timeSpentDelta: number
    ) => {
      if (!attemptId) return;
      try {
        await fetch(`/api/mini-app/attempts/${attemptId}/answers`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId,
            selectedOption,
            isFlagged,
            timeSpentSeconds: timeSpentDelta,
          }),
        });
      } catch {
        // Silently preserve locally
      }
    },
    [attemptId]
  );

  const currentQ = questions[currentIndex];
  const currentAns = currentQ ? userAnswers[currentQ.id] : null;

  // Handle Option Selection
  const handleSelectOption = (option: "A" | "B" | "C" | "D") => {
    if (!currentQ) return;
    triggerHaptic("selection");

    const elapsed = Math.floor((Date.now() - questionStartTime.current) / 1000);
    questionStartTime.current = Date.now();

    const newOption = currentAns?.selectedOption === option ? null : option;
    const isFlagged = currentAns?.isFlagged || false;

    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        selectedOption: newOption,
        isFlagged,
        timeSpent: (prev[currentQ.id]?.timeSpent || 0) + elapsed,
      },
    }));

    persistAnswerToServer(currentQ.id, newOption, isFlagged, elapsed);
  };

  // Toggle Flag / Mark for Review
  const handleToggleFlag = () => {
    if (!currentQ) return;
    triggerHaptic("medium");

    const elapsed = Math.floor((Date.now() - questionStartTime.current) / 1000);
    questionStartTime.current = Date.now();

    const selectedOption = currentAns?.selectedOption || null;
    const newFlag = !currentAns?.isFlagged;

    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        selectedOption,
        isFlagged: newFlag,
        timeSpent: (prev[currentQ.id]?.timeSpent || 0) + elapsed,
      },
    }));

    persistAnswerToServer(currentQ.id, selectedOption, newFlag, elapsed);
  };

  // Clear current response
  const handleClearResponse = () => {
    if (!currentQ) return;
    triggerHaptic("light");

    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        selectedOption: null,
        isFlagged: prev[currentQ.id]?.isFlagged || false,
        timeSpent: prev[currentQ.id]?.timeSpent || 0,
      },
    }));

    persistAnswerToServer(
      currentQ.id,
      null,
      currentAns?.isFlagged || false,
      0
    );
  };

  // Navigation
  const handleNavigate = (index: number) => {
    if (index < 0 || index >= questions.length) return;
    const elapsed = Math.floor((Date.now() - questionStartTime.current) / 1000);
    questionStartTime.current = Date.now();

    if (currentQ) {
      persistAnswerToServer(
        currentQ.id,
        currentAns?.selectedOption || null,
        currentAns?.isFlagged || false,
        elapsed
      );
    }

    setCurrentIndex(index);
    setIsPaletteOpen(false);
  };

  // Open Submit Confirmation Modal & Preload Ad Creative
  const openSubmitModal = () => {
    setShowSubmitModal(true);
    preloadMonetagAd({
      ymid: session?.studentId || (user ? String(user.id) : undefined),
      requestVar: "exam_submit",
    });
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    if (isSubmitting || !attemptId) return;
    setIsSubmitting(true);
    setSubmittingStatus("Evaluating & Saving Answers...");
    triggerHaptic("medium");

    try {
      // 1. Submit answers and evaluate on server
      const res = await fetch(`/api/mini-app/attempts/${attemptId}/submit`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to evaluate test attempt");
      }

      // 2. Answers and evaluation are safely saved in DB!
      // Update submitting status before ad trigger
      setSubmittingStatus("Preparing Official Result...");

      // 3. Trigger Monetag Post-Submission Interstitial ad
      try {
        await showPostSubmissionAd({
          studentId: session?.studentId || (user ? String(user.id) : undefined),
          attemptId,
          maxWaitMs: 6000,
        });
      } catch (adErr) {
        console.warn("[Monetag] Post-submission ad notice:", adErr);
      }

      // 4. Guarantee navigation to results regardless of ad status
      triggerHaptic("success");
      router.push(`/results/${attemptId}`);
    } catch (err: any) {
      alert(err.message || "Submission failed. Please try again.");
      setIsSubmitting(false);
      setSubmittingStatus("Evaluating...");
    }
  };

  // Palette counts
  const answeredCount = Object.values(userAnswers).filter(
    (a) => a.selectedOption !== null
  ).length;
  const flaggedCount = Object.values(userAnswers).filter(
    (a) => a.isFlagged
  ).length;
  const unansweredCount = questions.length - answeredCount;

  // Detect True/False options vs 4-option MCQ
  const getAvailableOptions = (q: SanitizedQuestion): ("A" | "B" | "C" | "D")[] => {
    const isTF =
      q.question_type === "True/False" ||
      (!q.option_c_en?.trim() && !q.option_c_hi?.trim());
    return isTF ? ["A", "B"] : ["A", "B", "C", "D"];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Preparing Your Test Session...
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Loading official questions and synchronizing exam timer.
        </p>
      </div>
    );
  }

  if (error || !currentQ) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-500 mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Unable to Start Exam
        </h3>
        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 max-w-xs mb-4">
          {error || "Question set could not be loaded."}
        </p>
        <button
          onClick={() => router.back()}
          className="bg-primary-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isTimerCritical = timeLeft < 5 * 60;
  const availableOptions = getAvailableOptions(currentQ);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col justify-between max-w-md mx-auto">
      {/* 1. Exam Header Bar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#0e1222]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3 flex items-center justify-between">
        {/* Left: Palette Trigger */}
        <button
          onClick={() => setIsPaletteOpen(true)}
          className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl text-sm font-bold active:scale-95 transition-transform cursor-pointer"
        >
          <Layers className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <span>
            {currentIndex + 1}/{questions.length}
          </span>
        </button>

        {/* Center: Live Countdown Timer */}
        <div
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-mono font-bold tracking-wider ${
            isTimerCritical
              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 animate-pulse border border-rose-300"
              : "bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{formatTimer(timeLeft)}</span>
        </div>

        {/* Right: Language Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setLanguageMode("en")}
            className={`px-2 py-1 rounded-lg ${
              languageMode === "en"
                ? "bg-white dark:bg-slate-700 text-primary-600 font-bold shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguageMode("hi")}
            className={`px-2 py-1 rounded-lg ${
              languageMode === "hi"
                ? "bg-white dark:bg-slate-700 text-primary-600 font-bold shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            HI
          </button>
          <button
            onClick={() => setLanguageMode("both")}
            className={`px-2 py-1 rounded-lg ${
              languageMode === "both"
                ? "bg-white dark:bg-slate-700 text-primary-600 font-bold shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Both
          </button>
        </div>
      </div>

      {/* 2. Main Question Card Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Question Metadata Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 border border-primary-200/60 dark:border-primary-800/60 px-3 py-1 rounded-lg">
              Question {currentIndex + 1}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getDifficultyColor(
                currentQ.difficulty
              )}`}
            >
              {currentQ.difficulty}
            </span>
          </div>

          {/* Mark for Review Button */}
          <button
            onClick={handleToggleFlag}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
              currentAns?.isFlagged
                ? "bg-rose-500 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <Flag className="w-4 h-4 fill-current" />
            <span>{currentAns?.isFlagged ? "Marked" : "Review"}</span>
          </button>
        </div>

        {/* Question Text */}
        <div className="bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs space-y-3">
          {(languageMode === "en" || languageMode === "both") && (
            <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-relaxed tracking-normal">
              {currentQ.question_en}
            </p>
          )}

          {languageMode === "both" && currentQ.question_hi && (
            <hr className="border-slate-100 dark:border-slate-800" />
          )}

          {(languageMode === "hi" || languageMode === "both") &&
            currentQ.question_hi && (
              <p className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-200 leading-relaxed font-sans tracking-normal">
                {currentQ.question_hi}
              </p>
            )}
        </div>

        {/* Options Selector */}
        <div className="space-y-3">
          {availableOptions.map((optKey) => {
            const isSelected = currentAns?.selectedOption === optKey;
            const optEn = (currentQ as any)[`option_${optKey.toLowerCase()}_en`];
            const optHi = (currentQ as any)[`option_${optKey.toLowerCase()}_hi`];

            return (
              <button
                key={optKey}
                onClick={() => handleSelectOption(optKey)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                  isSelected
                    ? "bg-primary-50 dark:bg-primary-950/60 border-primary-500 dark:border-primary-400 shadow-sm ring-2 ring-primary-500/20"
                    : "bg-white dark:bg-[#121626] border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? "bg-primary-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {optKey}
                </div>

                <div className="flex-1 space-y-1.5 min-w-0 pt-0.5">
                  {(languageMode === "en" || languageMode === "both") && optEn && (
                    <div
                      className={`text-sm sm:text-[15px] font-semibold leading-relaxed ${
                        isSelected
                          ? "text-primary-950 dark:text-primary-100"
                          : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {optEn}
                    </div>
                  )}
                  {(languageMode === "hi" || languageMode === "both") && optHi && (
                    <div
                      className={`text-sm sm:text-[15px] font-medium leading-relaxed font-sans ${
                        isSelected
                          ? "text-primary-900 dark:text-primary-200"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {optHi}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Clear Response Action */}
        {currentAns?.selectedOption && (
          <div className="text-right pt-1">
            <button
              onClick={handleClearResponse}
              className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 hover:text-rose-500 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear selection</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Bottom Action Bar */}
      <div className="sticky bottom-0 z-30 bg-white/95 dark:bg-[#0e1222]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 p-3.5 safe-bottom">
        <div className="flex items-center justify-between gap-2.5">
          {/* Previous Question */}
          <button
            onClick={() => handleNavigate(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          {/* Submit Test Trigger */}
          <button
            onClick={openSubmitModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Submit</span>
          </button>

          {/* Next Question */}
          <button
            onClick={() => {
              if (currentIndex < questions.length - 1) {
                handleNavigate(currentIndex + 1);
              } else {
                openSubmitModal();
              }
            }}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer"
          >
            <span>
              {currentIndex < questions.length - 1 ? "Next" : "Finish"}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Question Palette Slide-up Drawer */}
      {isPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white dark:bg-[#101424] rounded-t-3xl p-5 max-h-[80vh] flex flex-col space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Question Palette
                </h3>
                <p className="text-xs text-slate-500">
                  Quick jump to any question
                </p>
              </div>
              <button
                onClick={() => setIsPaletteOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary Legend */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2.5 rounded-xl text-emerald-700 dark:text-emerald-400 font-bold">
                {answeredCount} Answered
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-2.5 rounded-xl text-rose-700 dark:text-rose-400 font-bold">
                {flaggedCount} Marked
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl text-slate-600 dark:text-slate-400 font-bold">
                {unansweredCount} Left
              </div>
            </div>

            {/* Palette Grid */}
            <div className="flex-1 overflow-y-auto max-h-72 grid grid-cols-5 gap-2.5 pr-1">
              {questions.map((q, idx) => {
                const ans = userAnswers[q.id];
                const isCurrent = idx === currentIndex;
                const isAnswered = ans?.selectedOption !== null;
                const isFlagged = ans?.isFlagged;

                let cellBg =
                  "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
                if (isCurrent) {
                  cellBg =
                    "border-2 border-primary-600 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 font-bold";
                } else if (isFlagged && isAnswered) {
                  cellBg = "bg-purple-600 text-white font-bold";
                } else if (isFlagged) {
                  cellBg = "bg-rose-500 text-white font-bold";
                } else if (isAnswered) {
                  cellBg = "bg-emerald-500 text-white font-bold";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => handleNavigate(idx)}
                    className={`h-12 rounded-xl text-sm font-bold flex items-center justify-center transition-all cursor-pointer ${cellBg}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121626] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Submit Test Attempt?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Once submitted, your answers will be evaluated against official answer keys.
              </p>
            </div>

            {/* Quick Stats Summary */}
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 grid grid-cols-2 gap-2 text-center text-xs">
              <div>
                <span className="text-slate-400">Attempted:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {answeredCount}/{questions.length}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Unanswered:</span>
                <p className="font-bold text-amber-600">
                  {unansweredCount} Qs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold disabled:opacity-50"
              >
                Continue Test
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{submittingStatus}</span>
                  </>
                ) : (
                  <span>Submit Now</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121626] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Leave Active Test?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your answers up to this point are saved on the server. You can submit now or abandon.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => setShowExitModal(false)}
                className="w-full py-2.5 rounded-xl bg-primary-600 text-white text-xs font-bold"
              >
                Resume Test
              </button>
              <button
                onClick={handleFinalSubmit}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Submit Current Answers
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full py-2 rounded-xl text-slate-500 text-xs font-semibold hover:text-slate-800"
              >
                Exit without Submitting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
