"use client";

import React from "react";
import Link from "next/link";
import { useTelegram } from "@/components/providers/TelegramProvider";

export type GameButtonVariant =
  | "primary"
  | "emerald"
  | "amber"
  | "rose"
  | "slate";

export type GameButtonSize = "sm" | "md" | "lg";

interface GameButtonProps {
  children: React.ReactNode;
  variant?: GameButtonVariant;
  size?: GameButtonSize;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  haptic?: "light" | "medium" | "heavy" | "selection" | "success" | "error";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  type?: "button" | "submit" | "reset";
}

const variantClasses: Record<GameButtonVariant, string> = {
  primary: "btn-3d-primary",
  emerald: "btn-3d-emerald",
  amber: "btn-3d-amber",
  rose: "btn-3d-rose",
  slate: "btn-3d-slate",
};

const sizeClasses: Record<GameButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs font-bold rounded-xl",
  md: "px-4 py-2.5 text-xs sm:text-sm font-extrabold rounded-2xl",
  lg: "px-5 py-3.5 text-sm sm:text-base font-black rounded-2xl tracking-wide",
};

export function GameButton({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  disabled = false,
  className = "",
  fullWidth = false,
  haptic = "medium",
  icon,
  iconPosition = "left",
  type = "button",
}: GameButtonProps) {
  const { triggerHaptic } = useTelegram();

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (haptic) triggerHaptic(haptic);
    if (onClick) onClick(e);
  };

  const combinedClasses = `btn-3d inline-flex items-center justify-center gap-2 cursor-pointer transition-all ${
    variantClasses[variant]
  } ${sizeClasses[size]} ${
    fullWidth ? "w-full" : ""
  } ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} onClick={handleClick} className={combinedClasses}>
        {icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
        {icon && iconPosition === "right" && <span className="shrink-0">{icon}</span>}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={combinedClasses}
    >
      {icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === "right" && <span className="shrink-0">{icon}</span>}
    </button>
  );
}
