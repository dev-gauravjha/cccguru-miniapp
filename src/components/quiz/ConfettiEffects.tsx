"use client";

import React, { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  speedX: number;
  speedY: number;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

export function ConfettiEffects({ active = true, count = 28 }: { active?: boolean; count?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const items: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 35 + Math.random() * 30, // burst from center
      y: 40 + Math.random() * 20,
      size: 6 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      speedX: (Math.random() - 0.5) * 140,
      speedY: -60 - Math.random() * 100,
    }));

    setParticles(items);

    const timer = setTimeout(() => {
      setParticles([]);
    }, 1500);

    return () => clearTimeout(timer);
  }, [active, count]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-sm animate-pop"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.7}px`,
            backgroundColor: p.color,
            transform: `translate(${p.speedX}px, ${p.speedY}px) rotate(${p.rotation}deg)`,
            opacity: 0.9,
            transition: "all 1.2s cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        />
      ))}
    </div>
  );
}
