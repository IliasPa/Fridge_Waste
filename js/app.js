/* Fridge — main app: state, screens, and user actions.
   Plain JavaScript modules, no framework, no build step. */
import { CATEGORIES, LOCATIONS, LOCATION_EMOJI, QUICK_PICKS, PICK_GROUPS } from './defaults.js';
import { RECIPES } from './recipes.js';
import { t, tr, setLang, getLang, catName, groupName } from './i18n.js';
import * as db from './db.js';
import { todayStr, addDays, addMonths, daysUntil, formatDate, monthKey, norm, esc, uid, money, $, $$, saveFile, isIOS, isStandalone, isInAppBrowser } from './utils.js';
import { cat, pickById, homeLocation, defaultExpiry, openedExpiry, movedExpiry } from './rules.js';
import { buildICS } from './ics.js';
import { startScanner, stopScanner, lookupOFF, scanPhoto, cameraProblem, liveCameraSupported } from './scanner.js';
import { recognizeDate } from './ocr.js';
import { notifyPermission, requestPermission, showNotification, setBackgroundCheck } from './notify.js';
import { ICONS } from './icons.js';

const APP_VERSION = '0.2';

/* ======================================================================
   State
   ====================================================================== */
const DEFAULT_SETTINGS = {
  lang: (navigator.language || 'en').toLowerCase().startsWith('el') ? 'el' : 'en',
  theme: 'auto',          // 'auto' | 'light' | 'dark'
  remindTime: '09:00',
  remindBefore: '1',      // '1' | '2' | '12'
  lastBackup: null,       // ISO date string
  lastIcsExport: 0,       // timestamp; items added after it count as "new"
  notify: false,          // notifications the day before food expires
  notifyBg: false,        // Android background check is set up
};

const state = {
  tab: 'home',
  loc: 'all',           // home filter
  query: '',            // home search
  addQuery: '',         // add-screen search
  showAllRecipes: false,
  statsMonth: monthKey(todayStr()),
  items: [],            // all items (active + finished)
  shopping: [],
  products: new Map(),  // barcode -> remembered product
  settings: { ...DEFAULT_SETTINGS },
};

const active = () => state.items.filter((i) => i.status === 'active');
const finished = () => state.items.filter((i) => i.status !== 'active');
const icon = (name) => ICONS[name] || '';

/* Display name: quick-pick items follow the current language unless renamed. */
function itemName(it) {
  const p = it.pick && !it.renamed && pickById(it.pick);
  return p ? tr(p) : it.name;
}
function itemEmoji(it) {
  const p = it.pick && pickById(it.pick);
  return (p && p.emoji) || cat(it.category).emoji;
}

/* Urgency level for colours: expired / soon (≤2 days) / week (≤5 days) / ok */
function level(it) {
  const d = daysUntil(it.expiresAt);
  if (d < 0) return 'expired';
  if (d <= 2) return 'soon';
  if (d <= 5) return 'week';
  return 'ok';
}

function dueLabel(it) {
  const d = daysUntil(it.expiresAt);
  if (d < 0) return { big: t('expired'), small: t('expiredAgo', { n: -d }) };
  if (d === 0) return { big: t('today'), small: formatDate(it.expiresAt, getLang()) };
  if (d === 1) return { big: t('tomorrow'), small: formatDate(it.expiresAt, getLang()) };
  return { big: t('inDays', { n: d }), small: formatDate(it.expiresAt, getLang()) };
}

const byExpiry = (a, b) => a.expiresAt.localeCompare(b.expiresAt) || itemName(a).localeCompare(itemName(b));

/* ======================================================================
   Persistence helpers
   ====================================================================== */
async function saveItem(it) {
  const i = state.items.findIndex((x) => x.id === it.id);
  if (i >= 0) state.items[i] = it;
  else state.items.push(it);
  await db.put('items', it);
}
async function removeItem(id) {
  state.items = state.items.filter((x) => x.id !== id);
  await db.del('items', id);
}
async function saveSettings(patch) {
  Object.assign(state.settings, patch);
  await db.setMeta('settings', state.settings);
}
async function rememberProduct(p) {
  state.products.set(p.barcode, p);
  await db.put('products', p);
}

/* ======================================================================
   Toast (with optional action buttons, e.g. Undo)
   ====================================================================== */
let toastTimer;
function toast(message, actions = []) {
  const el = $('#toast');
  el.innerHTML = `<span class="toast-msg">${esc(message)}</span>` +
    actions.map((a, i) => `<button class="toast-btn" data-i="${i}">${esc(a.label)}</button>`).join('');
  el.classList.add('show');
  $$('.toast-btn', el).forEach((b) => {
    b.onclick = () => { hideToast(); actions[+b.dataset.i].run(); };
  });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, actions.length ? 6000 : 2500);
}
function hideToast() { $('#toast').classList.remove('show'); }

/* ======================================================================
   Bottom sheets (modals)
   ====================================================================== */
const sheets = [];
function openSheet({ title, html, onMount, onClose, tall }) {
  const root = document.createElement('div');
  root.className = 'sheet-wrap';
  root.innerHTML = `
    <div class="sheet-backdrop"></div>
    <section class="sheet ${tall ? 'tall' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header class="sheet-head">
        <h2>${esc(title)}</h2>
        <button class="icon-btn sheet-close" aria-label="${esc(t('close'))}">${icon('x')}</button>
      </header>
      <div class="sheet-body">${html}</div>
    </section>`;
  document.body.appendChild(root);
  requestAnimationFrame(() => root.classList.add('open'));
  const sheet = { root, onClose };
  const close = () => {
    const i = sheets.indexOf(sheet);
    if (i < 0) return;
    sheets.splice(i, 1);
    onClose?.();
    root.classList.remove('open');
    setTimeout(() => root.remove(), 250);
  };
  sheet.close = close;
  sheets.push(sheet);
  $('.sheet-backdrop', root).onclick = close;
  $('.sheet-close', root).onclick = close;
  onMount?.($('.sheet-body', root), close);
  return close;
}
const closeAllSheets = () => [...sheets].reverse().forEach((s) => s.close());

/* Simple confirm dialog with custom buttons. Resolves with the chosen value. */
function ask(message, buttons) {
  return new Promise((resolve) => {
    let chosen = null;
    openSheet({
      title: '',
      html: `<p class="ask-msg">${esc(message)}</p><div class="stack">` +
        buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-i="${i}">${esc(b.label)}</button>`).join('') + '</div>',
      onMount: (body, close) => {
        $$('button[data-i]', body).forEach((btn) => {
          btn.onclick = () => { chosen = buttons[+btn.dataset.i].value; close(); };
        });
      },
      onClose: () => resolve(chosen),
    });
  });
}

/* ======================================================================
   Rendering: shell, tabs, badge
   ====================================================================== */
function applyTheme() {
  const th = state.settings.theme;
  if (th === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = th;
}

function renderTabbar() {
  $$('.tabbar [data-tab]').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === state.tab);
    const label = $('.tab-label', b);
    if (label) label.textContent = t({ home: 'tabHome', cook: 'tabCook', add: 'tabAdd', shop: 'tabShop', more: 'tabMore' }[b.dataset.tab]);
  });
  updateBadge();
}

/* Badge = items that are expired or expire within 2 days. */
function updateBadge() {
  const n = active().filter((i) => daysUntil(i.expiresAt) <= 2).length;
  const b = $('#homeBadge');
  b.textContent = n > 99 ? '99+' : n;
  b.hidden = n === 0;
  document.title = n ? `(${n}) ${t('appName')}` : t('appName');
  // Home-screen icon badge where supported (iOS 16.4+ needs notification permission).
  try {
    if (n && navigator.setAppBadge) navigator.setAppBadge(n).catch(() => {});
    else if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {});
  } catch { /* not supported */ }
}

function render() {
  renderTabbar();
  const view = $('#view');
  const titles = { home: t('appName'), cook: t('cookTitle'), add: t('addTitle'), shop: t('shopTitle'), more: t('moreTitle') };
  $('#viewTitle').textContent = titles[state.tab];
  ({ home: renderHome, cook: renderCook, add: renderAdd, shop: renderShop, more: renderMore })[state.tab](view);
}

function go(tab) {
  if (state.tab === tab) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  state.tab = tab;
  render();
  window.scrollTo(0, 0);
}

/* ======================================================================
   HOME
   ====================================================================== */
/* Warns when the browser can't use normal storage (see db.js). */
function storageNotice(where) {
  const kind = db.getBackend();
  if (kind === 'memory') return `<p class="note warn">${esc(t('storageMemory'))}</p>`;
  if (kind === 'localstorage' && where === 'more') return `<p class="note">${esc(t('storageBasic'))}</p>`;
  return '';
}

function renderHome(view) {
  const items = active();
  if (!items.length) {
    view.innerHTML = `
      ${storageNotice('home')}
      <div class="empty">
        <div class="empty-emoji">🧊</div>
        <h2>${t('emptyTitle')}</h2>
        <p>${t('emptyText')}</p>
        <button class="btn primary big" data-go="add">${icon('plus')} ${t('addFirst')}</button>
        ${isIOS() && !isStandalone() ? `<p class="hint">${t('installHint')}</p>` : ''}
      </div>`;
    return;
  }
  const count = (loc) => items.filter((i) => loc === 'all' || i.location === loc).length;
  view.innerHTML = `
    ${storageNotice('home')}
    <div class="searchbar">
      ${icon('search')}
      <input id="homeSearch" type="search" placeholder="${esc(t('search'))}" value="${esc(state.query)}" autocomplete="off">
    </div>
    <div class="chips" role="tablist">
      ${['all', ...LOCATIONS].map((l) => `
        <button class="chip ${state.loc === l ? 'on' : ''}" data-loc="${l}">
          ${l === 'all' ? '' : LOCATION_EMOJI[l] + ' '}${t(l)} <span class="chip-n">${count(l)}</span>
        </button>`).join('')}
    </div>
    <div id="homeList"></div>`;
  const input = $('#homeSearch');
  input.oninput = () => { state.query = input.value; renderHomeList(); };
  renderHomeList();
}

function renderHomeList() {
  const list = $('#homeList');
  if (!list) return;
  const q = norm(state.query);
  let items = active().filter((i) => state.loc === 'all' || i.location === state.loc);
  if (q) items = items.filter((i) => norm(itemName(i) + ' ' + (i.brand || '') + ' ' + catName(i.category)).includes(q));
  items.sort(byExpiry);

  if (!items.length) { list.innerHTML = `<p class="muted center pad">${t('noMatch')}</p>`; return; }

  if (q) {
    list.innerHTML = section(t('results'), items);
    return;
  }
  const urgent = items.filter((i) => daysUntil(i.expiresAt) <= 5);
  const rest = items.filter((i) => daysUntil(i.expiresAt) > 5);
  list.innerHTML = (urgent.length ? section(t('useFirst'), urgent, 'use-first') : '') +
    (rest.length ? section(urgent.length ? t('everythingElse') : t('all'), rest) : '');
}

function section(title, items, cls = '') {
  return `<section class="list-section ${cls}">
    <h3 class="section-title">${esc(title)} <span class="muted">${items.length}</span></h3>
    ${items.map(itemCard).join('')}
  </section>`;
}

function itemCard(it) {
  const due = dueLabel(it);
  const lvl = level(it);
  const thumb = it.image
    ? `<img src="${esc(it.image)}" alt="" loading="lazy" onerror="this.replaceWith(document.createTextNode('${itemEmoji(it)}'))">`
    : itemEmoji(it);
  const meta = [
    `${LOCATION_EMOJI[it.location]} ${t(it.location)}`,
    it.openedAt ? t('openedOn') : '',
    it.brand ? esc(it.brand) : '',
  ].filter(Boolean).join(' · ');
  const openLabel = it.openedAt ? `${t('opened')} ✓` : t('opened');
  return `
  <article class="item lvl-${lvl}" data-id="${it.id}">
    <button class="item-main" data-act="edit">
      <span class="thumb">${thumb}</span>
      <span class="info">
        <span class="name">${esc(itemName(it))}${it.qty > 1 ? ` <span class="qty">×${it.qty}</span>` : ''}</span>
        <span class="meta">${meta}</span>
      </span>
      <span class="due"><strong>${esc(due.big)}</strong><small>${esc(due.small)}</small></span>
    </button>
    <div class="item-actions">
      <button data-act="ate" class="act-ate">${icon('check')}<span>${t('ateIt')}</span></button>
      <button data-act="wasted" class="act-waste">${icon('trash')}<span>${t('threwOut')}</span></button>
      <button data-act="open" class="${it.openedAt ? 'on' : ''}" aria-pressed="${!!it.openedAt}">${icon('open')}<span>${openLabel}</span></button>
      <button data-act="move">${icon('move')}<span>${t('move')}</span></button>
    </div>
  </article>`;
}

/* ---------- Item actions ---------- */

/* "Ate it" / "Threw it out". With quantity > 1, one unit is finished and the
   rest stays. Finished items are kept (status eaten/wasted) for stats. */
async function finishItem(id, outcome) {
  const it = state.items.find((x) => x.id === id);
  if (!it) return;
  const before = { ...it };
  let finishedId = it.id;
  const stamp = { status: outcome, finishedAt: todayStr(), finishedTs: Date.now() };
  if ((it.qty || 1) > 1) {
    finishedId = uid();
    await saveItem({ ...it, id: finishedId, qty: 1, ...stamp });
    await saveItem({ ...it, qty: it.qty - 1 });
  } else {
    await saveItem({ ...it, ...stamp });
  }
  refresh();
  const name = itemName(it);
  toast(t(outcome === 'eaten' ? 'markedEaten' : 'markedWasted', { name }), [
    { label: t('undo'), run: async () => {
      if (finishedId !== before.id) await removeItem(finishedId);
      await saveItem(before);
      refresh();
    } },
    { label: t('toList'), run: () => addToShopping(name, before) },
  ]);
}

/* "Opened" is a toggle, so a tap by mistake can be taken back any time:
   the date from before opening is kept and restored. */
async function toggleOpened(id) {
  const it = state.items.find((x) => x.id === id);
  if (!it) return;
  const before = { ...it };
  let msg;
  if (it.openedAt) {
    const restored = it.expiresBeforeOpen || it.expiresAt;
    await saveItem({ ...it, openedAt: null, expiresBeforeOpen: null, expiresAt: restored });
    msg = t('unopenedToast', { date: formatDate(restored, getLang()) });
  } else {
    const newDate = openedExpiry(it);
    await saveItem({ ...it, openedAt: todayStr(), expiresBeforeOpen: it.expiresAt, expiresAt: newDate });
    msg = newDate !== before.expiresAt ? t('openedToast', { date: formatDate(newDate, getLang()) }) : t('openedNoChange');
  }
  refresh();
  toast(msg, [{ label: t('undo'), run: async () => { await saveItem(before); refresh(); } }]);
}

function openMoveSheet(id) {
  const it = state.items.find((x) => x.id === id);
  if (!it) return;
  openSheet({
    title: t('moveTo', { name: itemName(it) }),
    html: `<div class="stack">${LOCATIONS.filter((l) => l !== it.location).map((l) => {
      const d = movedExpiry(it, l);
      return `<button class="btn big loc-btn" data-to="${l}">
        <span>${LOCATION_EMOJI[l]} ${t(l)}</span><small>${t('useBy')}: ${formatDate(d, getLang())}</small></button>`;
    }).join('')}</div>`,
    onMount: (body, close) => {
      $$('[data-to]', body).forEach((b) => {
        b.onclick = async () => {
          close();
          const to = b.dataset.to;
          const before = { ...it };
          const newDate = movedExpiry(it, to);
          // The date from before opening no longer applies after a move.
          await saveItem({ ...it, location: to, expiresAt: newDate, expiresBeforeOpen: null });
          refresh();
          const msg = newDate !== before.expiresAt
            ? t('movedToast', { loc: t(to), date: formatDate(newDate, getLang()) })
            : t('movedSameDate', { loc: t(to) });
          toast(msg, [{ label: t('undo'), run: async () => { await saveItem(before); refresh(); } }]);
        };
      });
    },
  });
}

/* Re-render whatever is on screen, keeping the search box focused. */
function refresh() {
  updateBadge();
  if (state.tab === 'home' && $('#homeList') && active().length) {
    // Refresh counts + list without rebuilding the search input.
    $$('.chips .chip').forEach((c) => {
      const l = c.dataset.loc;
      $('.chip-n', c).textContent = active().filter((i) => l === 'all' || i.location === l).length;
    });
    renderHomeList();
  } else {
    render();
  }
}

/* ======================================================================
   ADD
   ====================================================================== */
function recentItems() {
  const seen = new Set();
  const out = [];
  for (const it of [...state.items].sort((a, b) => (b.addedTs || 0) - (a.addedTs || 0))) {
    const key = norm(itemName(it));
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
    if (out.length >= 8) break;
  }
  return out;
}

function renderAdd(view) {
  view.innerHTML = `
    <div class="add-top">
      <button class="btn primary big" data-act="scan">${icon('barcode')} ${t('scan')}</button>
      <button class="btn big" data-act="manual">${icon('pencil')} ${t('typeIt')}</button>
    </div>
    <div class="searchbar">
      ${icon('search')}
      <input id="addSearch" type="search" placeholder="${esc(t('searchPicks'))}" value="${esc(state.addQuery)}" autocomplete="off" enterkeyhint="go">
    </div>
    <div id="pickArea"></div>`;
  const input = $('#addSearch');
  input.oninput = () => { state.addQuery = input.value; renderPicks(); };
  input.onkeydown = (e) => {
    if (e.key === 'Enter' && input.value.trim()) { e.preventDefault(); addByName(input.value.trim()); }
  };
  renderPicks();
}

function pickTile(p) {
  return `<button class="tile" data-pick="${p.id}"><span class="tile-emoji">${p.emoji}</span><span class="tile-name">${esc(tr(p))}</span></button>`;
}

function renderPicks() {
  const area = $('#pickArea');
  const q = norm(state.addQuery);
  if (q) {
    const picks = QUICK_PICKS.filter((p) => norm(p.en + ' ' + p.el + ' ' + p.id).includes(q));
    const remembered = [...state.products.values()].filter((p) => norm(p.name + ' ' + (p.brand || '')).includes(q)).slice(0, 8);
    area.innerHTML = `
      <div class="grid">
        <button class="tile tile-new" data-act="addNamed">${icon('plus')}<span class="tile-name">${esc(t('addNamed', { name: state.addQuery.trim() }))}</span></button>
        ${picks.map(pickTile).join('')}
        ${remembered.map((p) => `<button class="tile" data-product="${esc(p.barcode)}"><span class="tile-emoji">${cat(p.category).emoji}</span><span class="tile-name">${esc(p.name)}</span></button>`).join('')}
      </div>`;
    return;
  }
  const recent = recentItems();
  area.innerHTML = (recent.length ? `
    <h3 class="section-title">${t('recent')}</h3>
    <div class="grid">${recent.map((it) => `
      <button class="tile" data-recent="${it.id}"><span class="tile-emoji">${itemEmoji(it)}</span><span class="tile-name">${esc(itemName(it))}</span></button>`).join('')}
    </div>` : '') +
    PICK_GROUPS.map((g) => `
      <h3 class="section-title">${esc(groupName(g.id))}</h3>
      <div class="grid">${QUICK_PICKS.filter((p) => p.group === g.id).map(pickTile).join('')}</div>`).join('');
}

/* Guesses a category for a typed name from the quick picks. */
function guessFromName(name) {
  const n = norm(name);
  const words = n.split(/\s+/);
  const p = QUICK_PICKS.find((p) => [p.id, norm(p.en), norm(p.el)].some((x) => x === n || words.some((w) => w.length > 2 && x.split(/\s+/).some((xw) => xw.startsWith(w)))));
  return p ? { category: p.cat, pick: norm(p.en) === n || norm(p.el) === n ? p.id : null } : { category: 'other', pick: null };
}

function addByName(name) {
  const g = guessFromName(name);
  openItemForm({ name, category: g.category, pick: g.pick || undefined });
}

function addFromPick(id) {
  const p = pickById(id);
  openItemForm({ name: tr(p), category: p.cat, pick: p.id });
}

function addFromRecent(id) {
  const it = state.items.find((x) => x.id === id);
  if (!it) return;
  openItemForm({
    name: it.renamed || !it.pick ? it.name : undefined,
    pick: it.pick, renamed: it.renamed, category: it.category, location: it.location,
    brand: it.brand, image: it.image, barcode: it.barcode, price: it.price,
  });
}

/* ======================================================================
   Item form (add + edit)
   ====================================================================== */
function openItemForm(init, { editing = false, note = '' } = {}) {
  const today = todayStr();
  const draft = {
    id: init.id || uid(),
    name: init.name ?? (init.pick ? tr(pickById(init.pick)) : ''),
    pick: init.pick || null,
    renamed: !!init.renamed,
    category: init.category || 'other',
    brand: init.brand || '',
    image: init.image || '',
    barcode: init.barcode || '',
    qty: init.qty || 1,
    price: init.price ?? '',
    openedAt: init.openedAt || null,
    expiresBeforeOpen: init.expiresBeforeOpen || null,
    status: 'active',
    addedAt: init.addedAt || today,
    addedTs: init.addedTs || Date.now(),
  };
  draft.location = init.location || homeLocation(draft.category, draft.pick);
  draft.expiresAt = init.expiresAt || defaultExpiry(draft.category, draft.location, draft.pick);
  let dateTouched = editing;

  const catOptions = Object.keys(CATEGORIES)
    .map((c) => ({ c, label: catName(c) }))
    .sort((a, b) => (a.c === 'other') - (b.c === 'other') || a.label.localeCompare(b.label, getLang()))
    .map(({ c, label }) => `<option value="${c}">${CATEGORIES[c].emoji} ${esc(label)}</option>`).join('');

  const quick = [['plus2d', 2, 'd'], ['plus5d', 5, 'd'], ['plus1w', 7, 'd'], ['plus2w', 14, 'd'], ['plus1m', 1, 'm']];

  openSheet({
    title: editing ? t('editItem') : t('newItem'),
    tall: true,
    html: `
    <form class="item-form" novalidate>
      ${note ? `<p class="note">${esc(note)}</p>` : ''}
      <div class="name-row">
        <span class="thumb big" id="fThumb"></span>
        <label class="grow"><span class="lbl">${t('name')}</span>
          <input name="name" type="text" value="${esc(draft.name)}" autocomplete="off" enterkeyhint="done" required></label>
      </div>
      ${draft.barcode ? `<p class="muted small">${esc(t('barcodeLabel', { code: draft.barcode }))}${draft.brand ? ' · ' + esc(draft.brand) : ''}</p>` : ''}

      <span class="lbl">${t('location')}</span>
      <div class="seg" id="fLoc">
        ${LOCATIONS.map((l) => `<button type="button" data-loc="${l}">${LOCATION_EMOJI[l]} ${t(l)}</button>`).join('')}
      </div>

      <label><span class="lbl">${t('category')}</span>
        <select name="category">${catOptions}</select></label>

      <span class="lbl">${t('useBy')}</span>
      <div class="date-row">
        <input name="expiresAt" type="date" value="${draft.expiresAt}">
        <span class="date-hint" id="fDateHint"></span>
      </div>
      <div class="quick-dates">
        ${quick.map(([k, n, u]) => `<button type="button" class="chip" data-add="${n}" data-unit="${u}">${t(k)}</button>`).join('')}
      </div>
      <button type="button" class="btn subtle" id="fOcr">${icon('camera')} ${t('readDate')}</button>
      <input type="file" accept="image/*" id="fOcrFile" hidden>

      <div class="two-col">
        <label><span class="lbl">${t('qty')}</span>
          <div class="stepper">
            <button type="button" data-step="-1" aria-label="−">−</button>
            <input name="qty" type="number" inputmode="numeric" min="1" value="${draft.qty}">
            <button type="button" data-step="1" aria-label="+">+</button>
          </div></label>
        <label><span class="lbl">${t('price')}</span>
          <input name="price" type="text" inputmode="decimal" placeholder="${esc(t('pricePer'))}" value="${draft.price === '' ? '' : String(draft.price).replace('.', ',')}"></label>
      </div>

      ${editing ? `
      <div class="seg" id="fOpened">
        <button type="button" data-opened="0">${t('notOpened')}</button>
        <button type="button" data-opened="1">${t('markOpened')}</button>
      </div>` : ''}

      <div class="form-actions">
        ${editing ? `<button type="button" class="btn danger" id="fDelete">${icon('trash')} ${t('delete')}</button>` : ''}
        <button type="submit" class="btn primary big grow">${editing ? t('save') : t('add')}</button>
      </div>
    </form>`,
    onMount: (body, close) => {
      const form = $('form', body);
      const f = form.elements;
      f.category.value = draft.category;

      const paintThumb = () => {
        const em = draft.pick && !draft.renamed ? pickById(draft.pick).emoji : cat(draft.category).emoji;
        $('#fThumb', body).innerHTML = draft.image ? `<img src="${esc(draft.image)}" alt="">` : em;
      };
      const paintLoc = () => $$('#fLoc button', body).forEach((b) => b.classList.toggle('on', b.dataset.loc === draft.location));
      const paintDate = () => {
        f.expiresAt.value = draft.expiresAt;
        const d = daysUntil(draft.expiresAt);
        $('#fDateHint', body).textContent = d < 0 ? t('expired') : d === 0 ? t('today') : d === 1 ? t('tomorrow') : t('inDays', { n: d });
      };
      const recompute = () => { if (!dateTouched) { draft.expiresAt = defaultExpiry(draft.category, draft.location, draft.pick); paintDate(); } };
      const paintOpened = () => $$('#fOpened button', body).forEach((b) => b.classList.toggle('on', (b.dataset.opened === '1') === !!draft.openedAt));

      paintThumb(); paintLoc(); paintDate(); paintOpened();

      f.name.oninput = () => {
        draft.name = f.name.value;
        if (draft.pick) draft.renamed = norm(draft.name) !== norm(tr(pickById(draft.pick)));
        paintThumb();
      };
      f.category.onchange = () => { draft.category = f.category.value; paintThumb(); recompute(); };
      $$('#fLoc button', body).forEach((b) => {
        b.onclick = () => {
          const to = b.dataset.loc;
          if (editing && to !== draft.location) {
            // Editing: apply the same rule as the Move button.
            draft.expiresAt = movedExpiry({ ...draft }, to);
            draft.expiresBeforeOpen = null;
            paintDate();
          }
          draft.location = to;
          paintLoc();
          recompute();
        };
      });
      // A date you set yourself wins over the one from before opening.
      const setDate = (date) => { draft.expiresAt = date; draft.expiresBeforeOpen = null; dateTouched = true; paintDate(); };
      f.expiresAt.onchange = () => { if (f.expiresAt.value) setDate(f.expiresAt.value); };
      $$('[data-add]', body).forEach((b) => {
        b.onclick = () => {
          const n = +b.dataset.add;
          setDate(b.dataset.unit === 'm' ? addMonths(today, n) : addDays(today, n));
        };
      });
      $$('[data-step]', body).forEach((b) => {
        b.onclick = () => { f.qty.value = Math.max(1, (parseInt(f.qty.value, 10) || 1) + +b.dataset.step); };
      });
      $$('#fOpened button', body).forEach((b) => {
        b.onclick = () => {
          const want = b.dataset.opened === '1';
          if (want && !draft.openedAt) {
            draft.openedAt = today;
            draft.expiresBeforeOpen = draft.expiresAt;
            draft.expiresAt = openedExpiry({ ...draft });
            paintDate();
          } else if (!want && draft.openedAt) {
            draft.openedAt = null;
            if (draft.expiresBeforeOpen) draft.expiresAt = draft.expiresBeforeOpen;
            draft.expiresBeforeOpen = null;
            paintDate();
          }
          paintOpened();
        };
      });

      // OCR: photo → date suggestions → confirm
      $('#fOcr', body).onclick = () => $('#fOcrFile', body).click();
      $('#fOcrFile', body).onchange = (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (file) openOcrSheet(file, setDate);
      };

      if (editing) {
        $('#fDelete', body).onclick = async () => {
          const ok = await ask(t('confirmDelete'), [{ label: t('delete'), value: true, cls: 'danger' }, { label: t('cancel'), value: false }]);
          if (!ok) return;
          await removeItem(draft.id);
          close();
          refresh();
          toast(t('deleted'));
        };
      }

      form.onsubmit = async (e) => {
        e.preventDefault();
        const name = f.name.value.trim();
        if (!name) { f.name.focus(); toast(t('nameRequired')); return; }
        const price = parseFloat(String(f.price.value).replace(',', '.'));
        const item = {
          ...draft,
          name,
          qty: Math.max(1, parseInt(f.qty.value, 10) || 1),
          price: Number.isFinite(price) && price >= 0 ? price : null,
        };
        if (!editing) {
          // Keep the original record fields when editing; set fresh ones when adding.
          item.addedAt = today;
          item.addedTs = Date.now();
        } else {
          const orig = state.items.find((x) => x.id === item.id);
          Object.assign(item, { status: orig.status, finishedAt: orig.finishedAt, finishedTs: orig.finishedTs });
        }
        await saveItem(item);
        if (item.barcode) {
          await rememberProduct({ barcode: item.barcode, name, brand: item.brand, image: item.image, category: item.category, location: item.location, price: item.price, savedAt: Date.now() });
        }
        close();
        if (!editing) {
          state.addQuery = '';
          toast(t('added', { name }), [{ label: t('undo'), run: async () => { await removeItem(item.id); refresh(); } }]);
        } else {
          toast(t('saved'));
        }
        refresh();
      };

      // Typing a new name: focus the field straight away.
      if (!draft.name) setTimeout(() => f.name.focus(), 300);
    },
  });
}

/* ======================================================================
   Barcode scanner sheet
   ====================================================================== */
/* Help text for why the live camera didn't start (see cameraProblem). */
function cameraHelp(problem) {
  if (isInAppBrowser()) return t('camInApp');
  if (problem === 'unsupported') return t('camUnsupported');
  if (problem === 'denied') {
    return t(isIOS() ? 'camDeniedIOS' : /Android/i.test(navigator.userAgent) ? 'camDeniedAndroid' : 'camDeniedOther');
  }
  return t({ notfound: 'camNotFound', busy: 'camBusy' }[problem] || 'camOther');
}

function openScanSheet() {
  let busy = false;
  let closed = false;
  const closeSheet = openSheet({
    title: t('scanTitle'),
    tall: true,
    html: `
      <div id="scanView" class="scan-view"></div>
      <p class="muted small center" id="scanMsg">${t('scanHint')}</p>
      <p class="note warn" id="scanHelp" hidden></p>
      <div class="stack">
        <label class="btn" id="scanPhotoBtn" for="scanPhotoFile">${icon('camera')} ${t('scanPhoto')}</label>
        <button class="btn subtle" id="scanRetry" type="button" hidden>${t('camRetry')}</button>
      </div>
      <input type="file" accept="image/*" capture="environment" id="scanPhotoFile" hidden>
      <form class="barcode-form" id="barcodeForm">
        <input name="code" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="${esc(t('typeBarcode'))}" autocomplete="off">
        <button class="btn" type="submit">${t('lookUp')}</button>
      </form>`,
    onMount: async (body) => {
      const view = $('#scanView', body);
      const msg = $('#scanMsg', body);
      const help = $('#scanHelp', body);
      const photoBtn = $('#scanPhotoBtn', body);
      const retry = $('#scanRetry', body);

      const handle = async (code) => {
        if (busy) return;
        busy = true;
        msg.hidden = false;
        msg.textContent = t('lookingUp');
        await stopScanner();
        await handleBarcode(code);
        closeSheet();
      };

      // Live camera failed: explain why and point to the photo option.
      const showProblem = (problem) => {
        view.hidden = true;
        msg.hidden = true;
        help.textContent = cameraHelp(problem);
        help.hidden = false;
        photoBtn.classList.add('primary');
        retry.hidden = problem === 'unsupported';
      };

      const startCamera = async () => {
        view.hidden = false;
        msg.hidden = false;
        msg.textContent = t('scanHint');
        help.hidden = true;
        retry.hidden = true;
        try {
          await startScanner('scanView', handle);
          if (closed) stopScanner(); // sheet was closed while the camera was starting
        } catch (err) {
          if (closed || busy) return;
          console.warn(err);
          await stopScanner();
          showProblem(cameraProblem(err));
        }
      };
      retry.onclick = startCamera;

      // Photo with the phone's own camera app: works without camera permission.
      // Free the live camera first so the two don't fight over it.
      photoBtn.onclick = () => {
        stopScanner();
        if (liveCameraSupported()) retry.hidden = false;
      };
      $('#scanPhotoFile', body).onchange = async (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file || busy) return;
        view.hidden = true;
        msg.hidden = false;
        msg.textContent = t('scanPhotoReading');
        const code = await scanPhoto(file).catch(() => null);
        if (closed) return;
        if (code) handle(code);
        else msg.textContent = t('scanPhotoNone');
      };

      $('#barcodeForm', body).onsubmit = (e) => {
        e.preventDefault();
        const code = e.target.elements.code.value.replace(/\D/g, '');
        if (code.length >= 6) handle(code);
      };

      if (liveCameraSupported()) startCamera();
      else showProblem('unsupported');
    },
    onClose: () => { closed = true; stopScanner(); },
  });
}

/* Barcode → remembered product, else Open Food Facts, else ask for a name. */
async function handleBarcode(code) {
  const known = state.products.get(code);
  if (known) {
    openItemForm({ name: known.name, brand: known.brand, image: known.image, category: known.category, location: known.location, price: known.price, barcode: code }, { note: t('fromLocal') });
    return;
  }
  let found = null;
  let note = t('newProduct');
  try {
    found = await lookupOFF(code, getLang());
    if (found) note = t('fromOFF');
  } catch {
    note = t('offline');
  }
  if (found) {
    const name = [found.name, found.quantity].filter(Boolean).join(' ');
    openItemForm({ name, brand: found.brand, image: found.image, category: found.category, barcode: code }, { note });
  } else {
    openItemForm({ name: '', category: 'other', barcode: code }, { note });
  }
}

/* ======================================================================
   OCR sheet — always shows the result for confirmation
   ====================================================================== */
function openOcrSheet(file, onPick) {
  const preview = URL.createObjectURL(file);
  openSheet({
    title: t('ocrTitle'),
    html: `
      <img class="ocr-preview" src="${preview}" alt="">
      <p id="ocrStatus" class="muted">${t('ocrLoading')}</p>
      <div id="ocrChoices" class="quick-dates"></div>
      <div class="date-row" id="ocrManual" hidden>
        <input type="date" id="ocrDate" value="${todayStr()}">
        <button class="btn primary" id="ocrUse">${t('ocrUse')}</button>
      </div>
      <p class="muted small">${t('ocrTip')}</p>`,
    onMount: async (body, close) => {
      const status = $('#ocrStatus', body);
      const manual = $('#ocrManual', body);
      const dateInput = $('#ocrDate', body);
      $('#ocrUse', body).onclick = () => { if (dateInput.value) { onPick(dateInput.value); close(); } };
      try {
        const { dates } = await recognizeDate(file, (phase, p) => {
          status.textContent = phase === 'loading' ? t('ocrLoading') : t('ocrReading', { p });
        });
        manual.hidden = false;
        if (!dates.length) {
          status.textContent = t('ocrNone');
          return;
        }
        status.textContent = t('ocrPick');
        dateInput.value = dates[0];
        $('#ocrChoices', body).innerHTML = dates.slice(0, 6).map((d, i) =>
          `<button class="chip ${i === 0 ? 'on' : ''}" data-date="${d}">${formatDate(d, getLang(), true)}</button>`).join('');
        $$('[data-date]', body).forEach((b) => {
          b.onclick = () => {
            dateInput.value = b.dataset.date;
            $$('[data-date]', body).forEach((x) => x.classList.toggle('on', x === b));
          };
        });
      } catch (err) {
        console.warn(err);
        status.textContent = err.code === 'unsupported' ? t('ocrUnsupported') : t('ocrError', { msg: '' });
        manual.hidden = false;
      }
    },
    onClose: () => URL.revokeObjectURL(preview),
  });
}

/* ======================================================================
   SHOPPING LIST
   ====================================================================== */
async function addToShopping(name, fromItem) {
  const exists = state.shopping.find((s) => !s.done && norm(s.name) === norm(name));
  if (!exists) {
    const entry = { id: uid(), name, done: false, addedTs: Date.now(), pick: fromItem?.pick || null, category: fromItem?.category || null };
    state.shopping.push(entry);
    await db.put('shopping', entry);
  }
  toast(t('addedToList'));
  if (state.tab === 'shop') render();
}

function renderShop(view) {
  const list = [...state.shopping].sort((a, b) => a.done - b.done || a.addedTs - b.addedTs);
  const onList = new Set(state.shopping.filter((s) => !s.done).map((s) => norm(s.name)));
  // Recently finished items, newest first, one per name.
  const seen = new Set();
  const used = finished().sort((a, b) => (b.finishedTs || 0) - (a.finishedTs || 0)).filter((it) => {
    const k = norm(itemName(it));
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 15);

  view.innerHTML = `
    <form class="add-line" id="shopForm">
      <input name="name" type="text" placeholder="${esc(t('addToList'))}" autocomplete="off" enterkeyhint="done">
      <button class="btn primary" type="submit" aria-label="${esc(t('add'))}">${icon('plus')}</button>
    </form>
    ${list.length ? `<ul class="shop-list">${list.map((s) => `
      <li class="${s.done ? 'done' : ''}" data-id="${s.id}">
        <button class="check" data-act="toggle" aria-label="✓">${s.done ? icon('check') : ''}</button>
        <span class="shop-name" data-act="toggle">${esc(s.name)}</span>
        <button class="icon-btn" data-act="remove" aria-label="${esc(t('delete'))}">${icon('x')}</button>
      </li>`).join('')}</ul>
      <div class="row gap">
        ${list.some((s) => s.done) ? `<button class="btn subtle" data-act="clearDone">${t('clearDone')}</button>` : ''}
        ${navigator.share ? `<button class="btn subtle" data-act="shareList">${icon('share')} ${t('shareList')}</button>` : ''}
      </div>` : `<p class="muted center pad">${t('listEmpty')}</p>`}
    ${used.length ? `
      <h3 class="section-title">${t('usedUp')} <span class="muted small">${t('usedUpHint')}</span></h3>
      <ul class="used-list">${used.map((it) => {
        const name = itemName(it);
        const already = onList.has(norm(name));
        return `<li><span>${itemEmoji(it)} ${esc(name)} <small class="muted">${it.status === 'wasted' ? '🗑' : '✓'} ${formatDate(it.finishedAt, getLang())}</small></span>
          <button class="btn small ${already ? 'subtle' : ''}" data-rebuy="${it.id}" ${already ? 'disabled' : ''}>${already ? t('onList') : icon('plus')}</button></li>`;
      }).join('')}</ul>` : ''}`;

  $('#shopForm').onsubmit = async (e) => {
    e.preventDefault();
    const input = e.target.elements.name;
    const name = input.value.trim();
    if (!name) return;
    input.value = '';
    await addToShopping(name);
    setTimeout(() => $('#shopForm input')?.focus(), 50);
  };
}

async function shopAction(act, id) {
  if (act === 'clearDone') {
    for (const s of state.shopping.filter((s) => s.done)) await db.del('shopping', s.id);
    state.shopping = state.shopping.filter((s) => !s.done);
  } else if (act === 'shareList') {
    const text = state.shopping.filter((s) => !s.done).map((s) => '• ' + s.name).join('\n');
    try { await navigator.share({ title: t('shopTitle'), text }); } catch { /* cancelled */ }
    return;
  } else {
    const s = state.shopping.find((x) => x.id === id);
    if (!s) return;
    if (act === 'toggle') { s.done = !s.done; await db.put('shopping', s); }
    if (act === 'remove') { state.shopping = state.shopping.filter((x) => x.id !== id); await db.del('shopping', id); }
  }
  render();
}

/* ======================================================================
   WHAT CAN I COOK?
   ====================================================================== */
function matchesNeed(it, need) {
  if (need.c && need.c.includes(it.category)) return true;
  if (!need.k) return false;
  const words = norm(`${it.name} ${itemName(it)} ${it.pick || ''}`).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return need.k.some((k) => (k.startsWith('=') ? words.includes(norm(k.slice(1))) : words.some((w) => w.startsWith(norm(k)))));
}

/* How much we want to use an item now (higher = more urgent). */
function urgency(it) {
  const d = daysUntil(it.expiresAt);
  if (d < 0) return 2;     // expired — maybe still OK (check it!), lower than "today"
  if (d <= 2) return 6;
  if (d <= 5) return 4;
  if (d <= 10) return 1.5;
  return 0.5;
}

function scoreRecipes() {
  const items = active();
  return RECIPES.map((r) => {
    let score = 0;
    let requiredMet = 0;
    const required = r.needs.filter((n) => !n.opt).length;
    const uses = [];
    const missing = [];
    let hasMain = false; // the first ingredient is the recipe's star
    for (const [idx, need] of r.needs.entries()) {
      const matches = items.filter((it) => matchesNeed(it, need)).sort(byExpiry);
      const best = matches.find((m) => !uses.includes(m)); // don't use the same item twice
      if (best) {
        uses.push(best);
        score += urgency(best);
        if (!need.opt) requiredMet++;
        if (idx === 0) hasMain = true;
      } else if (!need.opt) {
        missing.push(tr(need));
      }
    }
    if (required && requiredMet === required) score += 3; // can cook it now
    const hasUrgent = uses.some((u) => daysUntil(u.expiresAt) <= 5);
    return { r, score, uses, missing, requiredMet, required, hasUrgent, hasMain };
  });
}

function renderCook(view) {
  if (!active().length && !state.showAllRecipes) {
    view.innerHTML = `<div class="empty"><div class="empty-emoji">🍳</div><p>${t('cookEmpty')}</p>
      <button class="btn" data-act="toggleRecipes">${t('showAll')}</button></div>`;
    return;
  }
  const scored = scoreRecipes();
  let list;
  if (state.showAllRecipes) {
    list = scored.sort((a, b) => b.score - a.score);
  } else {
    // Suggest recipes whose main ingredient you have, with at least half their
    // key ingredients, using something that expires within 5 days (or
    // anything, if nothing is urgent).
    const anyUrgent = active().some((i) => daysUntil(i.expiresAt) <= 5);
    list = scored
      .filter((s) => s.hasMain && s.requiredMet >= Math.ceil(s.required / 2) && (s.hasUrgent || !anyUrgent))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }
  view.innerHTML = `
    <p class="muted">${t('cookIntro')}</p>
    ${list.length ? list.map(recipeCard).join('') : `<p class="muted center pad">${t('cookNone')}</p>`}
    <div class="center pad"><button class="btn subtle" data-act="toggleRecipes">${state.showAllRecipes ? t('showSuggestions') : t('showAll')}</button></div>`;
}

function recipeCard({ r, uses, missing }) {
  return `
  <details class="recipe card">
    <summary>
      <span class="recipe-emoji">${r.emoji}</span>
      <span class="recipe-head">
        <strong>${esc(tr(r))}</strong>
        <small class="muted">⏱ ${t('minutes', { n: r.time })}</small>
        ${uses.length ? `<span class="uses">${uses.map((u) => `<span class="pill lvl-${level(u)}">${itemEmoji(u)} ${esc(itemName(u))}</span>`).join('')}</span>` : ''}
        ${missing.length ? `<small class="muted">${t('alsoNeed')}: ${esc(missing.join(', '))}</small>` : ''}
      </span>
    </summary>
    <p class="recipe-steps">${esc(tr(r.steps))}</p>
  </details>`;
}

/* ======================================================================
   MORE: stats, reminders, backup, settings
   ====================================================================== */
function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(getLang() === 'el' ? 'el-GR' : 'en-GB', { month: 'long', year: 'numeric' });
}
function shiftMonth(key, n) { return monthKey(addMonths(key + '-01', n)); }

function monthStats(key) {
  const rows = finished().filter((i) => i.finishedAt && monthKey(i.finishedAt) === key);
  const eaten = rows.filter((i) => i.status === 'eaten');
  const wasted = rows.filter((i) => i.status === 'wasted');
  const n = (list) => list.reduce((s, i) => s + (i.qty || 1), 0);
  const cost = (list) => list.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  return { eaten: n(eaten), wasted: n(wasted), moneyWasted: cost(wasted), hasPrices: rows.some((i) => i.price), wastedRows: wasted };
}

function statsCard() {
  const key = state.statsMonth;
  const s = monthStats(key);
  const total = s.eaten + s.wasted;
  const rate = total ? Math.round((s.wasted / total) * 100) : 0;
  const isCurrent = key === monthKey(todayStr());

  // Top thrown-out items this month
  const counts = {};
  for (const it of s.wastedRows) { const k = itemName(it); counts[k] = (counts[k] || 0) + (it.qty || 1); }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // Last 6 months bars (eaten vs thrown out)
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(monthKey(todayStr()), i - 5));
  const data = months.map((m) => ({ m, ...monthStats(m) }));
  const max = Math.max(1, ...data.map((d) => d.eaten + d.wasted));

  return `
  <section class="card">
    <div class="card-head">
      <h3>${icon('chart')} ${t('stats')}</h3>
    </div>
    <div class="month-nav">
      <button class="icon-btn" data-month="-1" aria-label="‹">${icon('left')}</button>
      <strong>${esc(monthLabel(key))}</strong>
      <button class="icon-btn" data-month="1" ${isCurrent ? 'disabled' : ''} aria-label="›">${icon('right')}</button>
    </div>
    ${total ? `
    <div class="stat-row">
      <div class="stat good"><strong>${s.eaten}</strong><span>${t('eaten')}</span></div>
      <div class="stat bad"><strong>${s.wasted}</strong><span>${t('wasted')}</span></div>
      <div class="stat"><strong>${rate}%</strong><span>${t('wasteRate')}</span></div>
    </div>
    <div class="ratio" role="img" aria-label="${rate}%"><span class="ratio-good" style="flex:${s.eaten}"></span><span class="ratio-bad" style="flex:${s.wasted}"></span></div>
    <p>${t('moneyWasted')}: <strong>${s.hasPrices ? money(s.moneyWasted) : '—'}</strong>${s.hasPrices ? '' : ` <small class="muted">${t('moneyHint')}</small>`}</p>
    ${top.length ? `<p class="small">${t('topWasted')}: ${top.map(([n, c]) => `${esc(n)} ×${c}`).join(', ')}</p>` : ''}
    ` : `<p class="muted">${t('noStats')}</p>`}
    <h4 class="small muted">${t('last6')}</h4>
    <div class="bars">
      ${data.map((d) => `
        <div class="bar-col ${d.m === key ? 'sel' : ''}" data-setmonth="${d.m}">
          <div class="bar-stack" style="height:${Math.round(((d.eaten + d.wasted) / max) * 100)}%">
            <span class="bar-bad" style="flex:${d.wasted}"></span><span class="bar-good" style="flex:${d.eaten}"></span>
          </div>
          <small>${new Date(d.m + '-01T00:00').toLocaleDateString(getLang() === 'el' ? 'el-GR' : 'en-GB', { month: 'short' })}</small>
        </div>`).join('')}
    </div>
    <div class="legend small"><span class="dot good"></span>${t('eaten')} <span class="dot bad"></span>${t('wasted')}</div>
  </section>`;
}

function upcomingForIcs(onlyNew) {
  const today = todayStr();
  return active().filter((i) => i.expiresAt >= today && (!onlyNew || (i.addedTs || 0) > (state.settings.lastIcsExport || 0)));
}

function renderMore(view) {
  const st = state.settings;
  const allN = upcomingForIcs(false).length;
  const newN = upcomingForIcs(true).length;
  const needsBackup = active().length && (!st.lastBackup || daysUntil(st.lastBackup) < -30);
  view.innerHTML = `
    ${statsCard()}

    ${notifyCard()}

    <section class="card">
      <h3>${icon('calendar')} ${t('reminders')}</h3>
      <p class="muted small">${t('remindersText')}</p>
      <div class="two-col">
        <label><span class="lbl">${t('remindTime')}</span><input type="time" id="sTime" value="${st.remindTime}"></label>
        <label><span class="lbl">${t('remindBefore')}</span>
          <select id="sBefore">
            <option value="1">${t('before1')}</option>
            <option value="2">${t('before2')}</option>
            <option value="12">${t('before12')}</option>
          </select></label>
      </div>
      <div class="stack">
        <button class="btn primary" data-act="ics" data-new="0" ${allN ? '' : 'disabled'}>${icon('download')} ${t('icsAll', { n: allN })}</button>
        ${st.lastIcsExport ? `<button class="btn" data-act="ics" data-new="1" ${newN ? '' : 'disabled'}>${icon('download')} ${t('icsNew', { n: newN })}</button>` : ''}
      </div>
      <p class="muted small">${t('icsNote')}</p>
    </section>

    <section class="card">
      <h3>${icon('save')} ${t('backup')}</h3>
      ${storageNotice('more')}
      ${needsBackup ? `<p class="note">${t('backupNudge')}</p>` : ''}
      <p class="muted small">${t('backupText')}</p>
      <div class="row gap">
        <button class="btn primary grow" data-act="export">${icon('download')} ${t('exportData')}</button>
        <button class="btn grow" data-act="import">${icon('upload')} ${t('importData')}</button>
      </div>
      <p class="muted small">${st.lastBackup ? t('lastBackup', { date: formatDate(st.lastBackup, getLang(), true) }) : t('neverBackedUp')}</p>
    </section>

    <section class="card">
      <h3>${icon('settings')} ${t('settings')}</h3>
      <span class="lbl">${t('language')}</span>
      <div class="seg" id="sLang">
        <button data-lang="en" class="${getLang() === 'en' ? 'on' : ''}">English</button>
        <button data-lang="el" class="${getLang() === 'el' ? 'on' : ''}">Ελληνικά</button>
      </div>
      <span class="lbl">${t('theme')}</span>
      <div class="seg" id="sTheme">
        ${['auto', 'light', 'dark'].map((th) => `<button data-theme="${th}" class="${st.theme === th ? 'on' : ''}">${t('theme' + th[0].toUpperCase() + th.slice(1))}</button>`).join('')}
      </div>
      <button class="btn danger subtle" data-act="erase">${icon('trash')} ${t('eraseAll')}</button>
    </section>

    <p class="muted small center pad">${t('about')}<br>Fridge v${APP_VERSION}</p>`;

  $('#sBefore').value = st.remindBefore;
  $('#sTime').onchange = (e) => saveSettings({ remindTime: e.target.value || '09:00' });
  $('#sBefore').onchange = (e) => saveSettings({ remindBefore: e.target.value });
}

/* ---------- Notifications (see notify.js for what's possible without a server) ---------- */

function notifyCard() {
  const perm = notifyPermission();
  const on = state.settings.notify && perm === 'granted';
  let content;
  if (perm === 'unsupported') content = `<p class="note">${t('notifyUnsupported')}</p>`;
  else if (perm === 'install') content = `<p class="note">${t('notifyInstall')}</p>`;
  else if (perm === 'denied') content = `<p class="note warn">${t('notifyDenied')}</p>`;
  else if (on) {
    const how = state.settings.notifyBg ? t('notifyBgNote') : isIOS() ? t('notifyIOSNote') : t('notifyForegroundNote');
    content = `
      <p><strong>${t('notifyIsOn')}</strong></p>
      <p class="muted small">${how}</p>
      <div class="row gap">
        <button class="btn grow" data-act="notifyTest">${t('notifyTest')}</button>
        <button class="btn subtle" data-act="notifyOff">${t('notifyOff')}</button>
      </div>`;
  } else {
    content = `<button class="btn primary" data-act="notifyOn">${icon('bell')} ${t('notifyOn')}</button>`;
  }
  return `
  <section class="card">
    <h3>${icon('bell')} ${t('notifications')}</h3>
    <p class="muted small">${t('notifyText')}</p>
    ${content}
  </section>`;
}

async function turnOnNotifications() {
  const perm = await requestPermission(); // first: needs the tap's user gesture
  if (perm !== 'granted') { toast(t('notifyDeniedToast')); render(); return; }
  const bg = await setBackgroundCheck(true);
  await saveSettings({ notify: true, notifyBg: bg });
  render();
  updateBadge(); // the Home Screen icon badge also needs this permission on iPhone
  await showNotification(t('notifyTestTitle'), t('notifyTestBody'), 'fridge-test').catch((err) => console.warn(err));
  runExpiryNotifications();
}

async function turnOffNotifications() {
  await saveSettings({ notify: false, notifyBg: false });
  setBackgroundCheck(false);
  render();
}

/* Notifies about food that expires tomorrow or today, once per item and
   use-by date (so changing a date notifies again). Runs when the app opens
   or comes back to the screen; sw.js does the same in the background. */
let notifyRunning = false;
async function runExpiryNotifications() {
  if (notifyRunning || !state.settings.notify || notifyPermission() !== 'granted') return;
  notifyRunning = true;
  try {
    const notified = await db.getMeta('notified', {});
    const due = active()
      .filter((i) => { const d = daysUntil(i.expiresAt); return d >= 0 && d <= 1 && notified[i.id] !== i.expiresAt; })
      .sort(byExpiry);
    if (!due.length) return;
    const line = (label, list) => (list.length ? `${label}: ${list.map((i) => `${itemEmoji(i)} ${itemName(i)}`).join(', ')}` : '');
    const body = [
      line(t('today'), due.filter((i) => daysUntil(i.expiresAt) === 0)),
      line(t('tomorrow'), due.filter((i) => daysUntil(i.expiresAt) === 1)),
    ].filter(Boolean).join('\n');
    await showNotification(t('notifyTitle'), body);
    // Remember what was notified; forget items that are gone.
    const activeIds = new Set(active().map((i) => i.id));
    const next = Object.fromEntries(Object.entries(notified).filter(([id]) => activeIds.has(id)));
    for (const i of due) next[i.id] = i.expiresAt;
    await db.setMeta('notified', next);
  } catch (err) {
    console.warn('Notification failed', err);
  } finally {
    notifyRunning = false;
  }
}

async function exportIcs(onlyNew) {
  const items = upcomingForIcs(onlyNew).sort(byExpiry);
  if (!items.length) { toast(t('icsNone')); return; }
  const events = items.map((it) => ({
    uid: `${it.id}-${it.expiresAt}@fridge-pwa`,
    date: it.expiresAt,
    title: `${itemEmoji(it)} ${itemName(it)} — ${t(it.location)}`,
    description: `${t('useBy')}: ${formatDate(it.expiresAt, getLang(), true)}`,
  }));
  const alarms = { 1: [1], 2: [2], 12: [2, 1] }[state.settings.remindBefore] || [1];
  const ics = buildICS(events, { time: state.settings.remindTime, alarms });
  // Safari opens .ics files straight into "Add to Calendar", so download rather than share.
  await saveFile(new Blob([ics], { type: 'text/calendar' }), `fridge-reminders-${todayStr()}.ics`, { preferShare: false });
  await saveSettings({ lastIcsExport: Date.now() });
  toast(t('icsDone', { n: events.length }));
  render();
}

async function exportBackup() {
  const data = await db.exportAll();
  const payload = { app: 'fridge', version: 1, exportedAt: new Date().toISOString(), ...data };
  const blob = new Blob([JSON.stringify(payload, null, 1)], { type: 'application/json' });
  const res = await saveFile(blob, `fridge-backup-${todayStr()}.json`);
  if (res !== 'cancelled') {
    await saveSettings({ lastBackup: todayStr() });
    toast(t('exported'));
    render();
  }
}

async function importBackup(file) {
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch { data = null; }
  if (!data || data.app !== 'fridge' || !Array.isArray(data.items)) { toast(t('importInvalid')); return; }
  const mode = await ask(t('importHow', { n: data.items.length }), [
    { label: t('replace'), value: 'replace', cls: 'primary' },
    { label: t('merge'), value: 'merge' },
    { label: t('cancel'), value: null },
  ]);
  if (!mode) return;
  // Keep this device's settings unless replacing everything.
  if (mode === 'merge') data.meta = (data.meta || []).filter((m) => m.key !== 'settings');
  await db.importAll(data, mode);
  await loadAll();
  applyTheme();
  render();
  toast(t('imported'));
}

async function eraseAll() {
  const ok = await ask(t('confirmErase'), [{ label: t('eraseAll'), value: true, cls: 'danger' }, { label: t('cancel'), value: false }]);
  if (!ok) return;
  const keep = { lang: state.settings.lang, theme: state.settings.theme };
  await db.clearAll();
  await loadAll();
  await saveSettings(keep);
  render();
  toast(t('erased'));
}

/* ======================================================================
   Events (delegated)
   ====================================================================== */
function bindEvents() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('button, [data-act], [data-setmonth]');
    if (!el || el.disabled) return;
    if (el.closest('.sheet')) return; // sheets bind their own handlers

    if (el.dataset.tab) {
      if (el.dataset.tab === 'add' && state.tab === 'add') { openScanSheet(); return; }
      go(el.dataset.tab);
      return;
    }
    if (el.dataset.go) { go(el.dataset.go); return; }
    if (el.dataset.loc) { state.loc = el.dataset.loc; render(); return; }
    if (el.dataset.pick) { addFromPick(el.dataset.pick); return; }
    if (el.dataset.recent) { addFromRecent(el.dataset.recent); return; }
    if (el.dataset.product) { handleBarcode(el.dataset.product); return; }
    if (el.dataset.rebuy) {
      const it = state.items.find((x) => x.id === el.dataset.rebuy);
      if (it) addToShopping(itemName(it), it);
      return;
    }
    if (el.dataset.month) {
      const next = shiftMonth(state.statsMonth, +el.dataset.month);
      if (next <= monthKey(todayStr())) { state.statsMonth = next; render(); }
      return;
    }
    if (el.dataset.setmonth) { state.statsMonth = el.dataset.setmonth; render(); return; }
    if (el.dataset.lang) {
      setLang(el.dataset.lang);
      saveSettings({ lang: el.dataset.lang });
      render();
      return;
    }
    if (el.dataset.theme) { saveSettings({ theme: el.dataset.theme }).then(() => { applyTheme(); render(); }); return; }

    const act = el.dataset.act;
    if (!act) return;
    const card = el.closest('.item');
    const shopRow = el.closest('.shop-list li');
    if (card) {
      const id = card.dataset.id;
      if (act === 'edit') {
        const it = state.items.find((x) => x.id === id);
        openItemForm({ ...it, name: itemName(it) }, { editing: true });
      }
      if (act === 'ate') finishItem(id, 'eaten');
      if (act === 'wasted') finishItem(id, 'wasted');
      if (act === 'open') toggleOpened(id);
      if (act === 'move') openMoveSheet(id);
      return;
    }
    if (shopRow || act === 'clearDone' || act === 'shareList') { shopAction(act, shopRow?.dataset.id); return; }

    switch (act) {
      case 'scan': openScanSheet(); break;
      case 'manual': openItemForm({ name: '', category: 'other' }); break;
      case 'addNamed': addByName(state.addQuery.trim()); break;
      case 'toggleRecipes': state.showAllRecipes = !state.showAllRecipes; render(); break;
      case 'ics': exportIcs(el.dataset.new === '1'); break;
      case 'notifyOn': turnOnNotifications(); break;
      case 'notifyOff': turnOffNotifications(); break;
      case 'notifyTest': showNotification(t('notifyTestTitle'), t('notifyTestBody'), 'fridge-test').catch((err) => console.warn(err)); break;
      case 'export': exportBackup(); break;
      case 'import': $('#importFile').click(); break;
      case 'erase': eraseAll(); break;
    }
  });

  $('#importFile').onchange = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (file) importBackup(file);
  };

  // Dates move on at midnight: refresh when the app comes back to the foreground.
  let lastDay = todayStr();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (todayStr() !== lastDay) {
      lastDay = todayStr();
      state.statsMonth = monthKey(lastDay);
      if (!sheets.length) render(); else updateBadge();
    }
    runExpiryNotifications();
  });
}

/* ======================================================================
   Start-up
   ====================================================================== */
async function loadAll() {
  const [items, shopping, products, settings] = await Promise.all([
    db.getAll('items'), db.getAll('shopping'), db.getAll('products'), db.getMeta('settings', null),
  ]);
  state.items = items;
  state.shopping = shopping;
  state.products = new Map(products.map((p) => [p.barcode, p]));
  state.settings = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  setLang(state.settings.lang);
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw?.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
          toast(t('updateReady'), [{ label: t('reload'), run: () => location.reload() }]);
        }
      });
    });
  }).catch((err) => console.warn('SW registration failed', err));
}

async function init() {
  await loadAll();
  applyTheme();
  bindEvents();
  render();
  registerServiceWorker();
  // Ask the browser not to evict our data under storage pressure.
  navigator.storage?.persist?.().catch(() => {});
  runExpiryNotifications();
  // Deep links from the Home Screen quick actions (manifest shortcuts).
  const tab = new URLSearchParams(location.search).get('tab');
  if (tab && ['home', 'cook', 'add', 'shop', 'more'].includes(tab)) go(tab);
}

init().catch((err) => {
  console.error(err);
  $('#view').innerHTML = `<p class="pad">Something went wrong starting the app: ${esc(err.message)}</p>`;
});
