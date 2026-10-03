/* Reads text from photos, on-device, with Tesseract.js:
   - a printed expiry date (a suggestion — the app always asks you to confirm);
   - a whole supermarket receipt, from photos, screenshots or a PDF.
   The library and its language data (~3 MB for English, ~1.3 MB more for
   Greek) download from a free CDN the first time; the service worker then
   caches them for offline use. PDF receipts are read with pdf.js, which
   takes the text straight from the file when it has some. */
import { loadScript, ymd } from './utils.js';

const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
const PDFJS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/';

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

/* ======================================================================
   Receipts
   ====================================================================== */

/* Languages a receipt can be read in (Tesseract language codes). */
export const RECEIPT_LANGS = {
  ell: 'Ελληνικά', eng: 'English', deu: 'Deutsch', fra: 'Français', ita: 'Italiano', spa: 'Español', nld: 'Nederlands',
  por: 'Português', pol: 'Polski', ces: 'Čeština', ron: 'Română', bul: 'Български', hrv: 'Hrvatski', hun: 'Magyar',
};
const LANG_BY_CODE = { el: 'ell', de: 'deu', fr: 'fra', it: 'ita', es: 'spa', nl: 'nld', pt: 'por', pl: 'pol', cs: 'ces', ro: 'ron', bg: 'bul', hr: 'hrv', hu: 'hun' };

/* The receipt language to start with: the first of the phone's languages we know. */
export function defaultReceiptLang() {
  for (const l of navigator.languages || [navigator.language || 'en']) {
    const code = LANG_BY_CODE[String(l).slice(0, 2).toLowerCase()];
    if (code) return code;
  }
  return 'eng';
}

const isPdf = (file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');

/* Turns pdf.js text pieces into lines, top to bottom, left to right. */
function pdfTextLines(items) {
  const rows = [];
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue;
    const x = it.transform[4];
    const y = it.transform[5];
    const h = Math.abs(it.transform[3]) || it.height || 8;
    let row = rows.find((r) => Math.abs(r.y - y) < h * 0.5);
    if (!row) rows.push(row = { y, parts: [] });
    row.parts.push({ x, s: it.str });
  }
  rows.sort((a, b) => b.y - a.y);
  return rows.map((r) => r.parts.sort((a, b) => a.x - b.x).map((p) => p.s).join('  ').replace(/\s+/g, ' ').trim()).join('\n');
}

/* Each page of a PDF: its text, or a picture of it to read when it has no
   text (a scanned receipt). */
async function pdfPages(file) {
  const pdfjs = await import(PDFJS_URL + 'pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_URL + 'pdf.worker.min.mjs';
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
  const pages = [];
  try {
    for (let n = 1; n <= Math.min(doc.numPages, 10); n++) {
      const page = await doc.getPage(n);
      const text = pdfTextLines((await page.getTextContent()).items);
      if (text.replace(/\s/g, '').length >= 20) {
        pages.push({ text });
      } else {
        const viewport = page.getViewport({ scale: 2.5 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        pages.push({ image: canvas });
      }
    }
  } finally {
    doc.destroy();
  }
  return pages;
}

/* Prepares a receipt photo for the text reader: greyscale, and evens out
   shadows and uneven light by comparing each pixel with its surroundings,
   so the paper turns white and the print dark. Dark-mode screenshots
   (light text on black) are inverted first. */
async function prepareReceipt(source) {
  const bitmap = source instanceof HTMLCanvasElement ? source : await createImageBitmap(source);
  const long = Math.max(bitmap.width, bitmap.height);
  const scale = long > 2400 ? 2400 / long : long < 1200 ? Math.min(2, 1600 / long) : 1;
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  const gray = new Uint8ClampedArray(w * h);
  let total = 0;
  for (let i = 0, p = 0; p < gray.length; i += 4, p++) {
    gray[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    total += gray[p];
  }
  if (total / gray.length < 100) for (let p = 0; p < gray.length; p++) gray[p] = 255 - gray[p];

  // Local average brightness from an integral image (sums of rectangles).
  const W = w + 1;
  const sums = new Uint32Array(W * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += gray[y * w + x];
      sums[(y + 1) * W + x + 1] = sums[y * W + x + 1] + row;
    }
  }
  const r = Math.max(8, Math.round(Math.max(w, h) / 40));
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(w, x + r + 1);
      const mean = (sums[y1 * W + x1] - sums[y0 * W + x1] - sums[y1 * W + x0] + sums[y0 * W + x0]) / ((x1 - x0) * (y1 - y0));
      const ratio = gray[y * w + x] / (mean || 1);
      const v = Math.max(0, Math.min(255, ((ratio - 0.5) / 0.42) * 255));
      const i = (y * w + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/* Reads one receipt from photos, screenshots and/or PDFs, in the order given.
   Returns the text of each part. onStatus(phase, info) reports progress:
   'loading' (getting the reader), 'download' {p} (language data, first time
   only), 'reading' {i, n, p}, 'pdf'. */
export async function readReceipt(files, lang, onStatus) {
  const parts = []; // { text } or { image }, in order
  for (const file of files) {
    if (isPdf(file)) {
      onStatus?.('pdf');
      parts.push(...await pdfPages(file));
    } else {
      parts.push({ image: file });
    }
  }
  const toRead = parts.filter((p) => p.image);
  if (toRead.length) {
    if (!globalThis.WebAssembly) throw Object.assign(new Error('WebAssembly unavailable'), { code: 'unsupported' });
    onStatus?.('loading');
    await loadScript(TESSERACT_URL);
    let i = 0;
    const langs = lang && lang !== 'eng' ? `${lang}+eng` : 'eng';
    const worker = await window.Tesseract.createWorker(langs, 1, {
      logger: (m) => {
        if (m.status === 'loading language traineddata') onStatus?.('download', { p: Math.round((m.progress || 0) * 100) });
        if (m.status === 'recognizing text') onStatus?.('reading', { i: i + 1, n: toRead.length, p: Math.round(m.progress * 100) });
      },
    });
    try {
      // Read the receipt as one block of text, so each product's name and
      // price (far apart on the paper) stay on the same line.
      await worker.setParameters({ tessedit_pageseg_mode: '6', preserve_interword_spaces: '1' });
      for (; i < toRead.length; i++) {
        onStatus?.('reading', { i: i + 1, n: toRead.length, p: 0 });
        const { data } = await worker.recognize(await prepareReceipt(toRead[i].image));
        toRead[i].text = data.text;
      }
    } finally {
      worker.terminate();
    }
  }
  return parts.map((p) => p.text || '');
}
