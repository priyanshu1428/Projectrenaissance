import React, { useMemo, useState } from "react";
import { Minus, Plus, PackageCheck, ShieldCheck, Flame } from "lucide-react";
import { CATEGORY_LABELS, computeReadiness, daysOfSupply } from "../lib/expeditions";

export default function SupplyTracker({ gear, items, setItems, members, days }) {
  const [tab, setTab] = useState("all");

  const readiness = useMemo(() => computeReadiness(gear, items), [gear, items]);
  const supply = useMemo(() => daysOfSupply(gear, items, members), [gear, items, members]);

  const cats = useMemo(() => {
    const set = [];
    (gear || []).forEach((g) => {
      const c = g.category || "other";
      if (!set.includes(c)) set.push(c);
    });
    return set;
  }, [gear]);

  const bump = (id, key, delta, max) => {
    setItems((prev) => {
      const cur = prev[id] || { packed: 0, consumed: 0 };
      let next = Math.round(((cur[key] || 0) + delta) * 100) / 100;
      if (next < 0) next = 0;
      if (max != null && next > max) next = max;
      return { ...prev, [id]: { ...cur, [key]: next } };
    });
  };

  const fillAll = () => {
    setItems((prev) => {
      const next = { ...prev };
      (gear || []).forEach((g) => {
        next[g.id] = { ...(next[g.id] || { consumed: 0 }), packed: g.required_qty };
      });
      return next;
    });
  };

  const visible = (gear || []).filter((g) => tab === "all" || (g.category || "other") === tab);
  const criticalDays = supply.length ? supply[0].days : null;

  return (
    <div className="parchment-card p-6 sm:p-8" data-testid="supply-tracker-panel">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="caption flex items-center gap-1.5">
            <ShieldCheck size={12} style={{ color: "var(--gold)" }} /> Readiness & Supplies
          </div>
          <h3 className="font-serif-display text-xl sm:text-2xl mt-1" style={{ color: "var(--text)" }}>
            Team stock · {members} members · {days} days
          </h3>
        </div>
        <div className="text-right">
          <div className="font-serif-display text-4xl leading-none" style={{ color: "var(--gold)" }} data-testid="readiness-score-gauge">
            {readiness.overall}%
          </div>
          <div className="caption mt-1">Readiness</div>
        </div>
      </div>

      <div className="score-track my-5">
        <div className="score-fill" style={{ width: `${readiness.overall}%` }} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5" data-testid="category-readiness-breakdown">
        {readiness.categories.map((c) => (
          <div key={c.id} className="p-3 rounded" data-testid={`category-summary-${c.id}`} style={{ backgroundColor: "var(--badge)", border: "1px solid var(--border-gold)" }}>
            <div className="caption">{c.name}</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-serif-display text-2xl" style={{ color: "var(--text)" }}>{c.percent}%</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{c.ready}/{c.items}</span>
            </div>
          </div>
        ))}
      </div>

      {supply.length > 0 && (
        <div className="p-4 rounded mb-5" style={{ border: "1px solid var(--border-gold)" }} data-testid="days-of-supply-panel">
          <div className="caption flex items-center gap-1.5 mb-2">
            <Flame size={12} style={{ color: criticalDays != null && criticalDays < days ? "#B94040" : "var(--gold)" }} />
            Days of supply remaining
          </div>
          <div className="flex flex-wrap gap-2">
            {supply.slice(0, 6).map((s) => (
              <div
                key={s.id}
                className="px-3 py-2 rounded"
                data-testid={`supply-days-${s.id}`}
                style={{
                  backgroundColor: "var(--badge)",
                  border: `1px solid ${s.days < days - 0.05 ? "#B94040" : "var(--border-gold)"}`,
                }}
              >
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.name}</div>
                <div className="font-mono text-sm" style={{ color: s.days < days - 0.05 ? "#B94040" : "var(--text)" }}>
                  {s.days}d · {s.available}{s.unit} left
                </div>
              </div>
            ))}
          </div>
          {criticalDays != null && criticalDays < days - 0.05 && (
            <div className="text-sm mt-3" style={{ color: "#B94040" }} data-testid="supply-shortfall-warning">
              Shortfall: at current team burn rate you run dry before day {days}.
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <button onClick={() => setTab("all")} className="pill-btn" style={{ padding: "0.3rem 0.85rem", fontSize: "0.72rem", backgroundColor: tab === "all" ? "var(--badge)" : "var(--card)" }} data-testid="supply-tab-all">
          All ({(gear || []).length})
        </button>
        {cats.map((c) => (
          <button key={c} onClick={() => setTab(c)} className="pill-btn" style={{ padding: "0.3rem 0.85rem", fontSize: "0.72rem", backgroundColor: tab === c ? "var(--badge)" : "var(--card)" }} data-testid={`supply-tab-${c}`}>
            {CATEGORY_LABELS[c] || c}
          </button>
        ))}
        <button onClick={fillAll} className="pill-btn ml-auto" style={{ padding: "0.3rem 0.85rem", fontSize: "0.72rem" }} data-testid="mark-all-packed-button">
          <PackageCheck size={12} /> Mark all packed
        </button>
      </div>

      <ul className="space-y-2">
        {visible.map((g) => {
          const st = items[g.id] || { packed: 0, consumed: 0 };
          const ratio = Math.min(1, (st.packed || 0) / (g.required_qty || 1));
          const step = g.required_qty > 20 ? Math.max(1, Math.round(g.required_qty / 10)) : 1;
          return (
            <li
              key={g.id}
              className="p-3.5 rounded"
              data-testid={`gear-row-${g.id}`}
              style={{
                backgroundColor: ratio >= 1 ? "var(--badge)" : "transparent",
                border: `1px solid ${g.critical && ratio < 1 ? "#B94040" : "var(--border-gold)"}`,
              }}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{g.name}</span>
                    {g.critical && (
                      <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full" style={{ color: "#B94040", border: "1px solid #B94040" }}>
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {g.notes}
                  </div>
                  <div className="text-xs mt-1 font-mono" style={{ color: "var(--gold)" }}>
                    Need {g.required_qty} {g.unit} · {g.scaling_basis}
                  </div>
                </div>

                <div className="flex items-center gap-5 w-full sm:w-auto justify-start sm:justify-end mt-1 sm:mt-0">
                  <Counter
                    label="Packed"
                    value={st.packed || 0}
                    onMinus={() => bump(g.id, "packed", -step)}
                    onPlus={() => bump(g.id, "packed", step)}
                    testId={`packed-${g.id}`}
                    highlight={ratio >= 1}
                  />
                  {g.consumable && (
                    <Counter
                      label="Used"
                      value={st.consumed || 0}
                      onMinus={() => bump(g.id, "consumed", -step)}
                      onPlus={() => bump(g.id, "consumed", step, st.packed || 0)}
                      testId={`consumed-${g.id}`}
                    />
                  )}
                </div>
              </div>
              <div className="score-track mt-3" style={{ height: 5 }}>
                <div className="score-fill" style={{ width: `${ratio * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const Counter = ({ label, value, onMinus, onPlus, testId, highlight }) => (
  <div className="text-center">
    <div className="caption mb-1">{label}</div>
    <div className="flex items-center gap-1.5">
      <button onClick={onMinus} className="pill-btn" style={{ padding: "0.3rem 0.45rem" }} data-testid={`${testId}-minus`}>
        <Minus size={12} />
      </button>
      <span
        className="font-mono text-sm w-10"
        style={{ color: highlight ? "var(--gold)" : "var(--text)" }}
        data-testid={`${testId}-value`}
      >
        {value}
      </span>
      <button onClick={onPlus} className="pill-btn" style={{ padding: "0.3rem 0.45rem" }} data-testid={`${testId}-plus`}>
        <Plus size={12} />
      </button>
    </div>
  </div>
);
