/* Reads a printed expiry date from a photo, on-device, with Tesseract.js.
   The library (~5 MB incl. language data) downloads from a free CDN the first
   time you use it; the service worker then caches it for offline use.
   The result is only a suggestion — the app always asks you to confirm. */
import { loadScript, ymd } from './utils.js';

const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';

/* Shrinks the photo and boosts contrast — faster and more accurate. */
async function preprocess(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const c = Math.max(0, Math.min(255, (g - 128) * 1.6 + 128)); // contrast stretch
    d[i] = d[i + 1] = d[i + 2] = c;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export async function recognizeDate(file, onStatus) {
  // Tesseract needs WebAssembly, which e.g. Safari's Lockdown Mode turns off.
  if (!globalThis.WebAssembly) throw Object.assign(new Error('WebAssembly unavailable'), { code: 'unsupported' });
  onStatus?.('loading', 0);
  await loadScript(TESSERACT_URL);
  const worker = await window.Tesseract.createWorker('eng', 1, {
    logger: (m) => { if (m.status === 'recognizing text') onStatus?.('reading', Math.round(m.progress * 100)); },
  });
  try {
    const canvas = await preprocess(file);
    const { data } = await worker.recognize(canvas);
    return { text: data.text, dates: findDates(data.text) };
  } finally {
    worker.terminate();
  }
}

/* ---------- Date parsing ---------- */

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  // Greek abbreviations (in case they are read correctly)
  ιαν: 1, φεβ: 2, μαρ: 3, απρ: 4, μαι: 5, ιουν: 6, ιουλ: 7, αυγ: 8, σεπ: 9, οκτ: 10, νοε: 11, δεκ: 12,
};

function makeDate(y, m, d) {
  if (y < 100) y += 2000;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  const now = new Date().getFullYear();
  if (y < now - 1 || y > now + 6) return null; // implausible for food
  return ymd(dt);
}

const lastDayOfMonth = (y, m) => new Date(y < 100 ? y + 2000 : y, m, 0).getDate();

/* Fixes typical OCR confusions inside number-like chunks: O→0, I/l→1, S→5, B→8. */
function cleanDigits(text) {
  return text.replace(/[0-9OoIlSB][0-9OoIlSB./\-\s]{3,}[0-9OoIlSB]/g, (chunk) => {
    const digits = (chunk.match(/\d/g) || []).length;
    if (digits < 3) return chunk;
    return chunk.replace(/[Oo]/g, '0').replace(/[Il]/g, '1').replace(/S/g, '5').replace(/B/g, '8');
  });
}

/* Returns unique ISO dates found in text. Full dates come first, latest
   first (the expiry is usually the latest date printed on a pack); vaguer
   month/year matches follow. Greek/European order: day before month,
   unless that is impossible. */
export function findDates(rawText) {
  let text = cleanDigits(rawText.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  const exact = new Set();
  const vague = new Set();
  let found = exact;
  const take = (re, fn) => {
    text = text.replace(re, (...m) => {
      const iso = fn(m);
      if (iso) found.add(iso);
      return ' ';
    });
  };
  // 2026-09-30
  take(/\b(20\d{2})\s?[./-]\s?(\d{1,2})\s?[./-]\s?(\d{1,2})\b/g, (m) => makeDate(+m[1], +m[2], +m[3]));
  // 30/09/2026, 30.09.26, 30-9-2026
  take(/\b(\d{1,2})\s?[./-]\s?(\d{1,2})\s?[./-]\s?(\d{4}|\d{2})\b/g, (m) => {
    const a = +m[1], b = +m[2], y = +m[3];
    return makeDate(y, b, a) || makeDate(y, a, b);
  });
  // 30 SEP 2026, 30SEP26
  take(/\b(\d{1,2})\s?([A-Za-zΑ-Ωα-ω]{3,4})\.?\s?(\d{4}|\d{2})\b/g, (m) => {
    const mon = MONTHS[m[2].toLowerCase()];
    return mon ? makeDate(+m[3], mon, +m[1]) : null;
  });
  // compact 30092026 or 300926 (only when it forms a valid date)
  take(/\b(\d{2})(\d{2})(20\d{2}|\d{2})\b/g, (m) => makeDate(+m[3], +m[2], +m[1]));
  found = vague;
  // SEP 2026 (best before end of month). No leading \b: it doesn't work before Greek letters.
  take(/([A-Za-zΑ-Ωα-ω]{3,4})\.?\s?(20\d{2})\b/g, (m) => {
    const mon = MONTHS[m[1].toLowerCase()];
    return mon ? makeDate(+m[2], mon, lastDayOfMonth(+m[2], mon)) : null;
  });
  // 09/2026 or 09.26 (month/year → last day of that month)
  take(/\b(\d{1,2})\s?[./-]\s?(20\d{2}|\d{2})\b/g, (m) => {
    const mon = +m[1], y = +m[2];
    return mon >= 1 && mon <= 12 ? makeDate(y, mon, lastDayOfMonth(y, mon)) : null;
  });
  const byLatest = (set) => [...set].sort().reverse();
  return [...new Set([...byLatest(exact), ...byLatest(vague)])];
}
