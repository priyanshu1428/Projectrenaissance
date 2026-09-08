import L from "leaflet";
import { STORES, idbGet, idbPut, idbCount, idbClear } from "./idb";

const TILE_HOSTS = ["a", "b", "c"];
const tileUrl = (z, x, y) =>
  `https://${TILE_HOSTS[(x + y) % 3]}.tile.openstreetmap.org/${z}/${x}/${y}.png`;

export const tileKey = (z, x, y) => `${z}/${x}/${y}`;

function lngToX(lng, z) {
  return Math.floor(((lng + 180) / 360) * Math.pow(2, z));
}
function latToY(lat, z) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, z)
  );
}

export function tileListForRegion(lat, lng, { minZoom = 8, maxZoom = 13, radiusKm = 40 } = {}) {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.max(0.15, Math.cos((lat * Math.PI) / 180)));
  const list = [];
  for (let z = minZoom; z <= maxZoom; z++) {
    const x1 = lngToX(lng - dLng, z);
    const x2 = lngToX(lng + dLng, z);
    const y1 = latToY(lat + dLat, z);
    const y2 = latToY(lat - dLat, z);
    const max = Math.pow(2, z) - 1;
    for (let x = Math.max(0, Math.min(x1, x2)); x <= Math.min(max, Math.max(x1, x2)); x++) {
      for (let y = Math.max(0, Math.min(y1, y2)); y <= Math.min(max, Math.max(y1, y2)); y++) {
        list.push([z, x, y]);
      }
    }
  }
  return list;
}

async function fetchAndStore(z, x, y) {
  const key = tileKey(z, x, y);
  const existing = await idbGet(STORES.tiles, key);
  if (existing) return "cached";
  const res = await fetch(tileUrl(z, x, y), { mode: "cors", cache: "no-store" });
  if (!res.ok) throw new Error(`tile ${key} ${res.status}`);
  const blob = await res.blob();
  await idbPut(STORES.tiles, { key, blob, at: Date.now() });
  return "downloaded";
}

export async function prefetchRegion(lat, lng, opts = {}, onProgress) {
  const list = tileListForRegion(lat, lng, opts);
  const total = list.length;
  let done = 0;
  let failed = 0;
  const concurrency = 6;
  let cursor = 0;

  const worker = async () => {
    while (cursor < list.length) {
      const idx = cursor++;
      const [z, x, y] = list[idx];
      try {
        await fetchAndStore(z, x, y);
      } catch {
        failed++;
      }
      done++;
      if (onProgress && done % 3 === 0) onProgress({ done, total, failed });
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  if (onProgress) onProgress({ done, total, failed });
  return { total, failed };
}

export const cachedTileCount = () => idbCount(STORES.tiles);
export const clearTileCache = () => idbClear(STORES.tiles);

// Leaflet tile layer: IndexedDB first, network second (and caches what it fetches)
export const OfflineTileLayer = L.TileLayer.extend({
  createTile: function (coords, done) {
    const img = document.createElement("img");
    img.alt = "";
    const key = tileKey(coords.z, coords.x, coords.y);

    const finish = (src) => {
      img.onload = () => done(null, img);
      img.onerror = () => done(new Error("tile load failed"), img);
      img.src = src;
    };

    idbGet(STORES.tiles, key)
      .then((rec) => {
        if (rec && rec.blob) {
          finish(URL.createObjectURL(rec.blob));
          return;
        }
        if (!navigator.onLine || this.options.forceOffline) {
          done(new Error("offline, tile not cached"), img);
          return;
        }
        fetch(tileUrl(coords.z, coords.x, coords.y), { mode: "cors" })
          .then((res) => (res.ok ? res.blob() : Promise.reject(new Error("bad tile"))))
          .then((blob) => {
            idbPut(STORES.tiles, { key, blob, at: Date.now() }).catch(() => {});
            finish(URL.createObjectURL(blob));
          })
          .catch(() => done(new Error("tile fetch failed"), img));
      })
      .catch(() => done(new Error("idb failed"), img));

    return img;
  },
});

export const createOfflineTileLayer = (options = {}) =>
  new OfflineTileLayer("", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · cached on-device',
    maxZoom: 18,
    ...options,
  });
