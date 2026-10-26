const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputPath = 'C:/Users/HP/.gemini/antigravity-ide/brain/ff365e91-e724-4709-8f87-243eff7fd135/.user_uploaded/media_1793023788857.jpg';

async function processLogo() {
  console.log('Processing logo from:', inputPath);

  // SVG circle mask matching the golden ring radius (~482px)
  const maskSvg = Buffer.from(
    '<svg width="1024" height="1024">' +
    '<circle cx="508" cy="508" r="482" fill="white"/>' +
    '</svg>'
  );

  // 1. High-res transparent-corner circular logo
  const logoMarkBuffer = await sharp(inputPath)
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Save to public/logo-mark.png
  fs.writeFileSync(path.join(__dirname, '../public/logo-mark.png'), logoMarkBuffer);
  fs.writeFileSync(path.join(__dirname, '../public/logo-mark-square.png'), logoMarkBuffer);
  fs.writeFileSync(path.join(__dirname, '../public/logo-full.png'), logoMarkBuffer);
  console.log('Wrote public/logo-mark.png, logo-mark-square.png, logo-full.png');

  // 2. Favicons and app icons
  const iconSizes = [
    { name: 'icon-192.png', size: 192, dir: '../public/icons' },
    { name: 'icon-512.png', size: 512, dir: '../public/icons' },
    { name: 'apple-touch-icon.png', size: 180, dir: '../public/icons' },
    { name: 'maskable-512.png', size: 512, dir: '../public/icons' },
  ];

  for (const item of iconSizes) {
    const outDir = path.join(__dirname, item.dir);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    await sharp(logoMarkBuffer)
      .resize(item.size, item.size)
      .png()
      .toFile(path.join(outDir, item.name));
    console.log(`Generated ${item.name} (${item.size}x${item.size})`);
  }

  // Next.js App Router root icons
  await sharp(logoMarkBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '../public/favicon.ico'));

  await sharp(logoMarkBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '../src/app/favicon.ico'));

  await sharp(logoMarkBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(__dirname, '../src/app/icon.png'));

  await sharp(logoMarkBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(__dirname, '../src/app/apple-icon.png'));

  console.log('All logo and favicon assets created successfully!');
}

processLogo().catch(err => {
  console.error('Error processing logo:', err);
  process.exit(1);
});
