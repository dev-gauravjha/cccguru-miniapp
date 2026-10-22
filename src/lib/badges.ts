export interface BadgeItem {
  id: string;
  title: string;
  level: string;
  category: "tests" | "streak" | "points" | "solver" | "accuracy";
  categoryLabel: string;
  desc: string;
  emoji: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  isUnlocked: boolean;
  progressPercent: number;
}

export interface PlayerStatsForBadges {
  testsTaken: number;
  totalPoints: number;
  dayStreak: number;
  totalQuestionsSolved: number;
  avgAccuracy: number;
}

export function getPlayerBadges(stats: PlayerStatsForBadges): BadgeItem[] {
  const tests = stats.testsTaken || 0;
  const points = stats.totalPoints || 0;
  const streak = stats.dayStreak || 0;
  const solved = stats.totalQuestionsSolved || 0;
  const accuracy = stats.avgAccuracy || 0;

  const rawBadges = [
    // 1. Mock Test Milestones
    {
      id: "first_blood",
      title: "First Step",
      level: "Level 1",
      category: "tests" as const,
      categoryLabel: "Mock Tests",
      desc: "Completed your first mock test attempt",
      emoji: "🎯",
      currentValue: tests,
      targetValue: 1,
      unit: "test",
      isUnlocked: tests >= 1,
    },
    {
      id: "scholar_5_tests",
      title: "Dedicated Scholar",
      level: "Level 2",
      category: "tests" as const,
      categoryLabel: "Mock Tests",
      desc: "Complete 5 full test attempts",
      emoji: "⚡",
      currentValue: tests,
      targetValue: 5,
      unit: "tests",
      isUnlocked: tests >= 5,
    },
    {
      id: "exam_veteran",
      title: "Exam Veteran",
      level: "Level 3",
      category: "tests" as const,
      categoryLabel: "Mock Tests",
      desc: "Complete 10 mock test sessions",
      emoji: "🎖️",
      currentValue: tests,
      targetValue: 10,
      unit: "tests",
      isUnlocked: tests >= 10,
    },
    {
      id: "grand_tester",
      title: "CCC Grandmaster",
      level: "Level 4",
      category: "tests" as const,
      categoryLabel: "Mock Tests",
      desc: "Complete 25 comprehensive tests",
      emoji: "👑",
      currentValue: tests,
      targetValue: 25,
      unit: "tests",
      isUnlocked: tests >= 25,
    },

    // 2. Streaks
    {
      id: "spark_streak",
      title: "Spark Streak",
      level: "Streak L1",
      category: "streak" as const,
      categoryLabel: "Daily Streaks",
      desc: "Maintain a 3-day continuous learning streak",
      emoji: "🔥",
      currentValue: streak,
      targetValue: 3,
      unit: "days",
      isUnlocked: streak >= 3,
    },
    {
      id: "week_warrior",
      title: "Week Warrior",
      level: "Streak L2",
      category: "streak" as const,
      categoryLabel: "Daily Streaks",
      desc: "Maintain a 7-day continuous learning streak",
      emoji: "🛡️",
      currentValue: streak,
      targetValue: 7,
      unit: "days",
      isUnlocked: streak >= 7,
    },
    {
      id: "fortnight_streak",
      title: "Streak Champion",
      level: "Streak L3",
      category: "streak" as const,
      categoryLabel: "Daily Streaks",
      desc: "Maintain a 14-day persistent learning streak",
      emoji: "🌟",
      currentValue: streak,
      targetValue: 14,
      unit: "days",
      isUnlocked: streak >= 14,
    },

    // 3. Points
    {
      id: "point_pioneer",
      title: "Point Pioneer",
      level: "Points L1",
      category: "points" as const,
      categoryLabel: "Scoreboard Points",
      desc: "Earn 50 verified points on national scoreboard",
      emoji: "⭐",
      currentValue: points,
      targetValue: 50,
      unit: "pts",
      isUnlocked: points >= 50,
    },
    {
      id: "point_century",
      title: "Century Club",
      level: "Points L2",
      category: "points" as const,
      categoryLabel: "Scoreboard Points",
      desc: "Earn 100 verified points across tests",
      emoji: "💎",
      currentValue: points,
      targetValue: 100,
      unit: "pts",
      isUnlocked: points >= 100,
    },

    // 4. Questions Solved
    {
      id: "centurion_solver",
      title: "Centurion Solver",
      level: "Solver L1",
      category: "solver" as const,
      categoryLabel: "Questions Solved",
      desc: "Solve 100+ questions across mock tests & quizzes",
      emoji: "⚔️",
      currentValue: solved,
      targetValue: 100,
      unit: "Qs",
      isUnlocked: solved >= 100,
    },
    {
      id: "question_crusher",
      title: "Question Crusher",
      level: "Solver L2",
      category: "solver" as const,
      categoryLabel: "Questions Solved",
      desc: "Solve 250+ questions across CCC syllabus",
      emoji: "🚀",
      currentValue: solved,
      targetValue: 250,
      unit: "Qs",
      isUnlocked: solved >= 250,
    },

    // 5. Accuracy & Precision
    {
      id: "sharpshooter",
      title: "Sharpshooter",
      level: "Accuracy L1",
      category: "accuracy" as const,
      categoryLabel: "Precision & Accuracy",
      desc: "Achieve 60%+ average test accuracy",
      emoji: "🏹",
      currentValue: accuracy,
      targetValue: 60,
      unit: "%",
      isUnlocked: accuracy >= 60,
    },
    {
      id: "bullseye",
      title: "Bullseye Master",
      level: "Accuracy L2",
      category: "accuracy" as const,
      categoryLabel: "Precision & Accuracy",
      desc: "Achieve 80%+ average test accuracy",
      emoji: "🎯",
      currentValue: accuracy,
      targetValue: 80,
      unit: "%",
      isUnlocked: accuracy >= 80,
    },
  ];

  return rawBadges.map((b) => ({
    ...b,
    progressPercent: Math.min(
      100,
      Math.round((Math.max(0, b.currentValue) / b.targetValue) * 100)
    ),
  }));
}
