import { STORES, idbAll, idbPut, idbClear } from "./idb";

export const PING_INTERVAL_MS = 10 * 60 * 1000;

export const readTrack = () =>
  idbAll(STORES.track).then((rows) => (rows || []).sort((a, b) => a.t - b.t));

export const clearTrack = () => idbClear(STORES.track);

export function savePoint(point) {
  return idbPut(STORES.track, point);
}

export function getFix({ timeout = 20000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation unsupported on this device"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          t: Date.now(),
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: pos.coords.accuracy ?? null,
          alt: pos.coords.altitude ?? null,
          speed: pos.coords.speed ?? null,
        }),
      (err) => reject(new Error(err.message || "Location unavailable")),
      { enableHighAccuracy: true, timeout, maximumAge: 60000 }
    );
  });
}

export function formatCoord(v, decimals = 5) {
  return typeof v === "number" ? v.toFixed(decimals) : "—";
}

export function toDMS(lat, lng) {
  const conv = (val, pos, neg) => {
    const dir = val >= 0 ? pos : neg;
    const abs = Math.abs(val);
    const d = Math.floor(abs);
    const mFull = (abs - d) * 60;
    const m = Math.floor(mFull);
    const s = ((mFull - m) * 60).toFixed(1);
    return `${d}°${m}'${s}"${dir}`;
  };
  return `${conv(lat, "N", "S")} ${conv(lng, "E", "W")}`;
}
