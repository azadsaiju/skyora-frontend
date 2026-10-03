"use client";

/**
 * Animated stat band (Home): count-up numbers that run exactly once
 * when the card scrolls into view. Respects prefers-reduced-motion
 * by showing the final value immediately.
 */

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { siteConfig } from "@/config/site.config";

interface StatCardProps {
  value: number;
  suffix: string;
  label: string;
  color: string;
}

function StatCard({ value, suffix, label, color }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const prefersReduced = useReducedMotion() ?? false;
  const startedRef = useRef(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || prefersReduced || startedRef.current) return;
    startedRef.current = true;

    const controls = animate(0, value, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => {
      controls.stop();
    };
  }, [inView, value, prefersReduced]);

  // Reduced motion → show the final value immediately, never count.
  const shown = prefersReduced ? value : display;

  return (
    <div ref={ref} className="brutal-card brutal-hover min-w-0 p-5 md:p-6">
      <p
        className="font-display text-4xl leading-none tabular-nums md:text-5xl"
        style={{ color }}
      >
        {shown}
        <span>{suffix}</span>
      </p>
      <p className="mt-2 flex items-center gap-2 font-sans text-xs font-bold tracking-wide uppercase md:text-sm">
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: color }}
        />
        <span className="break-words">{label}</span>
      </p>
    </div>
  );
}

export function StatCards() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 md:gap-6">
      {siteConfig.stats.map((stat) => (
        <StatCard
          key={stat.label}
          value={stat.value}
          suffix={stat.suffix}
          label={stat.label}
          color={stat.color}
        />
      ))}
    </div>
  );
}
