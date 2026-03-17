const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const outDir = path.join(__dirname, '..', 'public', 'icons')

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

sizes.forEach((s) => {
  const r = Math.round(s * 0.22)
  const cx = s / 2
  const cy = Math.round(s * 0.44)
  const cr = Math.round(s * 0.18)
  const bx = Math.round(s * 0.26)
  const by = Math.round(s * 0.65)
  const bw = Math.round(s * 0.48)
  const bh = Math.round(s * 0.06)
  const br = Math.round(s * 0.03)
  const b2x = Math.round(s * 0.32)
  const b2y = Math.round(s * 0.75)
  const b2w = Math.round(s * 0.36)
  const b2h = Math.round(s * 0.05)

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">`,
    `  <rect width="${s}" height="${s}" rx="${r}" fill="#0a0a0f"/>`,
    `  <circle cx="${cx}" cy="${cy}" r="${cr}" fill="#00cffd"/>`,
    `  <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${br}" fill="#00cffd" opacity="0.7"/>`,
    `  <rect x="${b2x}" y="${b2y}" width="${b2w}" height="${b2h}" rx="${Math.round(s * 0.025)}" fill="#00cffd" opacity="0.4"/>`,
    `</svg>`,
  ].join('\n')

  const filename = path.join(outDir, `icon-${s}x${s}.svg`)
  fs.writeFileSync(filename, svg, 'utf8')
  console.log(`Created: icon-${s}x${s}.svg`)
})

console.log('Done! All SVG icons generated in public/icons/')
console.log('Note: For production, convert SVGs to PNGs using a tool like sharp or Inkscape.')
