import React, { useEffect, useState } from "react";
import { Satellite, MapPin, Copy, Trash2, RefreshCw, Info } from "lucide-react";
import { toast } from "sonner";
import { useTracker } from "../context/TrackerContext";
import { formatCoord, toDMS, PING_INTERVAL_MS } from "../lib/tracker";

const rel = (t) => {
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m ago`;
};

export default function TrackerPanel() {
  const { enabled, setEnabled, track, last, ping, busy, error, nextPingAt, reset } = useTracker();
  const [, setTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setTick((v) => v + 1), 30000);
    return () => clearInterval(i);
  }, []);

  const copyLast = async () => {
    if (!last) return;
    await navigator.clipboard.writeText(`${last.lat},${last.lng}`);
    toast.success("Coordinates copied");
  };

  const countdown = nextPingAt ? Math.max(0, Math.round((nextPingAt - Date.now()) / 60000)) : null;

  return (
    <div className="parchment-card p-5 sm:p-7" data-testid="gps-tracker-panel">
      <div className="caption flex items-center gap-1.5">
        <Satellite size={12} style={{ color: "var(--gold)" }} /> GPS Breadcrumb
      </div>
      <h3 className="font-serif-display text-xl sm:text-2xl mt-1" style={{ color: "var(--text)" }}>
        Last known position
      </h3>

      <div className="flex flex-col gap-2 mt-4">
        <button
          onClick={() => setEnabled(!enabled)}
          className={`pill-btn w-full ${enabled ? "" : "pill-btn-primary"}`}
          data-testid="tracking-toggle-button"
          style={enabled ? { borderColor: "#B94040", color: "#B94040" } : undefined}
        >
          <Satellite size={14} /> {enabled ? "Stop 10-min tracking" : "Start 10-min tracking"}
        </button>
        <div className="flex gap-2">
          <button onClick={() => ping().then(() => toast.success("Position logged")).catch((e) => toast.error(e.message))} disabled={busy} className="pill-btn flex-1" data-testid="manual-ping-button">
            <RefreshCw size={13} className={busy ? "animate-spin" : ""} /> Ping now
          </button>
          <button onClick={() => reset().then(() => toast.success("Trail cleared"))} className="pill-btn" style={{ padding: "0.55rem 0.75rem" }} data-testid="clear-track-button">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {enabled && (
        <div className="text-xs mt-3 font-mono" style={{ color: "var(--text-muted)" }} data-testid="tracking-status">
          TRACKING ACTIVE · next fix in ~{countdown ?? Math.round(PING_INTERVAL_MS / 60000)} min
        </div>
      )}

      {error && (
        <div className="text-sm mt-3 p-2.5 rounded" style={{ color: "#B94040", border: "1px solid #B94040" }} data-testid="tracker-error">
          {error}
        </div>
      )}

      {last ? (
        <div className="mt-4 p-4 rounded" style={{ backgroundColor: "var(--badge)", border: "1px solid var(--border-gold)" }} data-testid="last-known-position-card">
          <div className="caption flex items-center gap-1.5">
            <MapPin size={11} style={{ color: "#B94040" }} /> Last fix · {rel(last.t)}
          </div>
          <div className="font-mono text-base mt-1.5 break-all" style={{ color: "var(--text)" }} data-testid="last-known-coords-value">
            {formatCoord(last.lat)}, {formatCoord(last.lng)}
          </div>
          <div className="font-mono text-xs mt-1 break-all" style={{ color: "var(--text-muted)" }}>
            {toDMS(last.lat, last.lng)}
          </div>
          <div className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
            {new Date(last.t).toLocaleString()} · ±{last.acc ? Math.round(last.acc) : "?"}m
            {last.alt != null ? ` · ${Math.round(last.alt)}m alt` : ""}
          </div>
          <button onClick={copyLast} className="pill-btn mt-3 w-full" style={{ padding: "0.35rem 0.85rem", fontSize: "0.72rem" }} data-testid="copy-coords-button">
            <Copy size={12} /> Copy coordinates
          </button>
        </div>
      ) : (
        <p className="text-sm mt-4" style={{ color: "var(--text-muted)" }}>
          No fixes logged yet. Start tracking to drop a breadcrumb every 10 minutes onto your offline map.
        </p>
      )}

      {track.length > 0 && (
        <div className="mt-4">
          <div className="caption mb-2">Trail · {track.length} fixes</div>
          <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1" data-testid="track-point-list">
            {[...track].reverse().slice(0, 40).map((p, i) => (
              <li key={p.t} className="flex items-baseline justify-between gap-2 text-xs py-1" style={{ borderBottom: "1px solid var(--border-gold)" }} data-testid={`track-point-${i}`}>
                <span className="font-mono shrink-0" style={{ color: "var(--gold)" }}>#{track.length - i}</span>
                <span className="font-mono flex-1 break-all" style={{ color: "var(--text)" }}>
                  {formatCoord(p.lat, 4)}, {formatCoord(p.lng, 4)}
                </span>
                <span className="shrink-0" style={{ color: "var(--text-muted)" }}>
                  {new Date(p.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2 mt-4 text-xs p-2.5 rounded" style={{ color: "var(--text-muted)", border: "1px solid var(--border-gold)" }}>
        <Info size={13} className="shrink-0 mt-0.5" style={{ color: "var(--gold)" }} />
        <span>
          GPS works with no signal — fixes come from satellites, not the network, and are stored on-device.
          Browsers can only sample position while Expedition Guardian is running, so install the app and keep it
          open in the background for the full 10-minute cadence.
        </span>
      </div>
    </div>
  );
}
