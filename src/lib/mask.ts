/**
 * List-view masking for ADMIN role (per spec: 98••••••12).
 * SUPER_ADMIN always receives full values.
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "•".repeat(Math.max(phone.length, 4));
  const first2 = digits.slice(0, 2);
  const last2 = digits.slice(-2);
  const middle = Math.max(digits.length - 4, 4);
  return `${first2}${"•".repeat(middle)}${last2}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "•••••";
  const visible = local.slice(0, 1);
  return `${visible}${"•".repeat(Math.max(local.length - 1, 3))}@${domain}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
