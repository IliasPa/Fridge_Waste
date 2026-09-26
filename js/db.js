/* Storage. Everything stays on this device.

   Normally uses IndexedDB. Some browsers don't have it at all — Safari in
   Lockdown Mode (every iPhone browser uses Safari's engine) and some private
   or in-app browsers — so the app falls back to localStorage, and if even
   that is blocked, keeps data in memory for the session only.

   Stores:
   - items    : every food item (status 'active', 'eaten' or 'wasted')
   - products : barcodes you've scanned, so names are remembered offline
   - shopping : shopping-list entries
   - meta     : settings and other key/value data */

const DB_NAME = 'fridge-db';
const DB_VERSION = 1;
export const STORES = ['items', 'products', 'shopping', 'meta'];
const KEY_PATHS = { items: 'id', products: 'barcode', shopping: 'id', meta: 'key' };
const FALLBACK_PREFIX = 'fridge-fallback-';

let ready;              // promise of the chosen backend
let backendName = null; // 'indexeddb' | 'localstorage' | 'memory'

/* Which storage is in use (valid after the first read or write). */
export const getBackend = () => backendName;

function init() {
  if (!ready) ready = chooseBackend();
  return ready;
}

async function chooseBackend() {
  // Read it off globalThis: a bare `indexedDB` throws a ReferenceError
  // in browsers that don't define it.
  const idb = globalThis.indexedDB;
  if (idb) {
    try {
      const impl = idbBackend(await openIDB(idb));
      backendName = 'indexeddb';
      await migrateFromFallback(impl);
      return impl;
    } catch (err) {
      console.warn('IndexedDB unavailable, using fallback storage', err);
    }
  }
  const impl = fallbackBackend();
  backendName = impl.persistent ? 'localstorage' : 'memory';
  return impl;
}

/* ---------- IndexedDB ---------- */

function openIDB(idb) {
  return new Promise((resolve, reject) => {
    const req = idb.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const s of STORES) {
        if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: KEY_PATHS[s] });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB blocked'));
  });
}

function idbBackend(db) {
  /* Runs fn(store(s)) in a transaction and resolves when it commits. */
  function tx(storeNames, mode, fn) {
    return new Promise((resolve, reject) => {
      const t = db.transaction(storeNames, mode);
      let result;
      const stores = Array.isArray(storeNames) ? storeNames.map((n) => t.objectStore(n)) : t.objectStore(storeNames);
      const r = fn(stores);
      if (r && 'onsuccess' in r) r.onsuccess = () => { result = r.result; };
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }
  return {
    getAll: (store) => tx(store, 'readonly', (s) => s.getAll()),
    get: (store, key) => tx(store, 'readonly', (s) => s.get(key)),
    put: (store, value) => tx(store, 'readwrite', (s) => s.put(value)),
    del: (store, key) => tx(store, 'readwrite', (s) => s.delete(key)),
    importAll: (data, mode) => tx(STORES, 'readwrite', (stores) => {
      stores.forEach((store, i) => {
        if (mode === 'replace') store.clear();
        for (const row of data[STORES[i]] || []) store.put(row);
      });
    }),
    clearAll: () => tx(STORES, 'readwrite', (stores) => stores.forEach((s) => s.clear())),
  };
}

/* ---------- Fallback: localStorage, or memory only ---------- */

function getLocalStorage() {
  try {
    const ls = globalThis.localStorage;
    ls.setItem('fridge-test', '1');
    ls.removeItem('fridge-test');
    return ls;
  } catch {
    return null; // missing or blocked
  }
}

function fallbackBackend() {
  const ls = getLocalStorage();
  const data = {}; // store name -> { key: row }
  for (const s of STORES) {
    try {
      data[s] = (ls && JSON.parse(ls.getItem(FALLBACK_PREFIX + s))) || {};
    } catch {
      data[s] = {};
    }
  }
  const save = (s) => { if (ls) ls.setItem(FALLBACK_PREFIX + s, JSON.stringify(data[s])); };
  // Return copies, like IndexedDB does, so callers can't change stored rows by accident.
  const copy = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  return {
    persistent: !!ls,
    getAll: async (s) => Object.values(data[s]).map(copy),
    get: async (s, key) => copy(data[s][key]),
    put: async (s, value) => { data[s][value[KEY_PATHS[s]]] = copy(value); save(s); },
    del: async (s, key) => { delete data[s][key]; save(s); },
    importAll: async (incoming, mode) => {
      for (const s of STORES) {
        if (mode === 'replace') data[s] = {};
        for (const row of incoming[s] || []) data[s][row[KEY_PATHS[s]]] = copy(row);
        save(s);
      }
    },
    clearAll: async () => {
      for (const s of STORES) { data[s] = {}; save(s); }
    },
  };
}

/* If this device used the fallback before (e.g. Lockdown Mode was on) and
   IndexedDB now works and is empty, move that data over. */
async function migrateFromFallback(impl) {
  try {
    const ls = getLocalStorage();
    if (!ls) return;
    const data = {};
    let found = false;
    for (const s of STORES) {
      const raw = ls.getItem(FALLBACK_PREFIX + s);
      if (raw) { found = true; data[s] = Object.values(JSON.parse(raw)); }
    }
    if (!found) return;
    if ((await impl.getAll('items')).length) return; // never overwrite existing data
    await impl.importAll(data, 'merge');
    for (const s of STORES) ls.removeItem(FALLBACK_PREFIX + s);
  } catch (err) {
    console.warn('Could not move fallback data to IndexedDB', err);
  }
}

/* ---------- Public API (same whichever storage is used) ---------- */

export const getAll = async (store) => (await init()).getAll(store);
export const get = async (store, key) => (await init()).get(store, key);
export const put = async (store, value) => (await init()).put(store, value);
export const del = async (store, key) => (await init()).del(store, key);

export async function getMeta(key, fallback) {
  const row = await get('meta', key);
  return row ? row.value : fallback;
}
export const setMeta = (key, value) => put('meta', { key, value });

/* Everything, for backups. */
export async function exportAll() {
  const out = {};
  for (const s of STORES) out[s] = await getAll(s);
  return out;
}

/* Restores a backup. mode 'replace' wipes first; 'merge' overwrites same ids. */
export const importAll = async (data, mode) => (await init()).importAll(data, mode);
export const clearAll = async () => (await init()).clearAll();
