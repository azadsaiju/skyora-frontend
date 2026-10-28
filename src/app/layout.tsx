import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site.config";
import {
  JsonLdScript,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo-jsonld";

const CANONICAL_HOST = "https://www.skyoragroup.com";

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_HOST),
  title: {
    default: "Skyora Group | Aviation, IT Training & Career Development in Kochi",
    template: "%s | Skyora Group of Institutes",
  },
  description:
    "Explore aviation and IT training, professional courses, and career development opportunities with Skyora Group of Institutes in Kochi, Kerala. Professional aviation and STED Council certified IT programs.",
  keywords: [
    "Skyora Group",
    "Skyora Group of Institutes",
    "aviation courses in Kochi",
    "IT training in Kochi",
    "data science course in Kochi",
    "cabin crew training",
    "full stack development",
    "placement support",
    "professional training programs",
    "career development Kerala",
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  alternates: {
    canonical: CANONICAL_HOST,
  },
  icons: {
    icon: [
      { url: "/logo-mark.png", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Skyora Group | Aviation, IT Training & Career Development",
    description:
      "Professional aviation academy and STED Council certified IT training with mentor-led programs, real projects and placement support in Kochi, Kerala.",
    siteName: siteConfig.name,
    type: "website",
    url: CANONICAL_HOST,
    locale: "en_IN",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Skyora Group of Institutes — Aviation & IT Training",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Skyora Group | Aviation, IT Training & Career Development",
    description:
      "Professional aviation and STED Council certified IT training with mentor-led programs, real projects and placement support.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF7F2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Structured data: Organization + WebSite */}
        <JsonLdScript data={organizationJsonLd()} />
        <JsonLdScript data={websiteJsonLd()} />
      </head>
      <body className="antialiased bg-cream text-ink font-sans">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
