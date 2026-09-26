/* Barcode scanning (html5-qrcode / ZXing, bundled in lib/ so it works
   offline) and free product lookup in Open Food Facts. */
import { loadScript } from './utils.js';
import { OFF_CATEGORY_RULES } from './defaults.js';

let scanner = null;
let starting = null; // pending camera start, so stop can wait for it

/* Starts the camera inside element #elId and calls onCode(code) once a
   barcode has been read twice in a row (filters out rare misreads). */
export async function startScanner(elId, onCode) {
  await loadScript('lib/html5-qrcode.min.js');
  const lib = window.__Html5QrcodeLibrary__;
  const F = lib.Html5QrcodeSupportedFormats;
  scanner = new lib.Html5Qrcode(elId, {
    verbose: false,
    formatsToSupport: [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E, F.CODE_128, F.CODE_39, F.ITF],
    experimentalFeatures: { useBarCodeDetectorIfSupported: true },
  });
  let last = null;
  let done = false;
  starting = scanner.start(
    { facingMode: 'environment' },
    {
      fps: 12,
      // A wide, short box suits 1D barcodes.
      qrbox: (w, h) => ({ width: Math.floor(w * 0.85), height: Math.floor(Math.min(w, h) * 0.45) }),
      disableFlip: true,
    },
    (text) => {
      if (done) return;
      if (text === last) {
        done = true;
        onCode(text);
      }
      last = text;
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
