/* Tiny promise wrapper around IndexedDB. Everything stays on this device.

   Stores:
   - items    : every food item (status 'active', 'eaten' or 'wasted')
   - products : barcodes you've scanned, so names are remembered offline
   - shopping : shopping-list entries
   - meta     : settings and other key/value data */

const DB_NAME = 'fridge-db';
const DB_VERSION = 1;
export const STORES = ['items', 'products', 'shopping', 'meta'];

let dbPromise;

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'barcode' });
        if (!db.objectStoreNames.contains('shopping')) db.createObjectStore('shopping', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

/* Runs fn(store(s)) in a transaction and resolves when it commits. */
async function tx(storeNames, mode, fn) {
  const db = await open();
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

export const getAll = (store) => tx(store, 'readonly', (s) => s.getAll());
export const get = (store, key) => tx(store, 'readonly', (s) => s.get(key));
export const put = (store, value) => tx(store, 'readwrite', (s) => s.put(value));
export const del = (store, key) => tx(store, 'readwrite', (s) => s.delete(key));

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
export function importAll(data, mode) {
  return tx(STORES, 'readwrite', (stores) => {
    stores.forEach((store, i) => {
      const name = STORES[i];
      if (mode === 'replace') store.clear();
      for (const row of data[name] || []) store.put(row);
    });
  });
}

export function clearAll() {
  return tx(STORES, 'readwrite', (stores) => stores.forEach((s) => s.clear()));
}
