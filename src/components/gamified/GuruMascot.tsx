"use client";

import React from "react";

export type MascotPose = "default" | "happy" | "celebrate" | "epic" | "encourage";

interface GuruMascotProps {
  size?: number;
  className?: string;
  pose?: MascotPose;
}

export function GuruMascot({
  size = 56,
  className = "",
  pose = "default",
}: GuruMascotProps) {
  const isHappy = pose === "happy";
  const isCelebrate = pose === "celebrate";
  const isEpic = pose === "epic";
  const isEncourage = pose === "encourage";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Epic Golden Aura / Radiance */}
      {isEpic && (
        <>
          <circle cx="36" cy="36" r="35" fill="url(#epic_aura)" opacity="0.45" />
          {/* Sparkle Rays */}
          <path
            d="M36 2 L38 10 L36 18 L34 10 Z M70 36 L62 38 L54 36 L62 34 Z M36 70 L34 62 L36 54 L38 62 Z M2 36 L10 34 L18 36 L10 38 Z"
            fill="#fbbf24"
            opacity="0.6"
          />
        </>
      )}

      {/* Outer Glow / Drop Shadow */}
      <circle
        cx="36"
        cy="38"
        r={isEpic ? 32 : 30}
        fill={isEpic ? "url(#epic_glow)" : "url(#mascot_glow)"}
        opacity={isEpic ? 0.6 : isCelebrate ? 0.45 : 0.3}
      />

      {/* Wings Raised for Celebrate & Epic */}
      {(isCelebrate || isEpic) && (
        <>
          {/* Left Wing Raised High */}
          <path
            d="M15 45 C4 35 7 20 18 24 C14 34 15 42 17 47 Z"
            fill="url(#wing_grad_left)"
          />
          {/* Right Wing Raised High */}
          <path
            d="M57 45 C68 35 65 20 54 24 C58 34 57 42 55 47 Z"
            fill="url(#wing_grad_right)"
          />
        </>
      )}

      {/* Encouraging Supportive Wing Wave */}
      {isEncourage && (
        <path
          d="M55 46 C64 38 62 26 52 30 C55 36 54 42 53 46 Z"
          fill="url(#wing_grad_right)"
        />
      )}

      {/* Owl Body */}
      <ellipse cx="36" cy="40" rx="24" ry="25" fill="url(#body_grad)" />

      {/* Owl Belly */}
      <ellipse cx="36" cy="46" rx="16" ry="17" fill="url(#belly_grad)" />

      {/* Belly Feathers / Highlights */}
      <path
        d="M31 43C33 45 39 45 41 43M30 48C32 50 40 50 42 48"
        stroke="#c084fc"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Owl Ears / Feathers */}
      <path d="M18 20L25 29L14 30Z" fill="#6b21a8" />
      <path d="M54 20L58 30L47 29Z" fill="#6b21a8" />

      {/* Big Expressive Eyes Depending on Pose */}
      {isHappy ? (
        // Closed joyful smiling curved eyes
        <>
          <path
            d="M20 34 C23 28 31 28 34 34"
            stroke="#1e1b4b"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M38 34 C41 28 49 28 52 34"
            stroke="#1e1b4b"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          {/* Cute Rosy Blushing Cheeks */}
          <ellipse cx="20" cy="40" rx="3.5" ry="2" fill="#f43f5e" opacity="0.45" />
          <ellipse cx="52" cy="40" rx="3.5" ry="2" fill="#f43f5e" opacity="0.45" />
        </>
      ) : isCelebrate ? (
        // Big shining eyes with star glints
        <>
          <circle cx="27" cy="34" r="9" fill="#ffffff" stroke="#c084fc" strokeWidth="1.5" />
          <circle cx="28" cy="33.5" r="5.5" fill="#3b0764" />
          <circle cx="26" cy="31.5" r="2.2" fill="#ffffff" />
          <circle cx="30" cy="35" r="1.2" fill="#ffffff" />

          <circle cx="45" cy="34" r="9" fill="#ffffff" stroke="#c084fc" strokeWidth="1.5" />
          <circle cx="44" cy="33.5" r="5.5" fill="#3b0764" />
          <circle cx="42" cy="31.5" r="2.2" fill="#ffffff" />
          <circle cx="46" cy="35" r="1.2" fill="#ffffff" />

          {/* Rosy Cheeks */}
          <ellipse cx="19" cy="40" rx="4" ry="2.2" fill="#f43f5e" opacity="0.5" />
          <ellipse cx="53" cy="40" rx="4" ry="2.2" fill="#f43f5e" opacity="0.5" />
        </>
      ) : isEpic ? (
        // Starry glistening eyes with golden sparkles
        <>
          <circle cx="27" cy="34" r="9.5" fill="#ffffff" stroke="#f59e0b" strokeWidth="2" />
          <circle cx="27.5" cy="33.5" r="6" fill="#1e1b4b" />
          {/* 4-point star shine */}
          <path
            d="M26 29 L27 32 L30 33 L27 34 L26 37 L25 34 L22 33 L25 32 Z"
            fill="#fbbf24"
          />
          <circle cx="29" cy="35.5" r="1.3" fill="#ffffff" />

          <circle cx="45" cy="34" r="9.5" fill="#ffffff" stroke="#f59e0b" strokeWidth="2" />
          <circle cx="44.5" cy="33.5" r="6" fill="#1e1b4b" />
          {/* 4-point star shine */}
          <path
            d="M44 29 L45 32 L48 33 L45 34 L44 37 L43 34 L40 33 L43 32 Z"
            fill="#fbbf24"
          />
          <circle cx="47" cy="35.5" r="1.3" fill="#ffffff" />

          {/* Rosy Cheeks */}
          <ellipse cx="18" cy="40" rx="4.2" ry="2.5" fill="#f59e0b" opacity="0.5" />
          <ellipse cx="54" cy="40" rx="4.2" ry="2.5" fill="#f59e0b" opacity="0.5" />
        </>
      ) : isEncourage ? (
        // Supportive, gentle kind eyes
        <>
          <circle cx="27" cy="34" r="8.5" fill="#ffffff" stroke="#e9d5ff" strokeWidth="1.5" />
          <circle cx="28.5" cy="34" r="4.5" fill="#1e1b4b" />
          <circle cx="27" cy="32" r="1.8" fill="#ffffff" />

          <circle cx="45" cy="34" r="8.5" fill="#ffffff" stroke="#e9d5ff" strokeWidth="1.5" />
          <circle cx="43.5" cy="34" r="4.5" fill="#1e1b4b" />
          <circle cx="42" cy="32" r="1.8" fill="#ffffff" />

          {/* Soft encouraging blush */}
          <ellipse cx="20" cy="40" rx="3" ry="1.8" fill="#f472b6" opacity="0.3" />
          <ellipse cx="52" cy="40" rx="3" ry="1.8" fill="#f472b6" opacity="0.3" />
        </>
      ) : (
        // Default standard eyes
        <>
          <circle cx="27" cy="34" r="8.5" fill="#ffffff" stroke="#e9d5ff" strokeWidth="1.5" />
          <circle cx="28.5" cy="34" r="4.5" fill="#1e1b4b" />
          <circle cx="27" cy="32" r="1.8" fill="#ffffff" />

          <circle cx="45" cy="34" r="8.5" fill="#ffffff" stroke="#e9d5ff" strokeWidth="1.5" />
          <circle cx="43.5" cy="34" r="4.5" fill="#1e1b4b" />
          <circle cx="42" cy="32" r="1.8" fill="#ffffff" />
        </>
      )}

      {/* Cute Orange Beak */}
      <polygon points="36,37 32,42 40,42" fill="#f59e0b" />
      <polygon points="36,44 33,41 39,41" fill="#d97706" />

      {/* Graduation / Guru Cap */}
      <path d="M36 8L55 17L36 22L17 17Z" fill={isEpic ? "#312e81" : "#1e1b4b"} />
      <path
        d="M26 19.5V25C26 27.5 30.5 30 36 30C41.5 30 46 27.5 46 25V19.5"
        fill={isEpic ? "#4338ca" : "#312e81"}
      />
      {/* Golden Cap Tassel */}
      <circle cx="36" cy="15" r="2" fill="#fbbf24" />
      <path
        d="M36 15L48 20L50 27"
        stroke="#fbbf24"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="50" cy="28" r="1.5" fill="#f59e0b" />

      {/* EPIC GOLDEN CROWN ON CAP */}
      {isEpic && (
        <g>
          <path
            d="M28 6 L32 11 L36 4 L40 11 L44 6 L43 14 L29 14 Z"
            fill="url(#crown_grad)"
            stroke="#b45309"
            strokeWidth="0.8"
          />
          {/* Jewels on crown points */}
          <circle cx="28" cy="6" r="1.2" fill="#ef4444" />
          <circle cx="36" cy="4" r="1.5" fill="#3b82f6" />
          <circle cx="44" cy="6" r="1.2" fill="#10b981" />
        </g>
      )}

      {/* Cute Feet */}
      <ellipse cx="29" cy="64" rx="4" ry="2" fill="#f59e0b" />
      <ellipse cx="43" cy="64" rx="4" ry="2" fill="#f59e0b" />

      {/* Definitions for Gradients */}
      <defs>
        <radialGradient
          id="mascot_glow"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(36 38) rotate(90) scale(30)"
        >
          <stop stopColor="#a855f7" />
          <stop offset="1" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="epic_glow"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(36 38) rotate(90) scale(32)"
        >
          <stop stopColor="#fbbf24" />
          <stop offset="0.6" stopColor="#f59e0b" stopOpacity="0.4" />
          <stop offset="1" stopColor="#d97706" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="epic_aura"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(36 36) rotate(90) scale(35)"
        >
          <stop stopColor="#fef08a" />
          <stop offset="0.5" stopColor="#fbbf24" stopOpacity="0.5" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="body_grad"
          x1="12"
          y1="15"
          x2="60"
          y2="65"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={isEpic ? "#a855f7" : "#9333ea"} />
          <stop offset="0.6" stopColor={isEpic ? "#9333ea" : "#7e22ce"} />
          <stop offset="1" stopColor={isEpic ? "#6b21a8" : "#581c87"} />
        </linearGradient>
        <linearGradient
          id="belly_grad"
          x1="36"
          y1="29"
          x2="36"
          y2="63"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#faf5ff" />
          <stop offset="1" stopColor="#f3e8ff" />
        </linearGradient>
        <linearGradient
          id="wing_grad_left"
          x1="10"
          y1="20"
          x2="18"
          y2="46"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#a855f7" />
          <stop offset="1" stopColor="#6b21a8" />
        </linearGradient>
        <linearGradient
          id="wing_grad_right"
          x1="62"
          y1="20"
          x2="54"
          y2="46"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#a855f7" />
          <stop offset="1" stopColor="#6b21a8" />
        </linearGradient>
        <linearGradient
          id="crown_grad"
          x1="28"
          y1="4"
          x2="44"
          y2="14"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fef08a" />
          <stop offset="0.5" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}
