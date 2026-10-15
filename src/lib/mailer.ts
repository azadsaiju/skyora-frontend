import "server-only";
import { createTransport, type Transporter } from "nodemailer";

/**
 * SMTP mailer (Prompt 9). Optional by design: when SMTP_HOST/SMTP_PORT are
 * not configured, sendMail() returns { sent: false } and the caller falls
 * back to console logging — the app never blocks on email.
 */

let cached: Transporter | null = null;

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);
}

function getTransport(): Transporter | null {
  if (!isMailConfigured()) return null;
  if (cached) return cached;

  cached = createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
  return cached;
}

export async function sendMail(opts: {
  to: string[];
  subject: string;
  text: string;
  html: string;
}): Promise<{ sent: boolean; error?: string }> {
  const transport = getTransport();
  if (!transport) return { sent: false, error: "SMTP_NOT_CONFIGURED" };
  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? "Skyora CRM <no-reply@skyora.edu.in>",
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return { sent: true };
  } catch (err) {
    console.error("[mailer] send failed:", err);
    return { sent: false, error: "SMTP_SEND_FAILED" };
  }
}
