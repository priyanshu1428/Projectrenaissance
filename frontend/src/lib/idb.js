const DB_NAME = "expedition_guardian";
const DB_VERSION = 1;
export const STORES = {
  expeditions: "expeditions",
  tiles: "tiles",
  track: "track",
  gear: "gear",
  meta: "meta",
};

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.expeditions))
        db.createObjectStore(STORES.expeditions, { keyPath: "id" });
      if (!db.objectStoreNames.contains(STORES.tiles))
        db.createObjectStore(STORES.tiles, { keyPath: "key" });
      if (!db.objectStoreNames.contains(STORES.track))
        db.createObjectStore(STORES.track, { keyPath: "t" });
      if (!db.objectStoreNames.contains(STORES.gear))
        db.createObjectStore(STORES.gear, { keyPath: "id" });
      if (!db.objectStoreNames.contains(STORES.meta))
        db.createObjectStore(STORES.meta, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx(store, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.onerror = () => reject(t.error);
    if (req) {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } else {
      t.oncomplete = () => resolve(true);
    }
  });
}

export const idbPut = (store, value) => tx(store, "readwrite", (s) => s.put(value));
export const idbGet = (store, key) => tx(store, "readonly", (s) => s.get(key));
export const idbAll = (store) => tx(store, "readonly", (s) => s.getAll());
export const idbDelete = (store, key) => tx(store, "readwrite", (s) => s.delete(key));
export const idbClear = (store) => tx(store, "readwrite", (s) => s.clear());
export const idbCount = (store) => tx(store, "readonly", (s) => s.count());
