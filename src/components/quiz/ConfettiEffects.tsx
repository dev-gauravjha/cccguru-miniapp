"use client";

import { useEffect, useRef } from "react";
import {
  fireCorrectAnswerConfetti,
  fireVictoryCelebration,
} from "@/lib/confetti";

export { fireCorrectAnswerConfetti, fireVictoryCelebration } from "@/lib/confetti";

interface ConfettiEffectsProps {
  active?: boolean;
  count?: number;
  variant?: "correct" | "victory" | "streak";
  streak?: number;
}

/**
 * Ultra-smooth Canvas Confetti Component.
 * Powered by canvas-confetti 60fps physics engine.
 */
export function ConfettiEffects({
  active = true,
  variant = "correct",
  streak = 0,
}: ConfettiEffectsProps) {
  const prevActiveRef = useRef(false);

  useEffect(() => {
    // Only fire when transitioning from inactive -> active
    if (active && !prevActiveRef.current) {
      if (variant === "victory") {
        fireVictoryCelebration();
      } else {
        fireCorrectAnswerConfetti({ streak });
      }
    }
    prevActiveRef.current = active;
  }, [active, variant, streak]);

  return null;
}
