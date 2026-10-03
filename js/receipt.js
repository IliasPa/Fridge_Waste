/* Receipts: turns the text of a supermarket receipt into food lines, and
   recognises lines you've identified before.

   The text comes from a photo or screenshot (read on this device by ocr.js)
   or from a PDF receipt. Layouts differ between chains and countries, so the
   parser relies on what most receipts share:
   - an item line ends in a price, often followed by a VAT code
     ("ΓΑΛΑ ΦΡΕΣΚΟ 1L   1,19 Β", "Milch 1,5%  0,99 A");
   - quantities and weights sit on their own line, before or after the item
     ("2 x 0,89", "0,826 kg x 1,49 EUR/kg  1,23");
   - discounts are negative lines under the item they apply to;
   - the list of items ends at the total ("ΣΥΝΟΛΟ", "SUMME", "TOTAL"…).
   Nothing here leaves the device. */
import { norm, todayStr, addDays } from './utils.js';
import { QUICK_PICKS, RECEIPT_HINTS, NOT_FOOD_WORDS } from './defaults.js';

/* ---------- Text folding ----------
   Receipts are printed in capitals, and the text reader often mixes Greek
   and Latin capitals that look the same (Α/A, Ρ/P, Η/H…). Folding maps those
   to one form, drops accents and punctuation, and lowercases, so the same
   line reads the same every time. Only used for matching, never shown. */
const HOMOGLYPHS = { α: 'a', β: 'b', ε: 'e', ζ: 'z', η: 'h', ι: 'i', κ: 'k', μ: 'm', ν: 'n', ο: 'o', ρ: 'p', τ: 't', υ: 'y', χ: 'x' };
export function fold(s) {
  return norm(s)
    .replace(/[αβεζηικμνορτυχ]/g, (c) => HOMOGLYPHS[c])
    .replace(/[^\p{L}\p{N}%]+/gu, ' ')
    .trim();
}

/* The key a receipt line is remembered by. */
export const lineKey = (text) => fold(text);

/* ---------- Keywords ----------
   'word' matches that whole word (or words); 'word*' any word starting with it. */
const kw = (list) => list.map((w) => ({ w: fold(w), prefix: w.endsWith('*') }));
const startsWithKw = (f, list) => list.find(({ w, prefix }) => (prefix ? f.startsWith(w) : f === w || f.startsWith(w + ' ')));

const TOTAL = kw(['συνολο', 'γενικο συνολο', 'πληρωτεο', 'πληρωτεο ποσο', 'total', 'totaal', 'totale', 'summe', 'gesamt', 'gesamtbetrag',
  'zu zahlen', 'betrag', 'a pagar', 'importe', 'razem', 'suma', 'celkem', 'ukupno', 'osszesen', 'to pay', 'balance due', 'amount due',
  'montant', 'net a payer']);
// Words allowed after a total keyword ("ΣΥΝΟΛΟ ΕΥΡΩ", "SUMME EUR"). Anything
// else means it's a product that happens to start with one ("TOTAL 2% ΦΑΓΕ").
const TOTAL_EXTRA = new Set(['eur', 'euro', 'ευρω', 'ποσο', 'αποδειξησ', 'αγορων', 'προσ', 'πληρωμη', 'πληρωμησ', 'e', 'ttc', 'eu'].map(fold));
const SUBTOTAL = kw(['υποσυνολο', 'μερικο συνολο', 'subtotal', 'sub total', 'zwischensumme', 'sous total', 'subtotale', 'subtotaal']);
const PAYMENT = kw(['καρτ*', 'πιστωτικ*', 'χρεωστικ*', 'μετρητ*', 'ρεστα', 'ανεπαφ*', 'πληρωμη*', 'τροποσ πληρωμ*', 'visa', 'mastercard',
  'maestro', 'amex', 'cash', 'bar', 'barzahlung', 'bargeld', 'karte', 'kartenzahlung', 'ec', 'ec karte', 'girocard', 'rueckgeld',
  'ruckgeld', 'wechselgeld', 'change', 'contactless', 'debit*', 'credit*', 'card', 'efectivo', 'tarjeta', 'cambio', 'carte', 'especes',
  'rendu', 'contanti', 'bancomat', 'resto', 'pin', 'pinnen', 'gegeven', 'wisselgeld', 'gotowka', 'karta', 'reszta', 'payment*', 'paid',
  'apple pay', 'google pay']);
const INFO = kw(['φπα', 'φ π α', 'mwst', 'ust', 'vat', 'iva', 'tva', 'btw', 'netto', 'brutto', 'καθαρη αξια', 'καθ αξια', 'αφμ', 'tax*',
  'steuer*', 'ποντοι', 'punkte', 'points', 'bonus*', 'εξοικονομ*', 'κερδισ*', 'sie sparen', 'gespart', 'you saved', 'ersparnis',
  'τεμαχια', 'anzahl', 'artikel', 'items', 'αριθμοσ ειδων', 'ειδη']);
const DISCOUNT = kw(['εκπτωσ*', 'εκπτ', 'προσφορ*', 'rabatt*', 'preisvorteil*', 'preisvort*', 'nachlass', 'discount*', 'remise',
  'reduction', 'sconto', 'descuento', 'korting', 'kupon*', 'coupon*', 'κουπον*', 'aktion*', 'promo*', 'lidl plus*', 'gutschein*',
  'μειωσ*', 'offer*', 'saving*']);

/* Stem lists from defaults.js: 'stem' = words starting with it, '=word' = that word only. */
const stems = (list) => list.map((s) => (s.startsWith('=') ? { w: fold(s.slice(1)), exact: true } : { w: fold(s), exact: false }));
const stemHit = (word, list) => list.some(({ w, exact }) => (exact ? word === w : word.startsWith(w)));
const NOT_FOOD = stems(NOT_FOOD_WORDS);
const HINTS = RECEIPT_HINTS.map(([cat, list]) => [cat, stems(list)]);

/* ---------- Prices, quantities, dates ---------- */

// OCR confusions inside price-like tokens: O→0, I/l/|→1, S→5 (Greek Ο, Ι too).
// Short tokens (VAT codes like "Ἐ") lose stray accents.
const PRICEISH = /^[-€]?[\dOoΟοIlΙ|S]{1,4}[,.][\dOoΟοIlΙ|S]{2}-?$/;
function fixPriceChars(line) {
  return line.split(' ').map((tok) => {
    if (PRICEISH.test(tok) && /\d/.test(tok)) return tok.replace(/[OoΟο]/g, '0').replace(/[IlΙ|]/g, '1').replace(/S/g, '5');
    if (tok.length <= 2) return tok.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return tok;
  }).join(' ');
}

const cleanLine = (s) => fixPriceChars(s.replace(/[\t ]/g, ' ').replace(/^[\s|_~"'`.:;]+|[\s|_~"'`]+$/g, '').replace(/\s+/g, ' '));

// A price at the end of a line, with an optional sign, currency and VAT code:
// "1,19", "1.19 B", "-0,30", "0,30-", "€ 1,19", "1,19 EUR", "6,98 13%", "1,19 *".
// The reader sometimes glues the VAT code on ("1,198" for "1,19 Β").
const END_PRICE = /(^|\s)(-\s?)?(?:€\s?|eur\s)?(\d{1,4})\s?[,.]\s?(\d{2})(\s?-)?(?:\s?€|\seur)?(?:\s*[a-eα-ε]\d?|\s?\*{1,2}|\s+\d{1,2}(?:[.,]\d{1,2})?\s?%|\s*\d)?\s*$/iu;

function matchPrice(line) {
  const m = END_PRICE.exec(line);
  if (!m) return null;
  return { value: +`${m[3]}.${m[4]}`, negative: !!(m[2] || m[5]), index: m.index + m[1].length };
}

// "2 x 0,89", "2 ΤΕΜ x 0,89", "0,826 kg x 1,49 EUR/kg  1,23". Any short unit
// is accepted, as the reader often garbles it ("Κα" for "kg").
const QTY = /^(\d{1,3}(?:[,.]\d{1,3})?)\s*(\p{L}{1,4}\.?)?\s*[x×*χ]\s*(?:€\s?)?(\d{1,4}[,.]\d{2,3})(?:\s?(?:€|eur|ευρω))?(?:\s?\/\s?\p{L}+\.?)?/iu;
const num = (s) => +s.replace(',', '.');
const round2 = (n) => Math.round(n * 100) / 100;
const near = (a, b) => Math.abs(a - b) <= 0.03;

function matchQty(line) {
  const m = QTY.exec(line);
  if (!m) return null;
  const after = line.slice(m[0].length);
  // A product name after it means an item line ("6 x 0,33L COLA 3,99").
  if (letters(after.replace(/eur|ευρω/giu, '')) >= 3) return null;
  const amount = num(m[1]);
  const unit = num(m[3]);
  const weighed = /[,.]/.test(m[1]) || /^(kg|κιλ|g)/i.test(m[2] || '');
  const rest = matchPrice(after);
  return {
    qty: weighed ? 1 : Math.max(1, Math.round(amount)),
    weight: weighed ? amount : null,
    unit,
    total: rest ? rest.value : round2(amount * unit),
    hasTotal: !!rest,
  };
}

// Inline quantity inside an item line: "ΓΙΑΟΥΡΤΙ 2 x 0,89", "2x ΓΙΑΟΥΡΤΙ".
const INLINE_QTY = /(?:^|\s)(\d{1,3})\s?[x×*χ]\s?(\d{1,4}[,.]\d{2})(?=\s|$)/iu;
const LEADING_QTY = /^(\d{1,2})\s?[x×*χ]\s+(?=\p{L})/iu;

const DATE_DMY = /(?:^|\D)(\d{1,2})\s?[./-]\s?(\d{1,2})\s?[./-]\s?(20\d{2}|\d{2})(?!\d)/;
const DATE_YMD = /(?:^|\D)(20\d{2})[./-](\d{1,2})[./-](\d{1,2})(?!\d)/;

function validDate(y, m, d) {
  if (y < 100) y += 2000;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/* A full date on the line, or null. Day comes before month (European). */
function findDate(line) {
  let m = DATE_YMD.exec(line);
  if (m) return validDate(+m[1], +m[2], +m[3]);
  m = DATE_DMY.exec(line);
  if (m) return validDate(+m[3], +m[2], +m[1]) || validDate(+m[3], +m[1], +m[2]);
  return null;
}

const letters = (s) => (s.match(/\p{L}/gu) || []).length;

// Common VAT rates printed next to the price ("ΓΑΛΑ 13%  1,19").
const VAT_RATE = /\s(?:5[.,]5|6|7|9|10|13|19|20|21|24)\s?%$/;

function cleanName(s) {
  return s
    .replace(/^\d{5,}\s+/, '')               // article number in front
    .replace(/^[\s\-–—:*#.,]+|[\s\-–—:*#.,]+$/g, '')
    .replace(VAT_RATE, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const skipName = (f) => [TOTAL, SUBTOTAL, PAYMENT, INFO].some((list) => startsWithKw(f, list));

function isTotal(f) {
  const k = startsWithKw(f, TOTAL);
  if (!k) return false;
  return f.slice(k.w.length).split(' ').filter(Boolean).every((w) => TOTAL_EXTRA.has(w));
}

const isNotFood = (text) => fold(text).split(' ').some((w) => stemHit(w, NOT_FOOD));

/* ---------- Store ---------- */
const STORES = [
  ['Lidl', ['lidl']], ['ΑΒ Βασιλόπουλος', ['βασιλοπουλ', 'vassilopoul', 'ab food']], ['Σκλαβενίτης', ['σκλαβενιτ', 'sklavenit']],
  ['My Market', ['my market', 'mymarket']], ['Μασούτης', ['μασουτ', 'masout']], ['Κρητικός', ['κρητικοσ', 'kritikos']],
  ['Γαλαξίας', ['γαλαξια', 'galaxias']], ['Bazaar', ['bazaar']], ['Market In', ['market in']], ['Carrefour', ['carrefour']],
  ['Aldi', ['aldi']], ['Hofer', ['hofer']], ['Rewe', ['rewe']], ['Edeka', ['edeka']], ['Kaufland', ['kaufland']], ['Penny', ['penny']],
  ['Spar', ['spar', 'eurospar', 'interspar']], ['Billa', ['billa']], ['Tesco', ['tesco']], ['Sainsbury’s', ['sainsbury']],
  ['Mercadona', ['mercadona']], ['Auchan', ['auchan']], ['Leclerc', ['leclerc']], ['Intermarché', ['intermarche']],
  ['Albert Heijn', ['albert heijn']], ['Jumbo', ['jumbo']], ['Esselunga', ['esselunga']], ['Conad', ['conad']], ['Coop', ['coop']],
  ['Biedronka', ['biedronka']], ['Continente', ['continente']], ['Pingo Doce', ['pingo doce']], ['Migros', ['migros']],
  ['Delhaize', ['delhaize']], ['Colruyt', ['colruyt']],
].map(([name, list]) => [name, list.map(fold)]);

function findStore(lines) {
  // The chain name is printed at the top; look there first, then anywhere.
  for (const part of [lines.slice(0, 10), lines]) {
    const f = ` ${part.map(fold).join(' ')} `;
    for (const [name, list] of STORES) if (list.some((w) => f.includes(` ${w} `) || f.includes(` ${w}`) && w.length >= 6)) return name;
  }
  return '';
}

/* ---------- Parser ----------
   Returns {
     rows:  [{ text, qty, weight, unit, total, discount, notFood }],
     total: the printed total, or null,
     date:  'YYYY-MM-DD' if a plausible purchase date was found, else null,
     store: chain name, or '',
     sum:   what the rows add up to (to check against the total) } */
export function parseReceipt(rawText, today = todayStr()) {
  const lines = rawText.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const rows = [];
  let total = null;
  // The purchase date is often printed at the bottom, after the total.
  const date = lines.map(findDate).find((d) => d && d <= today && d >= addDays(today, -90)) || null;
  let pendingNames = []; // lines with a name but no price yet
  let pendingQty = null; // a quantity line seen before its item
  let last = null;       // the last item, for quantity and discount lines after it

  const add = (name, lineTotal, q) => {
    let text = cleanName(name);
    let qty = 1;
    let weight = null;
    const inl = INLINE_QTY.exec(text);
    const col = /\s(\d{1,4})[,.](\d{2})$/.exec(text);
    if (inl && near(+inl[1] * num(inl[2]), lineTotal)) {
      // Quantity inside the item line: "ΓΙΑΟΥΡΤΙ 2 x 0,89  1,78"
      qty = +inl[1];
      text = cleanName(text.slice(0, inl.index) + ' ' + text.slice(inl.index + inl[0].length));
    } else if (col) {
      // A unit-price column before the total: "[2] ΓΙΑΟΥΡΤΙ  0,89  1,78"
      const unit = +`${col[1]}.${col[2]}`;
      const lead = /^(\d{1,3})\s+(?=\p{L})/u.exec(text);
      if (lead && near(+lead[1] * unit, lineTotal)) {
        qty = +lead[1];
        text = cleanName(text.slice(lead[0].length, col.index));
      } else if (unit > 0 && near(Math.round(lineTotal / unit) * unit, lineTotal)) {
        qty = Math.max(1, Math.round(lineTotal / unit));
        text = cleanName(text.slice(0, col.index));
      }
    } else {
      const lead = LEADING_QTY.exec(text);
      if (lead) { qty = +lead[1]; text = cleanName(text.slice(lead[0].length)); }
    }
    if (q && near(q.total, lineTotal)) {
      qty = q.qty;
      weight = q.weight;
    }
    if (letters(text) < 2 || skipName(fold(text))) return;
    last = { text, qty, weight, total: lineTotal, discount: 0, notFood: isNotFood(text) };
    rows.push(last);
  };

  for (const line of lines) {
    if (findDate(line)) continue;

    const q = matchQty(line);
    if (q) {
      // "Name" then "2 x 3,49  6,98". Without its own total, a quantity line
      // belongs to an item line instead, so the store's header isn't taken
      // for a name.
      if (pendingNames.length && q.hasTotal) {
        add(pendingNames.pop(), q.total, q);
        pendingNames = [];
      } else if (last && last.qty === 1 && !last.weight && near(last.total, q.weight ? q.weight * q.unit : q.qty * q.unit)) {
        last.qty = q.qty;   // detail line under its item: "2 x 0,89"
        last.weight = q.weight;
      } else {
        pendingQty = q;
      }
      continue;
    }

    const p = matchPrice(line);
    if (!p) {
      if (letters(line) >= 2) pendingNames = [...pendingNames.slice(-2), line];
      continue;
    }
    const name = line.slice(0, p.index);
    const f = fold(name);
    if (isTotal(f)) { total = p.value; break; }
    if (startsWithKw(f, PAYMENT)) break;
    if (startsWithKw(f, SUBTOTAL) || startsWithKw(f, INFO)) continue;
    if (p.negative && isNotFood(name)) {
      // Returned bottles ("Leergut -0,25"): not food, but part of the total.
      rows.push({ text: cleanName(name), qty: 1, weight: null, total: -p.value, discount: 0, notFood: true });
      continue;
    }
    // A discount for the item above it. A positive line counts as one only if
    // it's short ("ΕΚΠΤΩΣΗ 0,50"), so "ΠΡΟΣΦΟΡΑ ΓΑΛΑ 1+1 2,38" stays an item.
    if (p.negative || (startsWithKw(f, DISCOUNT) && f.split(' ').length <= 3 && last && p.value <= last.total)) {
      if (last) {
        last.discount = round2(last.discount + p.value);
        last.total = Math.max(0, round2(last.total - p.value));
      }
      continue;
    }
    if (letters(name) < 2) {
      // A price on its own line belongs to the name just above it.
      if (pendingNames.length) add(pendingNames.pop(), p.value, pendingQty);
      pendingNames = [];
      pendingQty = null;
      continue;
    }
    add(name, p.value, pendingQty);
    pendingNames = [];
    pendingQty = null;
  }

  // The same product on several lines becomes one row with a quantity.
  const merged = [];
  for (const r of rows) {
    const unit = round2(r.total / r.qty);
    const same = !r.weight && merged.find((m) => !m.weight && lineKey(m.text) === lineKey(r.text) && near(m.unit, unit));
    if (same) {
      same.qty += r.qty;
      same.total = round2(same.total + r.total);
      same.discount = round2(same.discount + r.discount);
    } else {
      merged.push({ ...r, unit });
    }
  }
  const sum = round2(merged.reduce((s, r) => s + r.total, 0));
  return { rows: merged, total, date, store: findStore(lines), sum };
}

/* ---------- Several photos of one receipt ----------
   A long receipt (or a digital one) is often shot in parts that overlap.
   Drops the lines of each part that repeat the end of the part before it:
   at least two lines in a row must match, so a product bought twice
   isn't lost. */
export function mergeTexts(texts) {
  let out = [];
  for (const text of texts) {
    const next = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    let cut = 0;
    if (out.length >= 2) {
      const tail1 = fold(out[out.length - 1]);
      const tail2 = fold(out[out.length - 2]);
      for (let j = Math.min(next.length - 1, 40); j >= 1; j--) {
        if (similar(fold(next[j]), tail1) && similar(fold(next[j - 1]), tail2)) { cut = j + 1; break; }
      }
    }
    out = out.concat(next.slice(cut));
  }
  return out.join('\n');
}

/* ---------- Similarity ---------- */
function bigrams(s) {
  const out = new Map();
  for (let i = 0; i < s.length - 1; i++) {
    const g = s.slice(i, i + 2);
    out.set(g, (out.get(g) || 0) + 1);
  }
  return out;
}

/* Dice coefficient on letter pairs: 1 = same, 0 = nothing in common. */
export function dice(a, b) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const A = bigrams(a);
  const B = bigrams(b);
  let common = 0;
  for (const [g, n] of A) common += Math.min(n, B.get(g) || 0);
  return (2 * common) / (a.length - 1 + b.length - 1);
}
const similar = (a, b) => a.length >= 3 && dice(a, b) >= 0.85;

/* ---------- Matching ---------- */

/* The remembered entry for a receipt line: the same line, or one that differs
   only by a misread letter or two. Numbers must match exactly, so "2%" and
   "5%" versions of a product are never confused. */
export function findRemembered(text, memory) {
  const key = lineKey(text);
  if (memory[key]) return memory[key];
  const digits = (s) => (s.match(/\d+/g) || []).join(' ');
  const want = digits(key);
  let best = null;
  let bestScore = 0.84;
  for (const k in memory) {
    if (digits(k) !== want) continue;
    const score = dice(k, key);
    if (score > bestScore) { best = memory[k]; bestScore = score; }
  }
  return best;
}

/* How well a receipt word matches a word of a food name:
   an abbreviation of it ("ΝΤΟΜ" → ντομάτες) or the same stem ("Tomaten" → tomatoes). */
function wordMatch(w, x) {
  if (w.length < 3 || x.length < 3) return 0;
  if (x.startsWith(w)) return w.length;
  let cp = 0;
  while (cp < w.length && cp < x.length && w[cp] === x[cp]) cp++;
  return cp >= 3 && cp >= 0.6 * Math.max(w.length, x.length) && Math.abs(w.length - x.length) <= 3 ? Math.min(w.length, x.length) : 0;
}

/* Quick-pick names split into alternatives ("Ζαμπόν / γαλοπούλα"), each with
   its main word: the first in Greek, the last in English ("Greek yogurt"). */
const PICK_NAMES = QUICK_PICKS.map((p) => {
  const variants = [];
  for (const [text, headFirst] of [[p.el, true], [p.en, false]]) {
    for (const alt of text.replace(/\(.*?\)/g, ' ').split('/')) {
      const words = fold(alt).split(' ').filter((w) => w.length >= 3);
      if (words.length) variants.push({ words, head: headFirst ? words[0] : words[words.length - 1] });
    }
  }
  return { p, variants };
});

/* Guesses what a receipt line is.
   Returns { pick, category } for a quick-pick food (e.g. tomatoes),
   { category } when only the kind of food is clear, or null. */
const hintFor = (word) => HINTS.find(([, list]) => stemHit(word, list))?.[0];

export function guessFood(text) {
  const words = fold(text).split(' ').filter((w) => w.length >= 3 && !/\d/.test(w));
  const firstKind = words.length && hintFor(words[0]);
  let best = null;
  for (const { p, variants } of PICK_NAMES) {
    for (const v of variants) {
      // Receipts name the product first. The food's main word must be one of
      // the first two words ("ΤΥΡΙ ΓΚΟΥΝΤΑ ΦΕΤΕΣ" is cheese slices, not feta),
      // and only the first if that one already says what kind of food it is
      // ("ΑΝΑΨΥΚΤΙΚΟ ΠΟΡΤ." is an orange soft drink, not oranges).
      const at = words.slice(0, 2).findIndex((w) => wordMatch(w, v.head));
      if (at < 0 || (at > 0 && firstKind && firstKind !== p.cat)) continue;
      const score = words.reduce((s, w) => s + Math.max(0, ...v.words.map((x) => wordMatch(w, x))), 0);
      if (score >= 4 && score > (best?.score ?? 0)) best = { score, pick: p.id, category: p.cat };
    }
  }
  if (best) return { pick: best.pick, category: best.category };
  for (const w of words) {
    const kind = hintFor(w);
    if (kind) return { category: kind };
  }
  return null;
}

/* Restricted-circulation barcodes (in-store labels with weight or price
   inside, e.g. from the deli counter) differ every time: don't remember them. */
export const isStoreCode = (code) => /^2\d{12}$/.test(code || '') || /^2\d{7}$/.test(code || '');
