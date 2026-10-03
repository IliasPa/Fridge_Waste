/* Barcode scanning (html5-qrcode / ZXing, bundled in lib/ so it works
   offline) and free product lookup in Open Food Facts.

   Two ways to scan:
   - live camera in the page (needs the browser's camera permission), and
   - a photo taken with the phone's own camera app (no permission needed),
     for when the live camera is blocked: Lockdown Mode, in-app browsers
     (Viber, Messenger, Instagram…) or a permission that was denied. */
import { loadScript } from './utils.js';
import { OFF_CATEGORY_RULES } from './defaults.js';

let scanner = null;
let starting = null; // pending camera start, so stop can wait for it

async function loadLib() {
  await loadScript('lib/html5-qrcode.min.js');
  return window.__Html5QrcodeLibrary__;
}

function readerOptions(lib) {
  const F = lib.Html5QrcodeSupportedFormats;
  return {
    verbose: false,
    formatsToSupport: [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E, F.CODE_128, F.CODE_39, F.ITF],
    experimentalFeatures: { useBarCodeDetectorIfSupported: true },
  };
}

/* Can this browser use a live camera at all? */
export const liveCameraSupported = () => !!(globalThis.isSecureContext && navigator.mediaDevices?.getUserMedia);

/* Starts the camera inside element #elId and calls onCode(code) each time
   a barcode has been read twice in a row (filters out rare misreads). A code
   is reported again only after it has been out of view for a moment, so a
   pack still in front of the camera isn't counted twice. */
export async function startScanner(elId, onCode) {
  if (!liveCameraSupported()) throw Object.assign(new Error('Live camera not supported'), { name: 'NotSupportedError' });
  const lib = await loadLib();
  scanner = new lib.Html5Qrcode(elId, readerOptions(lib));
  let prev = null;     // last frame's code
  let reported = null; // last code reported, and when it was last seen
  let seenAt = 0;
  starting = scanner.start(
    { facingMode: 'environment' },
    {
      fps: 12,
      // A wide, short box suits 1D barcodes.
      qrbox: (w, h) => ({ width: Math.floor(w * 0.85), height: Math.floor(Math.min(w, h) * 0.45) }),
      disableFlip: true,
    },
    (text) => {
      const now = Date.now();
      if (text === reported) {
        const away = now - seenAt > 2500;
        seenAt = now;
        if (!away) return;
      }
      if (text !== prev) { prev = text; return; }
      prev = null;
      reported = text;
      seenAt = now;
      onCode(text);
    },
    () => {} // per-frame "not found" — ignore
  );
  try {
    await starting;
  } finally {
    starting = null;
  }
}

export async function stopScanner() {
  if (!scanner) return;
  const s = scanner;
  scanner = null;
  if (starting) await starting.catch(() => {});
  try {
    if (s.isScanning) await s.stop();
    s.clear();
  } catch { /* already stopped */ }
}

/* Sorts a camera start-up error into a cause we can explain:
   'unsupported' | 'denied' | 'notfound' | 'busy' | 'other'.
   html5-qrcode reports errors as plain strings, so match on the text. */
export function cameraProblem(err) {
  if (!liveCameraSupported()) return 'unsupported';
  const text = `${err?.name || ''} ${err?.message || ''} ${err}`;
  if (/NotSupported|not supported|doesn't support/i.test(text)) return 'unsupported';
  if (/NotAllowed|Permission|denied|SecurityError/i.test(text)) return 'denied';
  if (/NotFound|DevicesNotFound|Overconstrained/i.test(text)) return 'notfound';
  if (/NotReadable|TrackStart|Could not start/i.test(text)) return 'busy';
  return 'other';
}

/* Draws the photo onto a canvas: scaled so the long side is at most
   maxSide, optionally turned 90° (for barcodes photographed upright). */
function toCanvas(bitmap, maxSide, rotate) {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = rotate ? h : w;
  canvas.height = rotate ? w : h;
  const ctx = canvas.getContext('2d');
  if (rotate) {
    ctx.translate(h, 0);
    ctx.rotate(Math.PI / 2);
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas;
}

const canvasToFile = (canvas) => new Promise((resolve) =>
  canvas.toBlob((blob) => resolve(new File([blob], 'barcode.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.92));

/* Reads a barcode from a photo. Tries a resized copy, the same turned 90°,
   and finally the full-size original. Returns the code, or null. */
export async function scanPhoto(file) {
  const lib = await loadLib();
  const host = document.createElement('div');
  host.id = 'photo-scan-' + Date.now();
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:600px;height:600px;overflow:hidden';
  document.body.appendChild(host);
  const reader = new lib.Html5Qrcode(host.id, readerOptions(lib));
  try {
    const candidates = [];
    try {
      const bitmap = await createImageBitmap(file);
      candidates.push(() => canvasToFile(toCanvas(bitmap, 1600, false)));
      candidates.push(() => canvasToFile(toCanvas(bitmap, 1600, true)));
    } catch { /* can't decode here — the original may still work */ }
    candidates.push(async () => file);
    for (const make of candidates) {
      try {
        return await reader.scanFile(await make(), false);
      } catch { /* no barcode found in this version — try the next */ }
    }
    return null;
  } finally {
    try { reader.clear(); } catch { /* ignore */ }
    host.remove();
  }
}

/* Picks our category from Open Food Facts category tags. */
export function mapCategory(tags = []) {
  const set = new Set(tags);
  for (const [cat, list] of OFF_CATEGORY_RULES) {
    if (list.some((t) => set.has(t))) return cat;
  }
  return 'other';
}

/* Looks a barcode up in Open Food Facts (free, no key).
   Returns {name, brand, image, category} or null if unknown.
   Throws on network failure so the caller can say "offline". */
export async function lookupOFF(code, lang) {
  const fields = 'product_name,product_name_el,product_name_en,generic_name,brands,image_front_small_url,image_small_url,categories_tags,quantity';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`, { signal: ctrl.signal });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    const name = (lang === 'el' && p.product_name_el) || p.product_name || p.product_name_en || p.product_name_el || p.generic_name || '';
    const brand = (p.brands || '').split(',')[0].trim();
    return {
      name: name.trim(),
      brand,
      image: p.image_front_small_url || p.image_small_url || '',
      category: mapCategory(p.categories_tags),
      quantity: p.quantity || '',
    };
  } finally {
    clearTimeout(timer);
  }
}
