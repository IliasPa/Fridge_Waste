/* Generates the app icon: icons/icon.png (512×512) and icons/favicon.svg.
   Not needed to run the app — only if you want to change the icon.
   The PNG is square and full-bleed, so the same file works as the iPhone
   Home Screen icon (iOS rounds the corners), the Android maskable icon (the
   fridge stays inside the safe zone) and the notification icon.
   Usage (from the project folder):  node tools/make-icons.mjs
   Pure Node.js, no packages required. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const OUT = new URL('../icons/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const GREEN_TOP = [46, 157, 106];
const GREEN_BOTTOM = [26, 106, 71];
const WHITE = [255, 255, 255];
const HANDLE = [31, 122, 82];
const LINE = [200, 222, 210];

/* ---------- PNG encoder ---------- */
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- Shapes (unit coordinates 0..1) ---------- */
function inRoundRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

/* Colour of the fridge drawing at (x, y) in 0..1, or null for background. */
function fridge(x, y) {
  if (!inRoundRect(x, y, 0.3, 0.15, 0.7, 0.85, 0.07)) return null;
  if (inRoundRect(x, y, 0.37, 0.23, 0.405, 0.34, 0.017)) return HANDLE;
  if (inRoundRect(x, y, 0.37, 0.47, 0.405, 0.63, 0.017)) return HANDLE;
  if (y > 0.395 && y < 0.418) return LINE;
  return WHITE;
}

/**
 * Renders a square icon.
 * @param opts.scale    how big the fridge is relative to the canvas (1 = full)
 * @param opts.rounded  corner radius for the background (0 = square, full bleed)
 */
function render(w, h, { scale = 1, rounded = 0, ss = 4 } = {}) {
  const buf = Buffer.alloc(w * h * 4);
  const side = Math.min(w, h) * scale;
  const ox = (w - side) / 2;
  const oy = (h - side) / 2;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const X = px + (sx + 0.5) / ss;
          const Y = py + (sy + 0.5) / ss;
          if (rounded && !inRoundRect(X / w, Y / h, 0, 0, 1, 1, rounded)) continue;
          const t = Y / h;
          let col = GREEN_TOP.map((c, i) => c + (GREEN_BOTTOM[i] - c) * t);
          const f = fridge((X - ox) / side, (Y - oy) / side);
          if (f) col = f;
          r += col[0]; g += col[1]; b += col[2]; a += 255;
        }
      }
      const n = ss * ss;
      const i = (py * w + px) * 4;
      const cov = a / 255;
      buf[i] = cov ? r / cov : 0;
      buf[i + 1] = cov ? g / cov : 0;
      buf[i + 2] = cov ? b / cov : 0;
      buf[i + 3] = a / n;
    }
  }
  return png(w, h, buf);
}

const save = (name, data) => { writeFileSync(new URL(name, OUT), data); console.log('wrote icons/' + name); };

save('icon.png', render(512, 512));

writeFileSync(new URL('favicon.svg', OUT), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e9d6a"/><stop offset="1" stop-color="#1a6a47"/></linearGradient></defs>
<rect width="100" height="100" rx="22" fill="url(#g)"/>
<rect x="30" y="15" width="40" height="70" rx="7" fill="#fff"/>
<rect x="30" y="39.5" width="40" height="2.3" fill="#c8ded2"/>
<rect x="37" y="23" width="3.5" height="11" rx="1.7" fill="#1f7a52"/>
<rect x="37" y="47" width="3.5" height="16" rx="1.7" fill="#1f7a52"/>
</svg>
`);
console.log('wrote icons/favicon.svg');
