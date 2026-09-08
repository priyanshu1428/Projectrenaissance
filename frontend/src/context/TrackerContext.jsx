import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { PING_INTERVAL_MS, getFix, readTrack, savePoint, clearTrack } from "../lib/tracker";

const TrackerContext = createContext(null);
const ENABLED_KEY = "eg_tracking_enabled";

export function TrackerProvider({ children }) {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(ENABLED_KEY) === "1");
  const [track, setTrack] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [nextPingAt, setNextPingAt] = useState(null);
  const timerRef = useRef(null);
  const watchRef = useRef(null);
  const wakeRef = useRef(null);

  useEffect(() => {
    readTrack().then(setTrack).catch(() => {});
  }, []);

  const ping = useCallback(async () => {
    setBusy(true);
    try {
      const point = await getFix();
      await savePoint(point);
      const rows = await readTrack();
      setTrack(rows);
      localStorage.setItem("eg_last_known", JSON.stringify({ lat: point.lat, lng: point.lng, at: new Date(point.t).toISOString() }));
      setError("");
      return point;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setBusy(false);
      setNextPingAt(Date.now() + PING_INTERVAL_MS);
    }
  }, []);

  // 10-minute sampling loop + a warm GPS watch so fixes keep arriving in a backgrounded tab
  useEffect(() => {
    localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
    const stop = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      if (watchRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      if (wakeRef.current) {
        wakeRef.current.release?.().catch(() => {});
        wakeRef.current = null;
      }
    };

    if (!enabled) {
      stop();
      setNextPingAt(null);
      return;
    }

    ping().catch(() => {});
    timerRef.current = setInterval(() => ping().catch(() => {}), PING_INTERVAL_MS);

    if (navigator.geolocation) {
      watchRef.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const rows = await readTrack();
          const last = rows[rows.length - 1];
          if (last && Date.now() - last.t < PING_INTERVAL_MS) return;
          const point = {
            t: Date.now(),
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            acc: pos.coords.accuracy ?? null,
            alt: pos.coords.altitude ?? null,
            speed: pos.coords.speed ?? null,
          };
          await savePoint(point);
          setTrack(await readTrack());
          localStorage.setItem("eg_last_known", JSON.stringify({ lat: point.lat, lng: point.lng, at: new Date(point.t).toISOString() }));
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 120000, timeout: 60000 }
      );
    }

    if ("wakeLock" in navigator) {
      navigator.wakeLock
        .request("screen")
        .then((lock) => {
          wakeRef.current = lock;
        })
        .catch(() => {});
    }

    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const reset = useCallback(async () => {
    await clearTrack();
    setTrack([]);
  }, []);

  const last = track.length ? track[track.length - 1] : null;

  return (
    <TrackerContext.Provider
      value={{ enabled, setEnabled, track, last, ping, busy, error, nextPingAt, reset }}
    >
      {children}
    </TrackerContext.Provider>
  );
}

export const useTracker = () => useContext(TrackerContext);
