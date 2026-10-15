"use client";

/**
 * Consistent section heading: colored-dot eyebrow, oversized display title
 * (with optional pink-highlighted substring) and optional description.
 * Fades up once when scrolled into view.
 */

import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  /** Substring of `title` to wrap in the accent (first occurrence). */
  highlight?: string;
  highlightClassName?: string;
  dotColor?: string;
  description?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  eyebrow,
  title,
  highlight,
  highlightClassName = "text-[#6EA820]",
  dotColor = "bg-[#6EA820]",
  description,
  align = "left",
}: SectionHeadingProps) {
  const centered = align === "center";

  let titleContent: ReactNode = title;
  if (highlight) {
    const idx = title.indexOf(highlight);
    if (idx !== -1) {
      titleContent = (
        <>
          {title.slice(0, idx)}
          <span className={highlightClassName}>{highlight}</span>
          {title.slice(idx + highlight.length)}
        </>
      );
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}
    >
      <p
        className={`flex items-center gap-2.5 font-grotesk text-xs font-bold tracking-[0.2em] text-stone-500 uppercase ${
          centered ? "justify-center" : ""
        }`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} aria-hidden />
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-3xl leading-[0.95] break-words uppercase sm:text-4xl lg:text-5xl">
        {titleContent}
      </h2>
      {description ? (
        <p
          className={`mt-4 max-w-2xl text-sm leading-relaxed text-olive-soft md:text-base ${
            centered ? "mx-auto" : ""
          }`}
        >
          {description}
        </p>
      ) : null}
    </motion.div>
  );
}
