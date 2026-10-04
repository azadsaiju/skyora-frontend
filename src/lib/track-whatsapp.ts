/**
 * WhatsApp deep-link click tracking (Prompt 10) — client helper.
 * Fire-and-forget: sendBeacon when available (survives page navigation to
 * wa.me), fetch keepalive as fallback. Tracking must NEVER break a click.
 */
export function trackWhatsApp(context: string, enquiryId?: string): void {
  try {
    const payload = JSON.stringify(
      enquiryId ? { context, enquiryId } : { context }
    );
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function"
    ) {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon("/api/track/whatsapp", blob)) return;
    }
    void fetch("/api/track/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // never let analytics break navigation
  }
}
