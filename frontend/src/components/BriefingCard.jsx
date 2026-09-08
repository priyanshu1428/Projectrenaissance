import React from "react";
import { Cloud, Mountain, Droplets, AlertTriangle, MapPin, Save } from "lucide-react";

export default function BriefingCard({ briefing, onSaveToVault, saved }) {
  if (!briefing) return null;
  const { destination, region, coordinates, weather, terrain, water_sources = [], medical_hazards = [], language } = briefing;

  return (
    <div className="parchment-card p-6 sm:p-8 animate-fade-up" data-testid="destination-briefing-card">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="caption">Dossier</div>
          <h2 className="font-serif-display text-3xl sm:text-4xl mt-1" style={{ color: "var(--text)" }}>
            {destination}
          </h2>
          <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {region}
            {coordinates && (
              <span className="ml-2 font-mono text-xs">
                · {Number(coordinates.lat).toFixed(3)}, {Number(coordinates.lng).toFixed(3)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onSaveToVault}
          data-testid="save-to-vault-button"
          className="pill-btn pill-btn-primary"
          disabled={saved}
        >
          <Save size={14} />
          {saved ? "Saved to Vault" : "Save to Vault"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Block icon={<Cloud size={16} />} title="Weather" testId="weather-info-block">
          <div className="text-sm" style={{ color: "var(--text)" }}>
            <span className="font-medium">{weather?.current_season}</span>
            <span className="mx-2" style={{ color: "var(--text-muted)" }}>·</span>
            <span>{weather?.temperature_range}</span>
          </div>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>{weather?.conditions}</p>
        </Block>
        <Block icon={<Mountain size={16} />} title="Terrain" testId="terrain-info-block">
          <div className="text-sm" style={{ color: "var(--text)" }}>
            <span className="font-medium capitalize">{terrain?.type}</span>
            <span className="mx-2" style={{ color: "var(--text-muted)" }}>·</span>
            <span>{terrain?.elevation}</span>
          </div>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>{terrain?.description}</p>
        </Block>
        <Block icon={<Droplets size={16} />} title="Water Sources" testId="water-sources-block">
          <ul className="space-y-2 text-sm">
            {water_sources.map((w, i) => (
              <li key={i} className="flex gap-2">
                <ReliabilityDot level={w.reliability} />
                <div>
                  <div style={{ color: "var(--text)" }} className="font-medium">{w.name}</div>
                  <div style={{ color: "var(--text-muted)" }} className="text-xs">{w.notes}</div>
                </div>
              </li>
            ))}
          </ul>
        </Block>
        <Block icon={<AlertTriangle size={16} />} title="Medical Hazards" testId="medical-hazards-block">
          <ul className="space-y-2 text-sm">
            {medical_hazards.map((h, i) => (
              <li key={i} className="flex gap-2">
                <SeverityDot level={h.severity} />
                <div>
                  <div style={{ color: "var(--text)" }} className="font-medium">{h.name}</div>
                  <div style={{ color: "var(--text-muted)" }} className="text-xs">{h.advice}</div>
                </div>
              </li>
            ))}
          </ul>
        </Block>
      </div>

      {language?.primary && (
        <div className="mt-5 flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <MapPin size={14} style={{ color: "var(--gold)" }} />
          <span>
            Regional language detected: <span className="font-medium" style={{ color: "var(--text)" }}>{language.primary}</span>
            {language.dialect_note && <span> — {language.dialect_note}</span>}
          </span>
        </div>
      )}
    </div>
  );
}

function Block({ icon, title, children, testId }) {
  return (
    <div
      className="p-4 rounded"
      data-testid={testId}
      style={{ backgroundColor: "var(--badge)", border: "1px solid var(--border-gold)" }}
    >
      <div className="flex items-center gap-2 caption mb-2" style={{ color: "var(--gold)" }}>
        {icon}
        <span style={{ color: "var(--text-muted)" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function ReliabilityDot({ level }) {
  const c = level === "high" ? "#4A5D4E" : level === "medium" ? "#C5A059" : "#B94040";
  return <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c }} />;
}
function SeverityDot({ level }) {
  const c = level === "high" ? "#B94040" : level === "medium" ? "#C5A059" : "#4A5D4E";
  return <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c }} />;
}
