import "server-only";
import { db } from "@/lib/db";

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "PASSWORD_CHANGE"
  | "PASSWORD_RESET"
  // ── TOTP 2FA lifecycle (Prompt 6) ──
  | "MFA_CHALLENGE"
  | "MFA_SETUP_STARTED"
  | "MFA_ENABLED"
  | "MFA_DISABLED"
  | "MFA_DISABLE_FAILED"
  | "MFA_LOGIN_SUCCESS"
  | "MFA_CODE_FAILED"
  | "RECOVERY_CODE_USED"
  | "STATUS_CHANGE"
  | "ASSIGN_CHANGE"
  | "EXPORT"
  | "FOLLOWUP_CREATE"
  | "ENQUIRY_DELETE"
  | "ENQUIRY_IMPORT"
  | "REMINDER_RUN"
  | "COURSE_CREATE"
  | "COURSE_UPDATE"
  | "COURSE_DELETE"
  | "UPLOAD_CREATE"
  | "VACANCY_CREATE"
  | "VACANCY_UPDATE"
  | "VACANCY_DELETE"
  | "ACHIEVEMENT_CREATE"
  | "ACHIEVEMENT_UPDATE"
  | "ACHIEVEMENT_DELETE"
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_DEACTIVATE"
  | "USER_ACTIVATE"
  | "WHATSAPP_CLICKED";

/**
 * Fire-and-forget audit logging. Never throws — audit failures must not
 * break the primary operation.
 */
export async function logAudit(entry: {
  userId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  ipAddress?: string | null;
  meta?: unknown;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        ipAddress: entry.ipAddress ?? null,
        meta:
          entry.meta === undefined
            ? null
            : JSON.stringify(entry.meta).slice(0, 2000),
      },
    });
  } catch (err) {
    console.error("[audit] failed to write audit log:", err);
  }
}
