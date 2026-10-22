"use client";

import confetti from "canvas-confetti";

/**
 * Palette of vibrant, celebratory colors tuned for the dark/light theme
 */
const VIBRANT_COLORS = [
  "#10b981", // Emerald
  "#6366f1", // Indigo
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
];

const GOLDEN_STREAK_COLORS = [
  "#f59e0b", // Amber
  "#fbbf24", // Yellow
  "#d97706", // Dark Amber
  "#fef08a", // Light Gold
  "#ffffff", // Shimmer White
];

/**
 * Quick, satisfying burst when user picks a correct option.
 * Clean, non-distracting, high frame-rate physics.
 */
export function fireCorrectAnswerConfetti(options?: {
  x?: number;
  y?: number;
  streak?: number;
}) {
  if (typeof window === "undefined") return;

  const originX = options?.x ?? 0.5;
  const originY = options?.y ?? 0.65;
  const streak = options?.streak ?? 0;

  try {
    // 1. Standard snappy correct answer burst
    confetti({
      particleCount: 35,
      spread: 55,
      origin: { x: originX, y: originY },
      startVelocity: 28,
      ticks: 120,
      gravity: 1.1,
      decay: 0.92,
      scalar: 0.8,
      colors: VIBRANT_COLORS,
      disableForReducedMotion: true,
    });

    // 2. Extra gold star flare if user is on a hot streak (streak >= 3)
    if (streak >= 3) {
      setTimeout(() => {
        try {
          confetti({
            particleCount: 18,
            spread: 70,
            origin: { x: originX, y: originY - 0.05 },
            startVelocity: 22,
            ticks: 140,
            gravity: 0.9,
            shapes: ["star"],
            scalar: 1.1,
            colors: GOLDEN_STREAK_COLORS,
            disableForReducedMotion: true,
          });
        } catch {
          // ignore
        }
      }, 80);
    }
  } catch {
    // Ignore in unsupported environments
  }
}

/**
 * Magnificent multi-stage victory cannon for Quiz Completion and Passed Mock Tests!
 * Shoots from both lower corners inward, followed by a sparkling center starburst.
 */
export function fireVictoryCelebration() {
  if (typeof window === "undefined") return;

  try {
    // Left Cannon Shot
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0.05, y: 0.75 },
      startVelocity: 45,
      gravity: 1,
      decay: 0.91,
      scalar: 0.9,
      colors: VIBRANT_COLORS,
      disableForReducedMotion: true,
    });

    // Right Cannon Shot
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 0.95, y: 0.75 },
      startVelocity: 45,
      gravity: 1,
      decay: 0.91,
      scalar: 0.9,
      colors: VIBRANT_COLORS,
      disableForReducedMotion: true,
    });

    // Second wave: center fountain with shimmering stars & circles
    setTimeout(() => {
      try {
        confetti({
          particleCount: 45,
          spread: 90,
          origin: { x: 0.5, y: 0.55 },
          startVelocity: 35,
          gravity: 0.85,
          ticks: 180,
          scalar: 1,
          shapes: ["star", "circle"],
          colors: [...VIBRANT_COLORS, ...GOLDEN_STREAK_COLORS],
          disableForReducedMotion: true,
        });
      } catch {
        // ignore
      }
    }, 280);

    // Third trailing wave: gentle side bursts
    setTimeout(() => {
      try {
        confetti({
          particleCount: 25,
          angle: 70,
          spread: 45,
          origin: { x: 0.15, y: 0.8 },
          startVelocity: 35,
          colors: GOLDEN_STREAK_COLORS,
          disableForReducedMotion: true,
        });
        confetti({
          particleCount: 25,
          angle: 110,
          spread: 45,
          origin: { x: 0.85, y: 0.8 },
          startVelocity: 35,
          colors: GOLDEN_STREAK_COLORS,
          disableForReducedMotion: true,
        });
      } catch {
        // ignore
      }
    }, 600);
  } catch {
    // Ignore in unsupported environments
  }
}

/**
 * Dedicated progressive celebration confetti for 5 and 10+ streak milestones.
 */
export function fireStreakMilestoneConfetti(streak: number) {
  if (typeof window === "undefined") return;

  try {
    const isEpic = streak >= 10;

    if (isEpic) {
      // 10+ Streak: Epic Double Cannons + Golden Star Fountain
      confetti({
        particleCount: 50,
        angle: 65,
        spread: 60,
        origin: { x: 0.1, y: 0.7 },
        startVelocity: 45,
        colors: [...VIBRANT_COLORS, ...GOLDEN_STREAK_COLORS],
        disableForReducedMotion: true,
      });

      confetti({
        particleCount: 50,
        angle: 115,
        spread: 60,
        origin: { x: 0.9, y: 0.7 },
        startVelocity: 45,
        colors: [...VIBRANT_COLORS, ...GOLDEN_STREAK_COLORS],
        disableForReducedMotion: true,
      });

      setTimeout(() => {
        try {
          confetti({
            particleCount: 40,
            spread: 90,
            origin: { x: 0.5, y: 0.5 },
            startVelocity: 30,
            shapes: ["star"],
            colors: GOLDEN_STREAK_COLORS,
            scalar: 1.2,
            disableForReducedMotion: true,
          });
        } catch {}
      }, 200);
    } else {
      // 5 Streak: Major Celebratory Upward Burst
      confetti({
        particleCount: 55,
        spread: 75,
        origin: { x: 0.5, y: 0.65 },
        startVelocity: 38,
        gravity: 0.95,
        colors: VIBRANT_COLORS,
        disableForReducedMotion: true,
      });

      setTimeout(() => {
        try {
          confetti({
            particleCount: 20,
            spread: 60,
            origin: { x: 0.5, y: 0.6 },
            shapes: ["star"],
            colors: GOLDEN_STREAK_COLORS,
            startVelocity: 22,
            disableForReducedMotion: true,
          });
        } catch {}
      }, 150);
    }
  } catch {
    // ignore
  }
}

