import { PublicShell } from "@/components/public/public-shell";

/**
 * Layout for all public pages: navbar, olive canvas, footer, floating CTAs.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
