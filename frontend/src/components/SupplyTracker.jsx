import React, { useMemo, useState } from "react";
import { Minus, Plus, PackageCheck, ShieldCheck, Flame, Rocket, Undo2, Pencil, CheckCircle2, AlertTriangle } from "lucide-react";
import { CATEGORY_LABELS, computeReadiness, daysOfSupply } from "../lib/expeditions";

export default function SupplyTracker({ gear, items, setItems, members, days, journey, onStartJourney, onEndJourney }) {
  const [tab, setTab] = useState("all");
  const [confirming, setConfirming] = useState(false);
  const [editPacked, setEditPacked] = useState(false);

  const inField = journey?.phase === "field";
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
  const dayOfTrip = journey?.startedAt
    ? Math.min(days, Math.floor((Date.now() - new Date(journey.startedAt).getTime()) / 86400000) + 1)
    : 1;
  const missingCritical = (gear || []).filter(
    (g) => g.critical && (items[g.id]?.packed || 0) < g.required_qty
  );

  return (
    <div className="parchment-card p-5 sm:p-8" data-testid="supply-tracker-panel">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="caption flex items-center gap-1.5">
            <ShieldCheck size={12} style={{ color: "var(--gold)" }} />
            {inField ? "In the field" : "Packing"} · {members} members · {days} days
          </div>
          <h3 className="font-serif-display text-xl sm:text-2xl mt-1" style={{ color: "var(--text)" }}>
            {inField ? `Day ${dayOfTrip} · consumption log` : "Team kit & readiness"}
          </h3>
        </div>
        <div className="text-right">
          <div className="font-serif-display text-4xl leading-none" style={{ color: "var(--gold)" }} data-testid="readiness-score-gauge">
            {readiness.overall}%
          </div>
          <div className="caption mt-1">{inField ? "Packed" : "Readiness"}</div>
        </div>
      </div>

      <div className="score-track my-5">
        <div className="score-fill" style={{ width: `${readiness.overall}%` }} />
      </div>

      {/* Journey control */}
      {!inField ? (
        readiness.overall === 100 ? (
          <div className="p-4 rounded mb-5" style={{ backgroundColor: "var(--badge)", border: "1px solid var(--gold)" }} data-testid="kit-complete-banner">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: "var(--gold)" }} />
              <span className="font-serif-display text-lg" style={{ color: "var(--text)" }}>
                Kit complete — every item packed
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Start the journey to switch this list into a live consumption log you can draw down day by day.
            </p>
            <button onClick={() => setConfirming(true)} className="pill-btn pill-btn-primary w-full mt-3" data-testid="start-journey-button">
              <Rocket size={14} /> Confirm kit & start journey
            </button>
          </div>
        ) : (
          <div className="p-3 rounded mb-5 text-sm" style={{ border: "1px solid var(--border-gold)", color: "var(--text-muted)" }} data-testid="kit-incomplete-note">
            Pack everything on this list to unlock the journey log — {100 - readiness.overall}% to go
            {missingCritical.length > 0 && `, including ${missingCritical.length} critical item${missingCritical.length > 1 ? "s" : ""}`}.
          </div>
        )
      ) : (
        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <button onClick={() => setEditPacked((v) => !v)} className="pill-btn flex-1" data-testid="toggle-edit-packed-button">
            <Pencil size={13} /> {editPacked ? "Hide packed editing" : "Adjust packed amounts"}
          </button>
          <button onClick={onEndJourney} className="pill-btn flex-1" style={{ borderColor: "#B94040", color: "#B94040" }} data-testid="end-journey-button">
            <Undo2 size={13} /> End journey
          </button>
        </div>
      )}

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
            <Flame size={12} style={{ color: criticalDays != null && criticalDays < days - 0.05 ? "#B94040" : "var(--gold)" }} />
            Days of supply remaining
          </div>
          <div className="flex flex-wrap gap-2">
            {supply.slice(0, 6).map((s) => (
              <div
                key={s.id}
                className="px-3 py-2 rounded"
                data-testid={`supply-days-${s.id}`}
                style={{ backgroundColor: "var(--badge)", border: `1px solid ${s.days < days - 0.05 ? "#B94040" : "var(--border-gold)"}` }}
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
              Shortfall: at the team&apos;s current burn rate you run dry before day {days}.
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
        {!inField && (
          <button onClick={fillAll} className="pill-btn ml-auto" style={{ padding: "0.3rem 0.85rem", fontSize: "0.72rem" }} data-testid="mark-all-packed-button">
            <PackageCheck size={12} /> Mark all packed
          </button>
        )}
      </div>

      <ul className="space-y-2">
        {visible.map((g) => {
          const st = items[g.id] || { packed: 0, consumed: 0 };
          const packed = st.packed || 0;
          const used = st.consumed || 0;
          const remaining = Math.round((packed - used) * 100) / 100;
          const ratio = Math.min(1, packed / (g.required_qty || 1));
          const step = g.required_qty > 20 ? Math.max(1, Math.round(g.required_qty / 10)) : 1;
          const empty = inField && remaining <= 0;
          return (
            <li
              key={g.id}
              className="p-3.5 rounded"
              data-testid={`gear-row-${g.id}`}
              style={{
                backgroundColor: !inField && ratio >= 1 ? "var(--badge)" : "transparent",
                border: `1px solid ${(g.critical && !inField && ratio < 1) || empty ? "#B94040" : "var(--border-gold)"}`,
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
                    {empty && (
                      <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full flex items-center gap-1" style={{ color: "#B94040", border: "1px solid #B94040" }}>
                        <AlertTriangle size={9} /> OUT
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{g.notes}</div>
                  <div className="text-xs mt-1 font-mono" style={{ color: "var(--gold)" }}>
                    {inField
                      ? `${remaining} of ${packed} ${g.unit} left`
                      : `Need ${g.required_qty} ${g.unit} · ${g.scaling_basis}`}
                  </div>
                </div>

                <div className="flex items-center gap-5 w-full sm:w-auto justify-start sm:justify-end mt-1 sm:mt-0">
                  {inField ? (
                    <>
                      <Counter
                        label="Use"
                        value={remaining}
                        onMinus={() => bump(g.id, "consumed", step, packed)}
                        onPlus={() => bump(g.id, "consumed", -step)}
                        minusIcon={<Minus size={12} />}
                        plusIcon={<Undo2 size={12} />}
                        testId={`remaining-${g.id}`}
                        highlight={remaining > 0}
                      />
                      {editPacked && (
                        <Counter
                          label="Packed"
                          value={packed}
                          onMinus={() => bump(g.id, "packed", -step)}
                          onPlus={() => bump(g.id, "packed", step)}
                          testId={`packed-${g.id}`}
                        />
                      )}
                    </>
                  ) : (
                    <Counter
                      label="Packed"
                      value={packed}
                      onMinus={() => bump(g.id, "packed", -step)}
                      onPlus={() => bump(g.id, "packed", step)}
                      testId={`packed-${g.id}`}
                      highlight={ratio >= 1}
                    />
                  )}
                </div>
              </div>
              <div className="score-track mt-3" style={{ height: 5 }}>
                <div
                  className="score-fill"
                  style={{ width: `${(inField ? (packed ? Math.max(0, remaining / packed) : 0) : ratio) * 100}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={() => setConfirming(false)}>
          <div
            className="parchment-card w-full sm:max-w-md p-5 sm:p-6 animate-fade-up"
            onClick={(e) => e.stopPropagation()}
            data-testid="start-journey-modal"
            style={{ borderRadius: "10px 10px 0 0" }}
          >
            <div className="caption">Confirmation</div>
            <h4 className="font-serif-display text-2xl mt-1" style={{ color: "var(--text)" }}>
              Start the journey?
            </h4>
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
              All {(gear || []).length} items are packed for {members} members over {days} days. Starting locks in these
              amounts as your baseline and switches the Kit into a consumption log — you can draw items down whenever you
              like, and come back to packing at any time.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-5">
              <button
                onClick={() => {
                  setConfirming(false);
                  onStartJourney();
                }}
                className="pill-btn pill-btn-primary flex-1"
                data-testid="confirm-start-journey-button"
              >
                <Rocket size={14} /> Yes, start journey
              </button>
              <button onClick={() => setConfirming(false)} className="pill-btn flex-1" data-testid="cancel-start-journey-button">
                Not yet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Counter = ({ label, value, onMinus, onPlus, testId, highlight, minusIcon, plusIcon }) => (
  <div className="text-center">
    <div className="caption mb-1">{label}</div>
    <div className="flex items-center gap-1.5">
      <button onClick={onMinus} className="pill-btn" style={{ padding: "0.3rem 0.45rem" }} data-testid={`${testId}-minus`}>
        {minusIcon || <Minus size={12} />}
      </button>
      <span className="font-mono text-sm w-10" style={{ color: highlight ? "var(--gold)" : "var(--text)" }} data-testid={`${testId}-value`}>
        {value}
      </span>
      <button onClick={onPlus} className="pill-btn" style={{ padding: "0.3rem 0.45rem" }} data-testid={`${testId}-plus`}>
        {plusIcon || <Plus size={12} />}
      </button>
    </div>
  </div>
);
