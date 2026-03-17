/**
 * Generate maskable PNG icons for PWA
 * Maskable icons need content within the central 80% (safe zone)
 * Background fills the full square
 */

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

function crc32(buf) {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    table[i] = c
  }
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const t = Buffer.from(type)
  const c = Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, c])
}

function createMaskablePNG(size) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2 // 8-bit RGB

  // Maskable: full background + icon centered in 80% safe zone
  const cx = size / 2, cy = size / 2
  // Safe zone = 80% of size, so icon radius within 40% of size
  const outerR = size * 0.28  // ring outer (within safe zone)
  const innerR = size * 0.13  // ring inner

  const rows = []
  for (let y = 0; y < size; y++) {
    const row = [0]
    for (let x = 0; x < size; x++) {
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      if (d <= outerR && d >= innerR) {
        row.push(0x00, 0xcf, 0xfd) // cyan ring
      } else {
        row.push(0x0a, 0x0a, 0x0f) // dark bg covers entire square
      }
    }
    rows.push(Buffer.from(row))
  }

  const raw = Buffer.concat(rows)
  const idat = zlib.deflateSync(raw, { level: 1 })

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ])
}

const outDir = path.join(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

for (const size of [192, 512]) {
  const png = createMaskablePNG(size)
  const p = path.join(outDir, `icon-${size}x${size}-maskable.png`)
  fs.writeFileSync(p, png)
  console.log(`icon-${size}x${size}-maskable.png  ${png.length}b`)
}
console.log('Done!')
