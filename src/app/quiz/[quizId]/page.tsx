import { Metadata } from "next";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";

interface QuizPageProps {
  params: Promise<{ quizId: string }>;
}

export const metadata: Metadata = {
  title: "Interactive CCC Quiz Sprint | CCCGuru",
  description:
    "Duolingo-style fast-paced CCC quiz sprint with instant feedback, live explanations, and streak bonuses.",
};

export default async function ActiveQuizPage({ params }: QuizPageProps) {
  const { quizId } = await params;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b14] flex flex-col justify-between">
      <QuizPlayer quizId={quizId} />
    </div>
  );
}
