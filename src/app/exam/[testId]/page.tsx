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
  Volume2,
  VolumeX,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { useTelegram } from "@/components/providers/TelegramProvider";
import { formatTimer, getDifficultyColor } from "@/lib/utils";
import { showPostSubmissionAd, preloadMonetagAd } from "@/lib/monetag";
import {
  playTapSound,
  isSoundEnabled,
  setSoundEnabled,
} from "@/lib/quiz-sounds";
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
  const [submittingStatus, setSubmittingStatus] =
    useState<string>("Evaluating...");

  const [attemptId, setAttemptId] = useState<string>("");
  const [testItem, setTestItem] = useState<TestSeriesItem | null>(null);
  const [questions, setQuestions] = useState<SanitizedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sound toggle state
  const [soundOn, setSoundOn] = useState(true);

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

  // Initialize sound state from localStorage
  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playTapSound();
    triggerHaptic("selection");
  };

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
      if (
        data.testItem &&
        (data.testItem.test_type || data.testItem.type || "")
          .toLowerCase()
          .includes("quiz")
      ) {
        router.replace(`/quiz/${testId}`);
        return;
      }

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
  }, [testId, router]);

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
      timeSpentDelta: number,
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
    [attemptId],
  );

  const currentQ = questions[currentIndex];
  const currentAns = currentQ ? userAnswers[currentQ.id] : null;

  // Handle Option Selection
  const handleSelectOption = (option: "A" | "B" | "C" | "D") => {
    if (!currentQ) return;
    playTapSound();
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
    playTapSound();
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
    playTapSound();
    triggerHaptic("light");

    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        selectedOption: null,
        isFlagged: prev[currentQ.id]?.isFlagged || false,
        timeSpent: prev[currentQ.id]?.timeSpent || 0,
      },
    }));

    persistAnswerToServer(currentQ.id, null, currentAns?.isFlagged || false, 0);
  };

  // Navigation
  const handleNavigate = (index: number) => {
    if (index < 0 || index >= questions.length) return;
    playTapSound();
    triggerHaptic("selection");
    const elapsed = Math.floor((Date.now() - questionStartTime.current) / 1000);
    questionStartTime.current = Date.now();

    if (currentQ) {
      persistAnswerToServer(
        currentQ.id,
        currentAns?.selectedOption || null,
        currentAns?.isFlagged || false,
        elapsed,
      );
    }

    setCurrentIndex(index);
    setIsPaletteOpen(false);
  };

  // Open Submit Confirmation Modal & Preload Ad Creative
  const openSubmitModal = () => {
    playTapSound();
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: userAnswers }),
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
    (a) => a.selectedOption !== null,
  ).length;
  const flaggedCount = Object.values(userAnswers).filter(
    (a) => a.isFlagged,
  ).length;
  const unansweredCount = questions.length - answeredCount;

  // Detect True/False options vs 4-option MCQ
  const getAvailableOptions = (
    q: SanitizedQuestion,
  ): ("A" | "B" | "C" | "D")[] => {
    const isTF =
      q.question_type === "True/False" ||
      (!q.option_c_en?.trim() && !q.option_c_hi?.trim());
    return isTF ? ["A", "B"] : ["A", "B", "C", "D"];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-3xl bg-primary-100 dark:bg-primary-950 flex items-center justify-center border-2 border-primary-500/30 shadow-lg">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">
          Preparing Your Exam Challenge...
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
          Loading authentic questions and synchronizing exam countdown timer.
        </p>
      </div>
    );
  }

  if (error || !currentQ) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/70 border-2 border-rose-500/30 flex items-center justify-center text-rose-500 mb-4 shadow-lg">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
          Unable to Start Exam
        </h3>
        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 max-w-xs mb-4">
          {error || "Question set could not be loaded."}
        </p>
        <button
          onClick={() => router.back()}
          className="btn-3d btn-3d-primary px-5 py-2.5 rounded-2xl text-xs font-black shadow-md cursor-pointer"
        >
          Return to Tests
        </button>
      </div>
    );
  }

  const isTimerCritical = timeLeft < 5 * 60;
  const availableOptions = getAvailableOptions(currentQ);

  return (
    <div className="h-screen h-[100dvh] max-h-[100dvh] bg-slate-50 dark:bg-[#090b14] flex flex-col max-w-md mx-auto relative select-none overflow-hidden">
      {/* 1. Gamified Header Bar */}
      <div className="shrink-0 z-30 bg-white/95 dark:bg-[#0e1222]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-xs">
        {/* Question Map Trigger (Tactile 3D button) */}
        <button
          onClick={() => {
            playTapSound();
            setIsPaletteOpen(true);
          }}
          className="btn-3d btn-3d-slate flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer"
          title="Open Question Map"
        >
          <Layers className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
          <span>
            Q {currentIndex + 1}/{questions.length}
          </span>
        </button>

        {/* Center: Live Countdown Timer */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black tracking-wider transition-all ${
            isTimerCritical
              ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 animate-pulse border-2 border-rose-400 shadow-sm"
              : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTimer(timeLeft)}</span>
        </div>

        {/* Right Action Group: Sound Toggle & Language Switcher */}
        <div className="flex items-center gap-1.5">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
              soundOn
                ? "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
            }`}
            title={soundOn ? "Mute Sound" : "Enable Sound"}
          >
            {soundOn ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl text-[11px] font-bold border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => {
                playTapSound();
                setLanguageMode("en");
              }}
              className={`px-1.5 py-0.5 rounded-lg transition-all ${
                languageMode === "en"
                  ? "bg-primary-600 text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => {
                playTapSound();
                setLanguageMode("hi");
              }}
              className={`px-1.5 py-0.5 rounded-lg transition-all ${
                languageMode === "hi"
                  ? "bg-primary-600 text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              HI
            </button>
            <button
              onClick={() => {
                playTapSound();
                setLanguageMode("both");
              }}
              className={`px-1.5 py-0.5 rounded-lg transition-all ${
                languageMode === "both"
                  ? "bg-primary-600 text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Both
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Question & Options Area (Scrollable according to content) */}
      <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3 overscroll-contain">
        {/* Question Metadata Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-tight text-primary-700 dark:text-primary-300 bg-primary-100/70 dark:bg-primary-950/70 border border-primary-300/70 dark:border-primary-800 px-2.5 py-1 rounded-xl">
              Question {currentIndex + 1}
            </span>
            <span
              className={`text-[11px] font-extrabold px-2 py-0.5 rounded-xl border ${getDifficultyColor(
                currentQ.difficulty,
              )}`}
            >
              {currentQ.difficulty || "Medium"} • +100 XP
            </span>
          </div>

          {/* Mark for Review 3D Button */}
          <button
            onClick={handleToggleFlag}
            className={`btn-3d flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-black cursor-pointer transition-all ${
              currentAns?.isFlagged
                ? "btn-3d-rose text-white shadow-xs"
                : "btn-3d-slate text-slate-700 dark:text-slate-300"
            }`}
          >
            <Flag
              className={`w-3.5 h-3.5 ${
                currentAns?.isFlagged ? "fill-current" : ""
              }`}
            />
            <span>{currentAns?.isFlagged ? "Marked" : "Review"}</span>
          </button>
        </div>

        {/* Gamified Question Card (Raised 3D container) */}
        <div className="game-card p-5 space-y-3.5">
          {(languageMode === "en" || languageMode === "both") && (
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed tracking-normal">
              {currentQ.question_en}
            </p>
          )}

          {languageMode === "both" && currentQ.question_hi && (
            <div className="border-t border-dashed border-slate-200 dark:border-slate-800 my-2" />
          )}

          {(languageMode === "hi" || languageMode === "both") &&
            currentQ.question_hi && (
              <p className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-200 leading-relaxed font-sans tracking-normal">
                {currentQ.question_hi}
              </p>
            )}
        </div>

        {/* Tactile 3D Options Selector */}
        <div className="space-y-3">
          {availableOptions.map((optKey) => {
            const isSelected = currentAns?.selectedOption === optKey;
            const optEn = (currentQ as any)[
              `option_${optKey.toLowerCase()}_en`
            ];
            const optHi = (currentQ as any)[
              `option_${optKey.toLowerCase()}_hi`
            ];

            return (
              <button
                key={optKey}
                onClick={() => handleSelectOption(optKey)}
                className={`relative w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-100 flex items-start gap-3.5 cursor-pointer user-select-none ${
                  isSelected
                    ? "bg-primary-50/90 dark:bg-primary-950/70 border-primary-500 dark:border-primary-400 border-b-4 border-b-primary-700 dark:border-b-primary-600 shadow-md shadow-primary-500/15 ring-2 ring-primary-500/20 active:translate-y-0.5 active:border-b-2"
                    : "bg-white dark:bg-[#121626] border-slate-200 dark:border-slate-800 border-b-4 border-b-slate-300 dark:border-b-slate-900 hover:border-slate-300 dark:hover:border-slate-700 active:translate-y-0.5 active:border-b-2"
                }`}
              >
                {/* 3D Option Key Pill */}
                <div
                  className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? "bg-primary-600 text-white shadow-xs border-b-2 border-primary-800 animate-pop"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700 border-b-2"
                  }`}
                >
                  {optKey}
                </div>

                <div className="flex-1 space-y-1 min-w-0 pt-0.5">
                  {(languageMode === "en" || languageMode === "both") &&
                    optEn && (
                      <div
                        className={`text-sm sm:text-[15px] font-bold leading-relaxed ${
                          isSelected
                            ? "text-primary-950 dark:text-primary-100"
                            : "text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {optEn}
                      </div>
                    )}
                  {(languageMode === "hi" || languageMode === "both") &&
                    optHi && (
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

                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 self-center animate-pop ml-auto" />
                )}
              </button>
            );
          })}
        </div>

        {/* Clear Selection Button */}
        {currentAns?.selectedOption && (
          <div className="text-right pt-1">
            <button
              onClick={handleClearResponse}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-500 font-extrabold inline-flex items-center gap-1.5 cursor-pointer bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Choice</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Fixed Bottom Action Dock */}
      <div className="shrink-0 z-30 bg-white/95 dark:bg-[#0e1222]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 p-3.5 safe-bottom shadow-lg">
        <div className="flex items-center justify-between gap-2.5">
          {/* Previous Question (3D Slate Button) */}
          <button
            onClick={() => handleNavigate(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="btn-3d btn-3d-slate flex-1 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          {/* Submit Test Trigger (3D Emerald Button) */}
          <button
            onClick={openSubmitModal}
            className="btn-3d btn-3d-emerald px-5 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Submit</span>
          </button>

          {/* Next Question / Finish (3D Primary Button) */}
          <button
            onClick={() => {
              if (currentIndex < questions.length - 1) {
                handleNavigate(currentIndex + 1);
              } else {
                openSubmitModal();
              }
            }}
            className="btn-3d btn-3d-primary flex-1 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-md shadow-primary-600/20 cursor-pointer"
          >
            <span>
              {currentIndex < questions.length - 1 ? "Next" : "Finish"}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Gamified Question Map Slide-up Drawer */}
      {isPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white dark:bg-[#101424] rounded-t-3xl p-5 max-h-[82vh] flex flex-col space-y-4 shadow-2xl border-t-2 border-slate-200 dark:border-slate-800">
            {/* Drawer Handle */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto -mt-1" />

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary-500" />
                  <span>Question Map 🗺️</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tap any node to jump instantly
                </p>
              </div>
              <button
                onClick={() => {
                  playTapSound();
                  setIsPaletteOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Gamified Summary Legend */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-400/80 border-b-4 border-b-emerald-600 text-emerald-800 dark:text-emerald-300 font-black p-2 rounded-2xl flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{answeredCount} Solved</span>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-400/80 border-b-4 border-b-rose-600 text-rose-800 dark:text-rose-300 font-black p-2 rounded-2xl flex items-center justify-center gap-1">
                <Flag className="w-3.5 h-3.5 fill-current" />
                <span>{flaggedCount} Marked</span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 border-b-4 border-b-slate-400 dark:border-b-slate-900 text-slate-700 dark:text-slate-300 font-black p-2 rounded-2xl flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{unansweredCount} Left</span>
              </div>
            </div>

            {/* Stepping Stone Question Grid */}
            <div className="flex-1 overflow-y-auto max-h-72 grid grid-cols-5 gap-2.5 pr-1 py-1">
              {questions.map((q, idx) => {
                const ans = userAnswers[q.id];
                const isCurrent = idx === currentIndex;
                const isAnswered = ans?.selectedOption !== null;
                const isFlagged = ans?.isFlagged;

                let cellStyle =
                  "btn-3d btn-3d-slate text-slate-700 dark:text-slate-300";
                if (isCurrent) {
                  cellStyle =
                    "btn-3d btn-3d-primary font-black ring-4 ring-primary-500/30 scale-105 z-10";
                } else if (isFlagged && isAnswered) {
                  cellStyle =
                    "btn-3d bg-purple-600 text-white border-b-4 border-b-purple-800 font-black shadow-sm";
                } else if (isFlagged) {
                  cellStyle = "btn-3d btn-3d-rose text-white font-black";
                } else if (isAnswered) {
                  cellStyle = "btn-3d btn-3d-emerald text-white font-black";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => handleNavigate(idx)}
                    className={`h-11 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center transition-all cursor-pointer ${cellStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Gamified Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="game-card bg-white dark:bg-[#121626] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border-2 border-slate-200 dark:border-slate-800 text-center animate-pop">
            <div className="w-14 h-14 rounded-3xl bg-emerald-100 dark:bg-emerald-950/70 border-2 border-emerald-400 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <Trophy className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Submit Test Attempt? 🏁
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Your answers will be evaluated with official CCC grading and XP
                points will be added to your profile!
              </p>
            </div>

            {/* Quick Stats Summary */}
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-white dark:bg-slate-800/80 p-2 rounded-xl">
                <span className="text-slate-400 text-[10px] block">
                  Attempted
                </span>
                <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  {answeredCount}/{questions.length}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800/80 p-2 rounded-xl">
                <span className="text-slate-400 text-[10px] block">
                  Unanswered
                </span>
                <p className="font-black text-amber-600 dark:text-amber-400 text-sm">
                  {unansweredCount} Qs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  playTapSound();
                  setShowSubmitModal(false);
                }}
                disabled={isSubmitting}
                className="btn-3d btn-3d-slate flex-1 py-3 rounded-2xl text-xs font-black disabled:opacity-50 cursor-pointer"
              >
                Continue Test
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="btn-3d btn-3d-emerald flex-1 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-60 cursor-pointer"
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

      {/* 6. Gamified Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="game-card bg-white dark:bg-[#121626] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border-2 border-slate-200 dark:border-slate-800 text-center animate-pop">
            <div className="w-14 h-14 rounded-3xl bg-amber-100 dark:bg-amber-950/70 border-2 border-amber-400 text-amber-600 flex items-center justify-center mx-auto shadow-md">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Leave Active Test?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Your answers are saved on the server. You can submit now to get
                graded or resume test.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => {
                  playTapSound();
                  setShowExitModal(false);
                }}
                className="btn-3d btn-3d-primary w-full py-3 rounded-2xl text-xs font-black cursor-pointer"
              >
                Resume Test
              </button>
              <button
                onClick={handleFinalSubmit}
                className="btn-3d btn-3d-emerald w-full py-3 rounded-2xl text-xs font-black cursor-pointer"
              >
                Submit Current Answers
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full py-2 rounded-xl text-slate-500 text-xs font-bold hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Exit to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
