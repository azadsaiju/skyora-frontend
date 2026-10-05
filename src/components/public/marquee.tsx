"use client";

/**
 * Full-bleed black recruiter strip with a seamless infinite marquee.
 * The list is rendered twice inside a w-max flex row; the CSS keyframe
 * translates exactly -50%, so each copy carries pr-4 (no outer gap) to
 * keep the loop pixel-perfect. Second copy is aria-hidden.
 * Reduced motion: animation disabled in CSS; marquee-fallback turns the
 * row into a horizontal scroller instead.
 */

import { siteConfig } from "@/config/site.config";

const DOT_COLORS = siteConfig.stats.map((stat) => stat.color);

export function RecruiterMarquee() {
  return (
    <section
      aria-label="Our recruiters and hiring partners"
      className="marquee-hover-pause overflow-hidden border-y-2 border-ink bg-olive-deep py-5"
    >
      <p className="mb-4 px-4 text-center font-grotesk text-[11px] font-bold tracking-[0.3em] text-cream/60 uppercase">
        Our Recruiters &amp; Hiring Partners
      </p>
      <div className="overflow-hidden">
        <div className="marquee-fallback flex w-max animate-marquee">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              aria-hidden={copy === 1}
              className="flex items-center gap-4 pr-4"
            >
              {siteConfig.recruiters.map((name, i) => (
                <span
                  key={`${copy}-${i}`}
                  className="flex items-center gap-2 rounded-full border-2 border-white bg-white px-5 py-2 font-grotesk font-bold whitespace-nowrap text-ink"
                >
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: DOT_COLORS[i % DOT_COLORS.length] }}
                  />
                  {name}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
