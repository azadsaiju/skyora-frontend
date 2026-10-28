import type { MetadataRoute } from "next";

/**
 * PWA web manifest — served at /manifest.webmanifest by Next.js.
 * Brand colors match the neo-brutalist tokens in globals.css.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Skyora Group of Institutes | Aviation & IT Training",
    short_name: "Skyora",
    description:
      "Careers take flight — professional aviation academy and STED Council certified IT training with placements.",
    start_url: "/",
    display: "standalone",
    background_color: "#6E9622",
    theme_color: "#6E9622",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
