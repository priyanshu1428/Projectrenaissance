import React, { useEffect, useState } from "react";
import { CloudDownload, HardDrive, FileDown, Check } from "lucide-react";
import { toast } from "sonner";
import { prefetchRegion, cachedTileCount, tileListForRegion } from "../lib/tiles";

export default function OfflineKit({ plan, onSaveVault, savedId }) {
  const [progress, setProgress] = useState(null);
  const [tiles, setTiles] = useState(0);
  const [radiusKm, setRadiusKm] = useState(40);

  const refresh = () => cachedTileCount().then(setTiles).catch(() => {});
  useEffect(() => {
    refresh();
  }, []);

  const coords = plan?.coordinates;
  const estimate = coords
    ? tileListForRegion(Number(coords.lat), Number(coords.lng), { radiusKm }).length
    : 0;

  const download = async () => {
    if (!coords) return;
    setProgress({ done: 0, total: estimate, failed: 0 });
    try {
      const res = await prefetchRegion(
        Number(coords.lat),
        Number(coords.lng),
        { minZoom: 8, maxZoom: 13, radiusKm },
        setProgress
      );
      await refresh();
      toast.success(`Map region cached · ${res.total - res.failed}/${res.total} tiles`);
    } catch (e) {
      toast.error("Tile download failed");
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(plan?.destination || "expedition").replace(/\s+/g, "-").toLowerCase()}-dossier.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pct = progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="parchment-card p-5 sm:p-7" data-testid="offline-kit-panel">
      <div className="caption flex items-center gap-1.5">
        <HardDrive size={12} style={{ color: "var(--gold)" }} /> Offline Kit
      </div>
      <h3 className="font-serif-display text-xl sm:text-2xl mt-1" style={{ color: "var(--text)" }}>
        Cache for no-signal use
      </h3>
      <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
        {tiles} map tiles stored on this device.
      </p>

      <div className="mt-4">
        <label className="caption block mb-1.5">Map radius · {radiusKm} km (~{estimate} tiles)</label>
        <input
          type="range"
          min={10}
          max={80}
          step={10}
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: "var(--gold)" }}
          data-testid="tile-radius-slider"
        />
      </div>

      <button
        onClick={download}
        disabled={!coords || (progress && progress.done < progress.total)}
        className="pill-btn pill-btn-primary w-full mt-3"
        data-testid="download-offline-map-button"
      >
        <CloudDownload size={14} />
        {progress && progress.done < progress.total ? `Caching ${pct}%` : "Download map region"}
      </button>

      {progress && (
        <div className="mt-3" data-testid="tile-download-progress">
          <div className="score-track" style={{ height: 6 }}>
            <div className="score-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-xs mt-1.5 font-mono" style={{ color: "var(--text-muted)" }}>
            {progress.done}/{progress.total} tiles · {progress.failed} failed
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 mt-4">
        <button onClick={onSaveVault} className="pill-btn w-full" data-testid="save-expedition-vault-button">
          {savedId ? <Check size={14} style={{ color: "var(--gold)" }} /> : <HardDrive size={14} />}
          {savedId ? "Saved to offline Vault" : "Save dossier to Vault"}
        </button>
        <button onClick={exportJson} className="pill-btn w-full" data-testid="export-dossier-button">
          <FileDown size={14} /> Download dossier file
        </button>
      </div>
    </div>
  );
}
