import type { MetadataRoute } from "next";

const siteUrl = "https://www.skyoragroup.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: siteUrl, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/aviation`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/it`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/mentorship`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/certifications`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/about`, lastModified, changeFrequency: "monthly", priority: 0.7 },
  ];
}
