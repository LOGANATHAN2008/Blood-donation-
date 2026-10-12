import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputLogo = path.join(__dirname, '../public/logo.png');
const outDir = path.join(__dirname, '../public/brand');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function generateAssets() {
  console.log('Generating brand assets from logo.png...');
  
  if (!fs.existsSync(inputLogo)) {
    console.error(`Input logo not found at ${inputLogo}`);
    // If logo.png is in public/brand/logo.png as prompt suggests, let's copy it or read from there
    const altInput = path.join(__dirname, '../public/brand/logo.png');
    if (!fs.existsSync(altInput)) {
      process.exit(1);
    }
    fs.copyFileSync(altInput, inputLogo);
  }

  // Generate WebP versions
  const sizes = [256, 512, 1024];
  for (const size of sizes) {
    await sharp(inputLogo)
      .resize(size)
      .webp({ quality: 90 })
      .toFile(path.join(outDir, `logo-${size}.webp`));
  }

  // Generate Favicon (32x32 PNG)
  await sharp(inputLogo)
    .resize(32, 32)
    .png()
    .toFile(path.join(outDir, 'favicon-32x32.png'));

  // Generate Apple Touch Icon
  await sharp(inputLogo)
    .resize(180, 180)
    .flatten({ background: '#FFF7F8' })
    .png()
    .toFile(path.join(outDir, 'apple-touch-icon.png'));

  // Generate PWA Icons
  for (const size of [192, 512]) {
    await sharp(inputLogo)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, `pwa-${size}x${size}.png`));
      
    // Maskable icon with padding
    await sharp(inputLogo)
      .resize(Math.round(size * 0.7)) // give it padding
      .extend({
        top: Math.round(size * 0.15),
        bottom: Math.round(size * 0.15),
        left: Math.round(size * 0.15),
        right: Math.round(size * 0.15),
        background: '#FFF7F8'
      })
      .png()
      .toFile(path.join(outDir, `pwa-maskable-${size}x${size}.png`));
  }

  // Open Graph Image (1200x630)
  // Create a blush background and composite the logo on top
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 255, g: 247, b: 248, alpha: 1 }
    }
  })
    .composite([
      {
        input: await sharp(inputLogo).resize(400).toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile(path.join(outDir, 'og-image.png'));

  console.log('✅ Brand assets generated successfully!');
}

generateAssets().catch(console.error);
