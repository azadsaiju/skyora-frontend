/**
 * Minimal RFC-4180-style CSV parser (server-side).
 * Handles quoted fields, escaped quotes ("" → "), CRLF, BOM and
 * trailing newlines. Deliberately dependency-free.
 */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, ""); // strip BOM
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  // flush the last field/row (no trailing newline)
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // drop fully-empty rows
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Digits-only normalisation used for phone de-duplication (last 10 digits). */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}
