"use client";

import React from "react";

export function GuruMascot({ size = 56, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Outer Glow / Drop Shadow */}
      <circle cx="36" cy="38" r="30" fill="url(#mascot_glow)" opacity="0.3" />

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

      {/* Big Expressive Eyes */}
      {/* Eye Left */}
      <circle cx="27" cy="34" r="8.5" fill="#ffffff" stroke="#e9d5ff" strokeWidth="1.5" />
      <circle cx="28.5" cy="34" r="4.5" fill="#1e1b4b" />
      <circle cx="27" cy="32" r="1.8" fill="#ffffff" />

      {/* Eye Right */}
      <circle cx="45" cy="34" r="8.5" fill="#ffffff" stroke="#e9d5ff" strokeWidth="1.5" />
      <circle cx="43.5" cy="34" r="4.5" fill="#1e1b4b" />
      <circle cx="42" cy="32" r="1.8" fill="#ffffff" />

      {/* Cute Orange Beak */}
      <polygon points="36,37 32,42 40,42" fill="#f59e0b" />
      <polygon points="36,44 33,41 39,41" fill="#d97706" />

      {/* Graduation / Guru Cap */}
      <path d="M36 8L55 17L36 22L17 17Z" fill="#1e1b4b" />
      <path d="M26 19.5V25C26 27.5 30.5 30 36 30C41.5 30 46 27.5 46 25V19.5" fill="#312e81" />
      {/* Golden Cap Tassel */}
      <circle cx="36" cy="15" r="2" fill="#fbbf24" />
      <path d="M36 15L48 20L50 27" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="50" cy="28" r="1.5" fill="#f59e0b" />

      {/* Cute Feet */}
      <ellipse cx="29" cy="64" rx="4" ry="2" fill="#f59e0b" />
      <ellipse cx="43" cy="64" rx="4" ry="2" fill="#f59e0b" />

      {/* Definitions for Gradients */}
      <defs>
        <radialGradient id="mascot_glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(36 38) rotate(90) scale(30)">
          <stop stopColor="#a855f7" />
          <stop offset="1" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="body_grad" x1="12" y1="15" x2="60" y2="65" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9333ea" />
          <stop offset="0.6" stopColor="#7e22ce" />
          <stop offset="1" stopColor="#581c87" />
        </linearGradient>
        <linearGradient id="belly_grad" x1="36" y1="29" x2="36" y2="63" gradientUnits="userSpaceOnUse">
          <stop stopColor="#faf5ff" />
          <stop offset="1" stopColor="#f3e8ff" />
        </linearGradient>
      </defs>
    </svg>
  );
}
