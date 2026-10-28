/**
 * JSON-LD structured data helpers for SEO.
 * Each function returns a valid JSON-LD script element ready to be
 * rendered inside a page or layout component.
 *
 * All data reflects verifiable content visible on the page.
 * No fabricated ratings, reviews, prices, or accreditation.
 */

import { siteConfig } from "@/config/site.config";

const CANONICAL_HOST = "https://www.skyoragroup.com";

/** Organization schema — used in the root layout */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    alternateName: "Skyora",
    url: CANONICAL_HOST,
    logo: `${CANONICAL_HOST}/logo-mark.png`,
    description: siteConfig.description,
    sameAs: [
      siteConfig.links.instagram,
      siteConfig.links.linkedin,
      siteConfig.links.github,
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress:
        "3rd Floor, Corner Stone Building, near Kadavanthara Metro Station, Pillar No. 783",
      addressLocality: "Kochi",
      addressRegion: "Kerala",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: siteConfig.links.phoneDisplay,
      contactType: "admissions",
      availableLanguage: ["English", "Hindi", "Malayalam"],
    },
  };
}

/** WebSite schema with SearchAction — used in the root layout */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: "Skyora",
    url: CANONICAL_HOST,
  };
}

/** BreadcrumbList schema for interior pages */
export function breadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Schema.org Course structured data */
export function courseJsonLd({
  name,
  description,
  url,
  providerName = siteConfig.name,
}: {
  name: string;
  description: string;
  url: string;
  providerName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    url,
    provider: {
      "@type": "Organization",
      name: providerName,
      sameAs: CANONICAL_HOST,
    },
  };
}

/**
 * Renders a JSON-LD script tag with the given schema object.
 * Safe to use in both server and client components.
 */
export function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
