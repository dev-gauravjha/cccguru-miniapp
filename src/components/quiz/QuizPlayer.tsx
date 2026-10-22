"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Flame,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Globe2,
  Loader2,
  AlertCircle,
  HelpCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTelegram } from "@/components/providers/TelegramProvider";
import { ConfettiEffects } from "@/components/quiz/ConfettiEffects";
import { fireCorrectAnswerConfetti } from "@/lib/confetti";
import { QuizCompletion } from "@/components/quiz/QuizCompletion";
import type { SanitizedQuizQuestion } from "@/lib/quiz-engine";
import {
  playCorrectSound,
  playWrongSound,
  playFinishSound,
  isSoundEnabled,
  setSoundEnabled,
} from "@/lib/quiz-sounds";
import {
  getSavedLanguage,
  setSavedLanguage,
  type LanguageMode,
} from "@/lib/language";

interface QuizPlayerProps {
  quizId: string;
}

interface AnswerFeedback {
  isCorrect: boolean;
  correctOption: string;
  explanationEn: string;
  explanationHi: string;
  bilingual?: {
    en: { explanation: string };
    hi: { explanation: string };
  };
  pointsEarned: number;
}

export function QuizPlayer({ quizId }: QuizPlayerProps) {
  const router = useRouter();
  const { triggerHaptic } = useTelegram();

  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [attemptId, setAttemptId] = useState<string>("");
  const [title, setTitle] = useState<string>("CCC Quiz");
  const [questions, setQuestions] = useState<SanitizedQuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [languageMode, setLanguageMode] = useState<LanguageMode>("hi");
  const [soundOn, setSoundOn] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);

  // Sync sound and language preference on mount
  useEffect(() => {
    setSoundOn(isSoundEnabled());
    setLanguageMode(getSavedLanguage());

    const handleLangChange = (e: any) => {
      if (e.detail) setLanguageMode(e.detail);
    };
    window.addEventListener("ccc_language_changed", handleLangChange);
    return () => {
      window.removeEventListener("ccc_language_changed", handleLangChange);
    };
  }, []);


  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [showParticles, setShowParticles] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Completion State
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);

  const isAnsweringRef = useRef(false);

  // Initialize Quiz Session dynamically from Supabase
  const initQuiz = useCallback(async () => {
    setIsLoading(true);
    setIsEmpty(false);
    setError(null);
    setSelectedOption(null);
    setFeedback(null);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setIsCompleted(false);

    try {
      const res = await fetch("/api/quiz/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testItemId: quizId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not start quiz session.");
      }

      if (data.empty || !data.questions || data.questions.length === 0) {
        setIsEmpty(true);
        setEmptyMessage(data.message || "No questions available for this quiz in the database.");
        setTitle(data.title || "CCC Quiz");
        return;
      }

      setAttemptId(data.attemptId);
      setTitle(data.title || "CCC Quiz Sprint");
      setQuestions(data.questions || []);
    } catch (err: any) {
      setError(err.message || "Failed to initialize quiz.");
    } finally {
      setIsLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    initQuiz();
  }, [initQuiz]);

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;

  // Handle Option Selection with Instant Feedback
  const handleSelectOption = async (optionKey: "A" | "B" | "C" | "D") => {
    if (selectedOption || isEvaluating || feedback || !currentQ || isAnsweringRef.current) {
      return;
    }

    isAnsweringRef.current = true;
    setSelectedOption(optionKey);
    setIsEvaluating(true);
    triggerHaptic("selection");

    try {
      const res = await fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          questionId: currentQ.id,
          selectedOption: optionKey,
        }),
      });

      if (!res.ok) throw new Error("Failed to evaluate answer");
      const data = await res.json();

      setFeedback({
        isCorrect: data.isCorrect,
        correctOption: data.correctOption,
        explanationEn: data.explanationEn,
        explanationHi: data.explanationHi,
        bilingual: data.bilingual,
        pointsEarned: data.pointsEarned || 0,
      });

      setStreak(data.streak || 0);
      setScore(data.currentScore || (data.isCorrect ? score + 1 : score));

      if (data.isCorrect) {
        triggerHaptic("success");
        playCorrectSound(data.streak || 0);
        fireCorrectAnswerConfetti({ streak: data.streak || 0 });
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 1200);
      } else {
        triggerHaptic("warning");
        playWrongSound();
      }
    } catch {
      // In case of network error, unlock so user can retry
      setSelectedOption(null);
    } finally {
      setIsEvaluating(false);
      isAnsweringRef.current = false;
    }
  };


  // Continue to Next Question or Finish Quiz
  const handleContinue = async () => {
    if (!feedback) return;
    triggerHaptic("selection");

    if (currentIndex + 1 < totalQuestions) {
      // Move to next question
      setSelectedOption(null);
      setFeedback(null);
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Finalize Quiz
      setIsEvaluating(true);
      try {
        const res = await fetch("/api/quiz/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId }),
        });

        const data = await res.json();
        setCompletionData(data);
        if (data.isPassed) {
          playFinishSound();
        }
        setIsCompleted(true);
      } catch {
        // Fallback local completion
        setIsCompleted(true);
      } finally {
        setIsEvaluating(false);
      }
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Preparing Your Quiz Sprint...
        </h3>
        <p className="text-xs text-slate-400">Loading certified NIELIT questions</p>
      </div>
    );
  }

  // Requirement 7: Dedicated Empty State when no questions are linked
  if (isEmpty) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto shadow-sm">
          <HelpCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 max-w-xs mx-auto">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            No Questions Available
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {emptyMessage || "There are currently no questions linked to this quiz in the database. Please check back later."}
          </p>
        </div>
        <button
          onClick={() => router.push("/quiz")}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-md border-b-4 border-primary-800"
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  if (error || !currentQ) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Quiz Loading Error
        </h3>
        <p className="text-xs text-slate-400">{error || "No questions found."}</p>
        <button
          onClick={initQuiz}
          className="px-5 py-2.5 bg-primary-600 text-white rounded-2xl text-xs font-bold active:scale-95 transition-all shadow-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <QuizCompletion
        score={completionData?.score ?? score}
        totalQuestions={totalQuestions}
        accuracy={completionData?.accuracy ?? Math.round((score / totalQuestions) * 100)}
        isPassed={completionData?.isPassed ?? score / totalQuestions >= 0.5}
        pointsAwarded={completionData?.pointsAwarded ?? (score / totalQuestions >= 0.5 ? score : 0)}
        bestStreak={completionData?.bestStreak ?? streak}
        title={title}
        onPlayAgain={initQuiz}
      />
    );
  }

  // Calculate Progress percentage
  const progressPercent = Math.min(
    100,
    Math.round(((currentIndex + (feedback ? 1 : 0)) / totalQuestions) * 100)
  );

  // Language extraction
  const isHindiOnly = languageMode === "hi";
  const isEnglishOnly = languageMode === "en";
  const isBilingual = languageMode === "bilingual";

  const questionEn =
    currentQ?.bilingual?.en?.question || currentQ?.question_en || "";
  const questionHi =
    currentQ?.bilingual?.hi?.question || currentQ?.question_hi || "";

  // The primary question according to user's saved preference
  const primaryQuestionText = isHindiOnly
    ? questionHi || questionEn
    : isEnglishOnly
    ? questionEn || questionHi
    : questionEn || questionHi;

  // Secondary question only rendered when mode is explicitly 'bilingual'
  const bilingualSecondaryQuestionText = isBilingual
    ? questionHi && questionHi !== primaryQuestionText
      ? questionHi
      : null
    : null;

  // Options extraction
  const getOption = (key: "A" | "B" | "C" | "D") => {
    if (!currentQ) return { primary: "", secondary: "" };
    const en =
      currentQ.bilingual?.en?.options?.[key] ||
      (currentQ as any)[`option_${key.toLowerCase()}_en`] ||
      "";
    const hi =
      currentQ.bilingual?.hi?.options?.[key] ||
      (currentQ as any)[`option_${key.toLowerCase()}_hi`] ||
      "";

    if (isHindiOnly) {
      return { primary: hi || en, secondary: "" };
    }
    if (isEnglishOnly) {
      return { primary: en || hi, secondary: "" };
    }
    // Bilingual mode: primary English, secondary Hindi (if different)
    return {
      primary: en || hi,
      secondary: hi && hi !== en ? hi : "",
    };
  };

  const options = currentQ
    ? (["A", "B", "C", "D"] as const)
        .map((k) => ({ key: k, ...getOption(k) }))
        .filter((opt) => Boolean(opt.primary && opt.primary.trim().length > 0))
    : [];

  return (
    <div className="min-h-[92vh] flex flex-col justify-between max-w-md mx-auto w-full px-4 pt-3 pb-6 relative">
      <ConfettiEffects active={showParticles} streak={streak} />

      {/* Top Header: Close, Progress Bar, Streak, Language Selector */}
      <div className="space-y-3 shrink-0">
        <div className="flex items-center justify-between gap-2.5">
          {/* Close button */}
          <button
            onClick={() => setShowExitConfirm(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            aria-label="Exit Quiz"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Smooth Duolingo Progress Bar */}
          <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Streak Flame */}
          <div
            className={`flex items-center gap-1 font-black text-xs px-2 py-1 rounded-full border transition-all ${
              streak >= 2
                ? "bg-orange-500/15 border-orange-500/40 text-orange-500 animate-flame"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
            }`}
          >
            <Flame
              className={`w-3.5 h-3.5 ${streak >= 2 ? "fill-orange-500 text-orange-500" : ""}`}
            />
            <span>{streak}</span>
          </div>

          {/* 3-way Language Selector (EN | HI | Both) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={() => {
                triggerHaptic("selection");
                setLanguageMode("en");
                setSavedLanguage("en");
              }}
              className={`px-1.5 py-0.5 rounded-lg transition-all ${
                languageMode === "en"
                  ? "bg-primary-600 text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="English only"
            >
              EN
            </button>
            <button
              onClick={() => {
                triggerHaptic("selection");
                setLanguageMode("hi");
                setSavedLanguage("hi");
              }}
              className={`px-1.5 py-0.5 rounded-lg transition-all ${
                languageMode === "hi"
                  ? "bg-primary-600 text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="हिंदी"
            >
              HI
            </button>
            <button
              onClick={() => {
                triggerHaptic("selection");
                setLanguageMode("bilingual");
                setSavedLanguage("bilingual");
              }}
              className={`px-1.5 py-0.5 rounded-lg transition-all ${
                languageMode === "bilingual"
                  ? "bg-primary-600 text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Bilingual / Both"
            >
              Both
            </button>
          </div>

          {/* Sound Toggle (Mute / Unmute) */}
          <button
            onClick={() => {
              triggerHaptic("selection");
              const next = !soundOn;
              setSoundOn(next);
              setSoundEnabled(next);
            }}
            className="w-7 h-7 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all shrink-0"
            aria-label={soundOn ? "Mute quiz audio" : "Unmute quiz audio"}
            title={soundOn ? "Mute quiz audio" : "Unmute quiz audio"}
          >
            {soundOn ? (
              <Volume2 className="w-3.5 h-3.5 text-primary-500" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>

        {/* Question Counter Pill */}
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
          <span className="uppercase tracking-wider">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span className="bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px]">
            {currentQ.difficulty || "CCC"}
          </span>
        </div>
      </div>

      {/* Center: Question Prompt */}
      <div className="my-auto py-4 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 key={currentQ.id}">
        <div className="bg-white dark:bg-[#121626] border-2 border-slate-200 dark:border-slate-800 border-b-4 rounded-3xl p-5 shadow-xs">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-relaxed">
            {primaryQuestionText}
          </h2>
          {bilingualSecondaryQuestionText && (
            <div className="pt-2 mt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                {bilingualSecondaryQuestionText}
              </p>
            </div>
          )}
        </div>

        {/* 4 Tactile Option Cards */}
        <div className="space-y-2.5">
          {options.map((opt) => {
            const isSelected = selectedOption === opt.key;
            const isCorrectAnswer = feedback?.correctOption === opt.key;

            let cardStyle =
              "bg-white dark:bg-[#121626] border-2 border-slate-200 dark:border-slate-800 border-b-4 text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700";
            let pillStyle = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";

            if (feedback) {
              if (isSelected && feedback.isCorrect) {
                // User picked correct
                cardStyle =
                  "bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 border-b-4 text-emerald-900 dark:text-emerald-100 animate-pop ring-2 ring-emerald-500/20";
                pillStyle = "bg-emerald-500 text-white";
              } else if (isSelected && !feedback.isCorrect) {
                // User picked wrong
                cardStyle =
                  "bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 border-b-4 text-rose-900 dark:text-rose-100 animate-shake ring-2 ring-rose-500/20";
                pillStyle = "bg-rose-500 text-white";
              } else if (isCorrectAnswer) {
                // Reveal correct option
                cardStyle =
                  "bg-emerald-50/50 dark:bg-emerald-950/30 border-2 border-emerald-500/70 border-b-4 text-emerald-800 dark:text-emerald-200";
                pillStyle = "bg-emerald-600 text-white";
              } else {
                // Other options disabled
                cardStyle =
                  "bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 border-b-2 text-slate-400 opacity-60";
              }
            } else if (isSelected) {
              cardStyle =
                "bg-primary-50 dark:bg-primary-950/40 border-2 border-primary-500 border-b-4 text-primary-900 dark:text-primary-100";
              pillStyle = "bg-primary-600 text-white";
            }

            return (
              <button
                key={opt.key}
                onClick={() => handleSelectOption(opt.key)}
                disabled={Boolean(selectedOption) || isEvaluating}
                className={`w-full rounded-2xl p-3.5 flex items-center gap-3 text-left transition-all btn-3d ${cardStyle}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 transition-colors ${pillStyle}`}
                >
                  {opt.key}
                </div>
                <div className="flex-1 text-xs font-bold leading-snug">
                  <div>{opt.primary}</div>
                  {opt.secondary && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-sans mt-0.5">
                      {opt.secondary}
                    </div>
                  )}
                </div>
                {feedback && isSelected && feedback.isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 animate-pop" />
                )}
                {feedback && isSelected && !feedback.isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                {feedback && !isSelected && isCorrectAnswer && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Feedback Sheet (Slides up as soon as option is clicked) */}
      {feedback && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-40 p-4 border-t-2 shadow-2xl animate-slide-up backdrop-blur-md safe-bottom ${
            feedback.isCorrect
              ? "bg-emerald-100/95 dark:bg-[#071f15]/95 border-emerald-400 dark:border-emerald-700"
              : "bg-rose-100/95 dark:bg-[#20090e]/95 border-rose-400 dark:border-rose-700"
          }`}
        >
          <div className="max-w-md mx-auto space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md ${
                    feedback.isCorrect ? "bg-emerald-600" : "bg-rose-600"
                  }`}
                >
                  {feedback.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4
                    className={`text-sm font-black ${
                      feedback.isCorrect
                        ? "text-emerald-900 dark:text-emerald-200"
                        : "text-rose-900 dark:text-rose-200"
                    }`}
                  >
                    {feedback.isCorrect
                      ? "Nicely done! 🎉"
                      : `Correct Answer: Option ${feedback.correctOption}`}
                  </h4>
                  {isBilingual ? (
                    <div className="mt-0.5 space-y-0.5">
                      {(feedback.bilingual?.en?.explanation || feedback.explanationEn) && (
                        <p className="text-xs leading-relaxed font-medium text-slate-800 dark:text-slate-200">
                          {feedback.bilingual?.en?.explanation || feedback.explanationEn}
                        </p>
                      )}
                      {(feedback.bilingual?.hi?.explanation || feedback.explanationHi) && (
                        <p className="text-xs leading-relaxed font-medium text-slate-700 dark:text-slate-300 font-sans">
                          {feedback.bilingual?.hi?.explanation || feedback.explanationHi}
                        </p>
                      )}
                    </div>
                  ) : isHindiOnly ? (
                    <p className="text-xs mt-0.5 leading-relaxed font-medium text-slate-800 dark:text-slate-200">
                      {feedback.bilingual?.hi?.explanation ||
                        feedback.explanationHi ||
                        feedback.bilingual?.en?.explanation ||
                        feedback.explanationEn}
                    </p>
                  ) : (
                    <p className="text-xs mt-0.5 leading-relaxed font-medium text-slate-800 dark:text-slate-200">
                      {feedback.bilingual?.en?.explanation ||
                        feedback.explanationEn ||
                        feedback.bilingual?.hi?.explanation ||
                        feedback.explanationHi}
                    </p>
                  )}
                </div>
              </div>


              {feedback.isCorrect && (
                <div className="shrink-0 bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+1 Pt</span>
                </div>
              )}
            </div>

            {/* Tactile Duolingo "Continue" Button */}
            <button
              onClick={handleContinue}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm uppercase tracking-wider text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                feedback.isCorrect
                  ? "bg-emerald-600 hover:bg-emerald-500 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 shadow-emerald-600/30"
                  : "bg-rose-600 hover:bg-rose-500 border-b-4 border-rose-800 active:border-b-0 active:translate-y-1 shadow-rose-600/30"
              }`}
            >
              <span>{currentIndex + 1 < totalQuestions ? "Continue" : "View Results"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-xs w-full text-center space-y-4 shadow-2xl animate-pop">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Quit Quiz Session?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your progress in this 10-question sprint will not be counted.
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-3 bg-primary-600 text-white rounded-2xl font-extrabold text-xs shadow-md border-b-4 border-primary-800 active:border-b-0 active:translate-y-1"
              >
                Keep Playing
              </button>
              <button
                onClick={() => router.push("/quiz")}
                className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
              >
                Quit Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
