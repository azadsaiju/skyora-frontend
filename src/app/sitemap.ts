import type { MetadataRoute } from "next";

/**
 * Dynamic XML sitemap for Skyora Group.
 * Covers all crawlable public routes on https://www.skyoragroup.com.
 * Excludes private administrative, authentication, and API endpoints.
 */

const CANONICAL_HOST = "https://www.skyoragroup.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: CANONICAL_HOST,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${CANONICAL_HOST}/aviation`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${CANONICAL_HOST}/it`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${CANONICAL_HOST}/it/data-science`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${CANONICAL_HOST}/it/artificial-intelligence`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${CANONICAL_HOST}/it/machine-learning`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${CANONICAL_HOST}/it/data-analytics`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${CANONICAL_HOST}/placements`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${CANONICAL_HOST}/achievements`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${CANONICAL_HOST}/certifications`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${CANONICAL_HOST}/mentorship`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${CANONICAL_HOST}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${CANONICAL_HOST}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
