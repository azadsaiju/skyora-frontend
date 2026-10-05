import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { requireAuth, getClientIp } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/validators";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

/**
 * POST /api/upload — authenticated image upload for course (and other) media.
 * Multipart form-data with a single "file" field. Files land in
 * public/uploads/ and the returned path can be stored on any record.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!file || !(file instanceof File)) {
      return jsonError(400, "No file uploaded.", "NO_FILE");
    }
    if (!(file.type in ALLOWED)) {
      return jsonError(
        400,
        "Unsupported file type — use PNG, JPG or WebP.",
        "BAD_TYPE"
      );
    }
    if (file.size > MAX_BYTES) {
      return jsonError(400, "Image is too large (max 4 MB).", "TOO_LARGE");
    }

    const ext = ALLOWED[file.type];
    const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

    const publicPath = `/uploads/${name}`;

    await logAudit({
      userId: user.id,
      action: "UPLOAD_CREATE",
      entity: "MEDIA",
      entityId: publicPath,
      ipAddress: getClientIp(req),
      meta: { size: file.size, type: file.type, name: file.name },
    });

    return NextResponse.json({ path: publicPath }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
