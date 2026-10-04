/**
 * One-off asset generator — PWA icon set + Open Graph image.
 * Run: bun scripts/generate-assets.ts
 * Outputs to public/icons/ and public/og-image.png
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const CREAM = "#FAF9F6";
const INK = "#2D2D2D";
const PINK = "#FF2E63";
const CYAN = "#00B8D9";

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

async function main() {
  await mkdir("public/icons", { recursive: true });
  const mark = Buffer.from(await readFile("public/logo.svg"));

  // ── 1. Plain app icons (transparent outside the rounded square) ──────────
  for (const size of [192, 512]) {
    await sharp(mark, { density: 300 })
      .resize(size, size, { fit: "contain", background: TRANSPARENT })
      .png()
      .toFile(`public/icons/icon-${size}.png`);
  }

  // ── 2. Maskable icon (safe zone: mark at ~76% on cream) ──────────────────
  const maskableCanvas = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="${CREAM}"/></svg>`,
  );
  const markPadded = await sharp(mark, { density: 300 })
    .resize(390, 390, { fit: "contain", background: TRANSPARENT })
    .png()
    .toBuffer();
  await sharp(maskableCanvas)
    .composite([{ input: markPadded, top: 61, left: 61 }])
    .png()
    .toFile("public/icons/maskable-512.png");

  // ── 3. Apple touch icon (180×180, cream bg, opaque) ──────────────────────
  const appleCanvas = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="180" height="180" rx="32" fill="${CREAM}"/></svg>`,
  );
  const appleMark = await sharp(mark, { density: 300 })
    .resize(136, 136, { fit: "contain", background: TRANSPARENT })
    .png()
    .toBuffer();
  await sharp(appleCanvas)
    .composite([{ input: appleMark, top: 22, left: 22 }])
    .png()
    .toFile("public/icons/apple-touch-icon.png");

  // ── 4. Open Graph image (1200×630) ────────────────────────────────────────
  const ogSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.6" fill="${INK}" opacity="0.07"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="${CREAM}"/>
  <rect width="1200" height="630" fill="url(#dots)"/>
  <circle cx="1060" cy="120" r="190" fill="${PINK}" opacity="0.10"/>
  <circle cx="90" cy="560" r="220" fill="${CYAN}" opacity="0.10"/>

  <text x="84" y="330" font-family="DejaVu Sans" font-weight="bold" font-size="118" letter-spacing="10" fill="${INK}">SKYORA</text>
  <text x="88" y="392" font-family="DejaVu Sans" font-weight="bold" font-size="34" letter-spacing="14" fill="${PINK}">GROUP OF INSTITUTES</text>

  <rect x="88" y="440" width="86" height="10" rx="5" fill="${PINK}"/>
  <rect x="186" y="440" width="10" height="10" rx="5" fill="${CYAN}"/>
  <rect x="208" y="440" width="10" height="10" rx="5" fill="${INK}"/>

  <text x="84" y="512" font-family="DejaVu Sans" font-size="33" fill="${INK}" opacity="0.82">Careers take flight — Aviation &amp; IT training with placements.</text>
  <text x="84" y="562" font-family="DejaVu Sans" font-size="25" fill="${INK}" opacity="0.55">IATA-preferred aviation academy  ·  STED Council certified IT programmes</text>
</svg>`);

  const plate = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="152" height="152"><rect width="152" height="152" rx="30" fill="${CREAM}" stroke="${INK}" stroke-width="4"/></svg>`,
  );
  const ogMark = await sharp(mark, { density: 300 })
    .resize(120, 120, { fit: "contain", background: TRANSPARENT })
    .png()
    .toBuffer();

  await sharp(ogSvg)
    .composite([
      { input: plate, top: 56, left: 68 },
      { input: ogMark, top: 72, left: 84 },
    ])
    .png()
    .toFile("public/og-image.png");

  console.log("assets generated: icon-192, icon-512, maskable-512, apple-touch-icon, og-image");
}

void main();
