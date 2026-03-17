/**
 * Generate minimal valid PNG icons for PWA
 * Uses indexed color (1 byte per pixel) for speed
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

function createPNG(size) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10])

  // IHDR: RGB
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2 // 8-bit RGB

  // Build raw scanlines
  const cx = size / 2, cy = size / 2
  const outerR = size * 0.38, innerR = size * 0.18
  const rows = []
  for (let y = 0; y < size; y++) {
    const row = [0] // filter byte
    for (let x = 0; x < size; x++) {
      const d = Math.sqrt((x-cx)**2 + (y-cy)**2)
      if (d <= outerR && d >= innerR) {
        row.push(0x00, 0xcf, 0xfd) // cyan
      } else if (d < innerR) {
        row.push(0x0a, 0x0a, 0x1a) // dark inner
      } else {
        row.push(0x0a, 0x0a, 0x0f) // dark bg
      }
    }
    rows.push(row)
  }
  const raw = Buffer.from(rows.flat())
  const idat = zlib.deflateSync(raw, { level: 1 })

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

const outDir = path.join(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

for (const size of [72, 96, 128, 144, 152, 192, 384, 512]) {
  const png = createPNG(size)
  const p = path.join(outDir, `icon-${size}x${size}.png`)
  fs.writeFileSync(p, png)
  console.log(`icon-${size}x${size}.png  ${png.length}b`)
}
console.log('Done!')
