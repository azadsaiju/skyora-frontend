/**
 * One-off: extract the official Skyora logo from the uploaded PDF image,
 * chroma-key the warm cream background to transparency (protecting the
 * white sparkle core), split mark vs full lockup, and save web assets.
 * Run: bun scripts/process-logo.ts
 */
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const SRC = "/tmp/skyora-logo-000.png"; // pdfimages extraction of Skyora_Logo.pdf
// Background signature: (253-254, 252-253, 247-248) — warm, R-B ≈ 5-6.
const BG = { r: 254, g: 252, b: 247 };

function dist(r: number, g: number, b: number) {
  return Math.sqrt((r - BG.r) ** 2 + (g - BG.g) ** 2 + (b - BG.b) ** 2);
}

async function main() {
  const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  // ── RGBA working buffer ───────────────────────────────────────────────────
  const rgba = Buffer.alloc(W * H * 4);
  for (let i = 0, j = 0; i < W * H * 3; i += 3, j += 4) {
    rgba[j] = data[i];
    rgba[j + 1] = data[i + 1];
    rgba[j + 2] = data[i + 2];
    rgba[j + 3] = 255;
  }

  // ── Pass 1: flood-fill background from the borders (tolerance 26) ────────
  const visited = new Uint8Array(W * H);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    const p = y * W + x;
    if (!visited[p]) stack.push(p);
  };
  for (let x = 0; x < W; x++) {
    push(x, 0);
    push(x, H - 1);
  }
  for (let y = 0; y < H; y++) {
    push(0, y);
    push(W - 1, y);
  }
  while (stack.length > 0) {
    const p = stack.pop()!;
    if (visited[p]) continue;
    visited[p] = 1;
    const i = p * 4;
    if (dist(rgba[i], rgba[i + 1], rgba[i + 2]) > 26) continue; // solid pixel — stop here
    rgba[i + 3] = 0; // background-connected → transparent
    const x = p % W;
    const y = (p / W) | 0;
    if (x > 0) push(x - 1, y);
    if (x < W - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < H - 1) push(x, y + 1);
  }

  // ── Pass 2: exact bg-signature sweep (letter counters, enclosed bg) ──────
  // Only matches the warm cream signature; neutral/green whites survive.
  for (let p = 0; p < W * H; p++) {
    const i = p * 4;
    if (rgba[i + 3] === 0) continue;
    const r = rgba[i];
    const g = rgba[i + 1];
    const b = rgba[i + 2];
    if (Math.abs(r - BG.r) <= 3 && Math.abs(g - BG.g) <= 3 && Math.abs(b - BG.b) <= 3 && r - b >= 4) {
      rgba[i + 3] = 0;
    }
  }

  // ── Bounding boxes ────────────────────────────────────────────────────────
  const rowOpaque = new Int32Array(H);
  let minX = W, maxX = 0, minY = H, maxY = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (rgba[(y * W + x) * 4 + 3] > 0) {
        rowOpaque[y]++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  console.log(`opaque bbox: x ${minX}..${maxX}, y ${minY}..${maxY}`);

  // Find the widest fully-transparent horizontal gap between 35%..75% height
  // (the separation between the S mark and the SKYORA wordmark).
  let gapStart = -1, gapEnd = -1, runStart = -1, best = 0;
  for (let y = Math.floor(H * 0.35); y <= Math.floor(H * 0.75); y++) {
    if (rowOpaque[y] === 0) {
      if (runStart < 0) runStart = y;
      if (y - runStart > best) {
        best = y - runStart;
        gapStart = runStart;
        gapEnd = y;
      }
    } else {
      runStart = -1;
    }
  }
  if (gapStart < 0) throw new Error("could not locate mark/wordmark gap");
  console.log(`split gap: rows ${gapStart}..${gapEnd} (${best + 1}px)`);

  // ── Pass 3: wordmark-region cleanup (below the split gap) ────────────────
  // Letter counters carry jpeg-noisy near-bg speckles that miss the exact
  // signature. In the wordmark everything green has G ≥ R; background noise
  // is warm/light. Remove light non-green pixels there only — the sparkle
  // lives above the gap and is untouched.
  for (let y = gapStart; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = y * W + x;
      const i = p * 4;
      if (rgba[i + 3] === 0) continue;
      const r = rgba[i];
      const g = rgba[i + 1];
      const b = rgba[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum > 205 && g - r <= 14 && r - b >= 0) {
        rgba[i + 3] = 0;
      }
    }
  }

  // ── Pass 4: despeckle — drop isolated opaque pixels (2 iterations) ───────
  for (let iter = 0; iter < 2; iter++) {
    const kill: number[] = [];
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const p = y * W + x;
        const i = p * 4;
        if (rgba[i + 3] === 0) continue;
        const nTransparent =
          (rgba[(p - 1) * 4 + 3] === 0 ? 1 : 0) +
          (rgba[(p + 1) * 4 + 3] === 0 ? 1 : 0) +
          (rgba[(p - W) * 4 + 3] === 0 ? 1 : 0) +
          (rgba[(p + W) * 4 + 3] === 0 ? 1 : 0);
        if (nTransparent >= 3) kill.push(i);
      }
    }
    for (const i of kill) rgba[i + 3] = 0;
    if (kill.length === 0) break;
    console.log(`despeckle: removed ${kill.length} isolated pixels (iter ${iter + 1})`);
  }

  const save = async (buf: Buffer, w: number, h: number, file: string, outWidth: number) => {
    await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
      .trim({ threshold: 0 })
      .resize(outWidth, outWidth, { fit: "inside" })
      .png({ compressionLevel: 9 })
      .toFile(file);
    const m = await sharp(file).metadata();
    console.log(`saved ${file} (${m.width}x${m.height})`);
  };

  // Full lockup (mark + wordmark + taglines)
  const fullW = maxX - minX + 1;
  const fullH = maxY - minY + 1;
  const full = Buffer.alloc(fullW * fullH * 4);
  for (let y = 0; y < fullH; y++) {
    rgba.copy(full, y * fullW * 4, ((minY + y) * W + minX) * 4, ((minY + y) * W + minX + fullW) * 4);
  }
  await save(full, fullW, fullH, "public/logo-full.png", 1000);

  // Mark only (S + sparkle) — above the gap
  const markBottom = gapStart - 1;
  let mMinX = W, mMaxX = 0, mMinY = H, mMaxY = 0;
  for (let y = minY; y <= markBottom; y++) {
    for (let x = 0; x < W; x++) {
      if (rgba[(y * W + x) * 4 + 3] > 0) {
        if (x < mMinX) mMinX = x;
        if (x > mMaxX) mMaxX = x;
        if (y < mMinY) mMinY = y;
        if (y > mMaxY) mMaxY = y;
      }
    }
  }
  const markW = mMaxX - mMinX + 1;
  const markH = mMaxY - mMinY + 1;
  const mark = Buffer.alloc(markW * markH * 4);
  for (let y = 0; y < markH; y++) {
    rgba.copy(mark, y * markW * 4, ((mMinY + y) * W + mMinX) * 4, ((mMinY + y) * W + mMinX + markW) * 4);
  }
  console.log(`mark bbox: x ${mMinX}..${mMaxX}, y ${mMinY}..${mMaxY} (${markW}x${markH})`);
  await save(mark, markW, markH, "public/logo-mark.png", 1024);

  // Square-contained mark (favicon / tiles want a square canvas)
  const markSquare = await sharp(mark, { raw: { width: markW, height: markH, channels: 4 } })
    .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile("public/logo-mark-square.png", markSquare);
  console.log("saved public/logo-mark-square.png (1024x1024)");
}

void main();
