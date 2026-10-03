/* Small shared helpers: dates, text, DOM. */

/* ---------- Dates ----------
   Dates are stored as local 'YYYY-MM-DD' strings. They compare correctly
   as strings and never drift across time zones. */
const pad = (n) => String(n).padStart(2, '0');

export function ymd(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseYmd(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const todayStr = () => ymd(new Date());

export function addDays(s, n) {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

/* Adds months, clamping to the month's last day (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(s, n) {
  const d = parseYmd(s);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return ymd(d);
}

/* Whole days from date a to date b (negative if b is earlier). */
export function daysBetween(a, b) {
  return Math.round((parseYmd(b) - parseYmd(a)) / 86400000);
}

/* Whole days from today until the date (negative = in the past). */
export const daysUntil = (s) => daysBetween(todayStr(), s);

export function formatDate(s, lang, withYear) {
  const d = parseYmd(s);
  const opts = { day: 'numeric', month: 'short' };
  if (withYear || d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-GB', opts);
}

export const monthKey = (s) => s.slice(0, 7); // 'YYYY-MM'

/* ---------- Text ---------- */

/* Lowercase, strip accents, unify Greek final sigma — for search and matching. */
export function norm(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ς/g, 'σ')
    .trim();
}

/* Escape user text before putting it into HTML. */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function uid() {
  return (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
}

export function money(n) {
  return (Math.round(n * 100) / 100).toLocaleString('el-GR', { style: 'currency', currency: 'EUR' });
}

/* ---------- DOM / platform ---------- */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const loadedScripts = {};
/* Loads a classic <script> once; resolves when it has run. */
export function loadScript(src) {
  if (!loadedScripts[src]) {
    loadedScripts[src] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => { delete loadedScripts[src]; reject(new Error('Could not load ' + src)); };
      document.head.appendChild(s);
    });
  }
  return loadedScripts[src];
}

export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
/* Browsers built into other apps (Viber, Messenger, Instagram…), which often block the camera. */
export const isInAppBrowser = () => /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|Viber|Line\/|MicroMessenger|Snapchat|TikTok|musical_ly|LinkedInApp/i.test(navigator.userAgent);
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

/* Saves a file. On iPhone the share sheet ("Save to Files", AirDrop…) is the
   most reliable way out of a Home Screen app; elsewhere a normal download. */
export async function saveFile(blob, filename, { preferShare = true } = {}) {
  const file = new File([blob], filename, { type: blob.type });
  if (preferShare && isIOS() && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
      // fall through to a plain download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return 'downloaded';
}
