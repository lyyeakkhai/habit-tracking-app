import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const publicDir = path.resolve(__dirname, '../public')
const svgPath = path.resolve(publicDir, 'favicon.svg')

const svgBuffer = fs.readFileSync(svgPath)

// Maskable SVG with safe area padding (80% scale centered)
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#031208" />
      <stop offset="100%" stop-color="#092816" />
    </linearGradient>
    <linearGradient id="neonPulse" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#69f0ae" />
      <stop offset="50%" stop-color="#00e676" />
      <stop offset="100%" stop-color="#00c853" />
    </linearGradient>
  </defs>
  <!-- Full bleed background for maskable -->
  <rect width="512" height="512" fill="url(#bgGrad)" />
  
  <!-- Scaled content inside safe zone (within 410px circle) -->
  <g transform="translate(51, 51) scale(0.8)">
    <circle cx="256" cy="256" r="190" fill="none" stroke="#00e676" stroke-width="8" stroke-dasharray="16 12" opacity="0.4" />
    <path
      d="M 276 80 L 150 270 L 250 270 L 236 432 L 362 242 L 262 242 Z"
      fill="url(#neonPulse)"
    />
  </g>
</svg>
`

async function generateIcons() {
  console.log('Generating PWA icons...')

  // 1. pwa-64x64.png
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'pwa-64x64.png'))

  // 2. pwa-192x192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'))

  // 3. pwa-512x512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'))

  // 4. apple-touch-icon.png (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'))

  // 5. maskable-icon-512x512.png
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'maskable-icon-512x512.png'))

  console.log('✅ All PWA icons generated successfully in public/!')
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err)
  process.exit(1)
})
