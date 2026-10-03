"use client";

/**
 * About page: founding story, why-us pillars and the mentor team.
 * All data comes from siteConfig — no fetching required.
 */

import { motion, type Variants } from "framer-motion";
import { Quote } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/public/section-heading";

const GRID_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const GRID_ITEM: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export function AboutSection() {
  return (
    <section
      aria-label="About Skyora"
      className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20"
    >
      <SectionHeading
        eyebrow="About Skyora"
        title="BUILT LIKE AN AIRPORT. RUNS LIKE A TECH LAB."
        highlight="AIRPORT"
      />

      {/* Story */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="brutal-card mt-10 p-6 md:p-10"
      >
        <Quote aria-hidden className="h-10 w-10 text-brand-pink" />
        <p className="mt-4 max-w-3xl text-base leading-relaxed md:text-lg">
          {siteConfig.story}
        </p>
      </motion.div>

      {/* Why us */}
      <h3 className="mt-16 font-display text-2xl uppercase leading-none md:text-3xl">
        Why students choose us
      </h3>
      <motion.div
        variants={GRID_CONTAINER}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {siteConfig.whyUs.map((item) => (
          <motion.div
            key={item.title}
            variants={GRID_ITEM}
            className="brutal-card-sm min-w-0 p-5"
          >
            <span
              aria-hidden
              className="block h-3 w-3 rounded-full"
              style={{ background: item.color }}
            />
            <h4 className="mt-3 font-grotesk font-bold break-words">
              {item.title}
            </h4>
            <p className="mt-1 text-sm leading-relaxed break-words text-muted-foreground">
              {item.text}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Mentors */}
      <h3 className="mt-16 font-display text-2xl uppercase leading-none md:text-3xl">
        Meet the mentors
      </h3>
      <motion.div
        variants={GRID_CONTAINER}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {siteConfig.mentors.map((mentor) => (
          <motion.div
            key={mentor.name}
            variants={GRID_ITEM}
            className="brutal-card min-w-0 p-5"
          >
            <span
              aria-hidden
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink font-display text-lg text-white shadow-hard-sm"
              style={{ background: mentor.color }}
            >
              {mentor.initials}
            </span>
            <h4 className="mt-3 font-grotesk font-bold break-words">
              {mentor.name}
            </h4>
            <Badge
              variant="outline"
              className="mt-2 rounded-full border-2 bg-white text-[10px] font-bold uppercase"
              style={{ borderColor: mentor.color, color: mentor.color }}
            >
              {mentor.role}
            </Badge>
            <p className="mt-2 text-sm leading-relaxed break-words text-muted-foreground">
              {mentor.bio}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
