import React from "react";
import {
  CloudSun, Mountain, Compass, Radio, Languages, Droplet, HeartPulse,
  AlertTriangle, CalendarRange, Lightbulb, Users,
} from "lucide-react";

const Section = ({ icon, eyebrow, title, children, testId }) => (
  <div className="parchment-card p-5 sm:p-7" data-testid={testId}>
    <div className="caption flex items-center gap-1.5">
      {icon} {eyebrow}
    </div>
    <h3 className="font-serif-display text-xl sm:text-2xl mt-1 mb-4" style={{ color: "var(--text)" }}>
      {title}
    </h3>
    {children}
  </div>
);

const Stat = ({ label, value }) => (
  <div className="p-3 rounded" style={{ backgroundColor: "var(--badge)", border: "1px solid var(--border-gold)" }}>
    <div className="caption">{label}</div>
    <div className="text-sm mt-1" style={{ color: "var(--text)" }}>{value || "—"}</div>
  </div>
);

const sevColor = (s) => {
  const v = (s || "").toLowerCase();
  if (v === "high" || v === "severe") return "#B94040";
  if (v === "medium" || v === "moderate") return "var(--gold)";
  return "var(--olive)";
};

const Gauge = ({ score, label, caption }) => {
  const pct = Math.max(0, Math.min(100, (Number(score) || 0) * 10));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-serif-display text-2xl" style={{ color: "var(--text)" }}>{label || "—"}</span>
        <span className="font-mono text-sm" style={{ color: "var(--gold)" }}>{score ?? "—"}/10</span>
      </div>
      <div className="score-track my-2">
        <div className="score-fill" style={{ width: `${pct}%` }} />
      </div>
      {caption && <p className="text-sm" style={{ color: "var(--text-muted)" }}>{caption}</p>}
    </div>
  );
};

export default function DossierView({ plan }) {
  if (!plan) return null;
  const p = plan.params || {};
  const wf = plan.weather_forecast || {};
  const nav = plan.navigation || {};
  const com = plan.communication || {};
  const lang = plan.language || {};
  const risk = plan.group_risk || {};

  return (
    <div className="space-y-6" data-testid="expedition-dossier">
      <div className="parchment-card p-6 sm:p-8">
        <div className="caption flex items-center gap-1.5">
          <Users size={12} style={{ color: "var(--gold)" }} /> Curated Dossier
        </div>
        <h2 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl mt-1 leading-tight" style={{ color: "var(--text)" }} data-testid="dossier-destination-title">
          {plan.destination || p.destination}
        </h2>
        <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{plan.region}</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <Stat label="Window" value={`${p.start_date || "?"} → ${p.end_date || "?"}`} />
          <Stat label="Duration" value={`${p.duration_days || "?"} days`} />
          <Stat label="Team" value={`${p.member_count || "?"} members · ${p.experience_level || ""}`} />
          <Stat label="Coordinates" value={plan.coordinates ? `${Number(plan.coordinates.lat).toFixed(4)}, ${Number(plan.coordinates.lng).toFixed(4)}` : "—"} />
        </div>
        {plan.summary && (
          <p className="text-base mt-5 leading-relaxed" style={{ color: "var(--text)" }} data-testid="dossier-summary">
            {plan.summary}
          </p>
        )}
      </div>

      <Section
        testId="dossier-weather"
        icon={<CloudSun size={12} style={{ color: "var(--gold)" }} />}
        eyebrow={`Predicted Weather · ${wf.season || "season"}`}
        title="Forecast for your window"
      >
        <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--text)" }}>{wf.outlook}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <Stat label="Temperature" value={wf.temperature_range} />
          <Stat label="Precipitation" value={wf.precipitation} />
          <Stat label="Daylight" value={wf.daylight} />
        </div>
        <div className="space-y-2">
          {(wf.periods || []).map((per, i) => (
            <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 rounded" style={{ border: "1px solid var(--border-gold)" }} data-testid={`weather-period-${i}`}>
              <span className="caption shrink-0">{per.label}</span>
              <span className="font-mono text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                {per.temp_high} / {per.temp_low}
              </span>
              <span className="text-xs shrink-0 px-2 py-0.5 rounded-full" style={{ color: sevColor(per.risk), border: `1px solid ${sevColor(per.risk)}` }}>
                {per.risk}
              </span>
              <span className="text-sm w-full sm:flex-1 sm:w-auto" style={{ color: "var(--text)" }}>{per.conditions}</span>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section
          testId="dossier-navigation"
          icon={<Compass size={12} style={{ color: "var(--gold)" }} />}
          eyebrow="Navigation Difficulty"
          title={nav.difficulty_label || "Assessment"}
        >
          <Gauge score={nav.difficulty_score} label={nav.difficulty_label} />
          <ul className="mt-4 space-y-1.5">
            {(nav.reasons || []).map((r, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: "var(--text)" }}>
                <span style={{ color: "var(--gold)" }}>·</span> {r}
              </li>
            ))}
          </ul>
          {nav.offline_map_advice && (
            <p className="text-sm mt-4 p-3 rounded" style={{ backgroundColor: "var(--badge)", color: "var(--text-muted)" }}>
              {nav.offline_map_advice}
            </p>
          )}
        </Section>

        <Section
          testId="dossier-language"
          icon={<Languages size={12} style={{ color: "var(--gold)" }} />}
          eyebrow={`Language · ${lang.primary || "—"}`}
          title={`${lang.difficulty_label || "Difficulty"}`}
        >
          <Gauge score={lang.difficulty_score} label={lang.primary} caption={lang.notes} />
        </Section>

        <Section
          testId="dossier-terrain"
          icon={<Mountain size={12} style={{ color: "var(--gold)" }} />}
          eyebrow={`Terrain · ${plan.terrain?.type || "—"}`}
          title={plan.terrain?.elevation || "Elevation"}
        >
          <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{plan.terrain?.description}</p>
        </Section>

        <Section
          testId="dossier-communication"
          icon={<Radio size={12} style={{ color: "var(--gold)" }} />}
          eyebrow="Communication"
          title="Signal & check-in"
        >
          <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{com.signal_outlook}</p>
          <p className="text-sm mt-3 p-3 rounded" style={{ backgroundColor: "var(--badge)", color: "var(--text)" }}>
            <b>Check-in:</b> {com.checkin_protocol}
          </p>
          <ul className="mt-3 space-y-1.5">
            {(com.recommended_devices || []).map((d, i) => (
              <li key={i} className="text-sm flex justify-between gap-3" style={{ color: "var(--text)" }}>
                <span>{d.item} <span style={{ color: "var(--text-muted)" }}>— {d.why}</span></span>
                <span className="font-mono shrink-0" style={{ color: "var(--gold)" }}>×{d.quantity}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          testId="dossier-water"
          icon={<Droplet size={12} style={{ color: "var(--gold)" }} />}
          eyebrow="Water Sources"
          title="Hydration plan"
        >
          <ul className="space-y-2">
            {(plan.water_sources || []).map((w, i) => (
              <li key={i} className="p-3 rounded" style={{ border: "1px solid var(--border-gold)" }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{w.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: sevColor(w.reliability === "high" ? "low" : w.reliability), border: "1px solid var(--border-gold)" }}>
                    {w.reliability}
                  </span>
                </div>
                <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{w.notes}</div>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          testId="dossier-medical"
          icon={<HeartPulse size={12} style={{ color: "var(--gold)" }} />}
          eyebrow="Medical Hazards"
          title="Health risks"
        >
          <ul className="space-y-2">
            {(plan.medical_hazards || []).map((h, i) => (
              <li key={i} className="p-3 rounded" style={{ border: "1px solid var(--border-gold)" }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{h.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: sevColor(h.severity), border: `1px solid ${sevColor(h.severity)}` }}>
                    {h.severity}
                  </span>
                </div>
                <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{h.advice}</div>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section
        testId="dossier-group-risk"
        icon={<AlertTriangle size={12} style={{ color: sevColor(risk.level) }} />}
        eyebrow={`Group Risk · ${risk.level || "—"}`}
        title={`Risk profile for ${p.member_count || "your"} members`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <div className="caption mb-2">Factors</div>
            <ul className="space-y-1.5">
              {(risk.factors || []).map((f, i) => (
                <li key={i} className="text-sm flex gap-2" style={{ color: "var(--text)" }}>
                  <span style={{ color: "#B94040" }}>·</span> {f}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="caption mb-2">Mitigation</div>
            <ul className="space-y-1.5">
              {(risk.mitigation || []).map((f, i) => (
                <li key={i} className="text-sm flex gap-2" style={{ color: "var(--text)" }}>
                  <span style={{ color: "var(--olive)" }}>·</span> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section
        testId="dossier-timeline"
        icon={<CalendarRange size={12} style={{ color: "var(--gold)" }} />}
        eyebrow="Day Plan"
        title="Timeline"
      >
        <ol className="space-y-3">
          {(plan.timeline || []).map((d, i) => (
            <li key={i} className="flex gap-4" data-testid={`timeline-day-${i}`}>
              <span
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-serif-display"
                style={{ backgroundColor: "var(--badge)", border: "1px solid var(--border-gold)", color: "var(--gold)" }}
              >
                {d.day ?? i + 1}
              </span>
              <div className="flex-1 pb-3" style={{ borderBottom: "1px solid var(--border-gold)" }}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-serif-display text-lg" style={{ color: "var(--text)" }}>{d.focus}</span>
                  <span className="font-mono text-xs shrink-0" style={{ color: "var(--text-muted)" }}>{d.distance}</span>
                </div>
                <div className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{d.notes}</div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        testId="dossier-insights"
        icon={<Lightbulb size={12} style={{ color: "var(--gold)" }} />}
        eyebrow="Analyst Notes"
        title="Things worth knowing"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(plan.insights || []).map((ins, i) => (
            <div key={i} className="p-4 rounded" style={{ backgroundColor: "var(--badge)", border: "1px solid var(--border-gold)" }} data-testid={`insight-${i}`}>
              <div className="font-serif-display text-lg" style={{ color: "var(--text)" }}>{ins.title}</div>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{ins.detail}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
