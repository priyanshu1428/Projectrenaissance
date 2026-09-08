import React, { useEffect, useState } from "react";
import { CalendarRange, Plus, Trash2, GripVertical } from "lucide-react";
import { getMeta, putMeta } from "../lib/expeditions";

export default function Itinerary({ storageKey, days }) {
  const [legs, setLegs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState({ title: "", notes: "", distance: "" });

  useEffect(() => {
    setLoaded(false);
    getMeta(`itin:${storageKey}`)
      .then((v) => setLegs(Array.isArray(v) ? v : []))
      .catch(() => setLegs([]))
      .finally(() => setLoaded(true));
  }, [storageKey]);

  const persist = (next) => {
    setLegs(next);
    putMeta(`itin:${storageKey}`, next).catch(() => {});
  };

  const add = () => {
    if (!draft.title.trim()) return;
    persist([...legs, { id: `leg-${Date.now()}`, ...draft, title: draft.title.trim() }]);
    setDraft({ title: "", notes: "", distance: "" });
  };

  const update = (id, key, value) =>
    persist(legs.map((l) => (l.id === id ? { ...l, [key]: value } : l)));

  const remove = (id) => persist(legs.filter((l) => l.id !== id));

  const move = (index, dir) => {
    const next = [...legs];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    persist(next);
  };

  return (
    <div className="parchment-card p-5 sm:p-7" data-testid="itinerary-panel">
      <div className="caption flex items-center gap-1.5">
        <CalendarRange size={12} style={{ color: "var(--gold)" }} /> Your Itinerary
      </div>
      <h3 className="font-serif-display text-xl sm:text-2xl mt-1" style={{ color: "var(--text)" }}>
        Day plan · you write it
      </h3>
      <p className="text-sm mt-1 mb-4" style={{ color: "var(--text-muted)" }}>
        {legs.length} of {days} days planned. Stored on-device, editable offline.
      </p>

      {loaded && legs.length === 0 && (
        <p className="text-sm mb-4 p-3 rounded" style={{ color: "var(--text-muted)", border: "1px solid var(--border-gold)" }} data-testid="itinerary-empty">
          Nothing planned yet. Add your first day below — no AI guesses, just your route.
        </p>
      )}

      <ol className="space-y-3">
        {legs.map((l, i) => (
          <li key={l.id} className="p-3 rounded" style={{ border: "1px solid var(--border-gold)" }} data-testid={`itinerary-leg-${i}`}>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-serif-display"
                style={{ backgroundColor: "var(--badge)", border: "1px solid var(--border-gold)", color: "var(--gold)" }}
              >
                {i + 1}
              </span>
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} className="text-xs px-1" style={{ color: "var(--text-muted)" }} data-testid={`itinerary-up-${i}`} aria-label="Move up">▲</button>
                <button onClick={() => move(i, 1)} className="text-xs px-1" style={{ color: "var(--text-muted)" }} data-testid={`itinerary-down-${i}`} aria-label="Move down">▼</button>
              </div>
              <input
                value={l.title}
                onChange={(e) => update(l.id, "title", e.target.value)}
                className="chic-input flex-1"
                placeholder="Day title"
                data-testid={`itinerary-title-${i}`}
              />
              <button onClick={() => remove(l.id)} className="pill-btn shrink-0" style={{ padding: "0.4rem 0.55rem" }} data-testid={`itinerary-remove-${i}`}>
                <Trash2 size={13} />
              </button>
            </div>
            <textarea
              value={l.notes}
              onChange={(e) => update(l.id, "notes", e.target.value)}
              rows={2}
              className="chic-input"
              placeholder="Notes — camp, water stop, bail-out point…"
              data-testid={`itinerary-notes-${i}`}
            />
            <input
              value={l.distance}
              onChange={(e) => update(l.id, "distance", e.target.value)}
              className="chic-input mt-2"
              placeholder="Distance / gain e.g. 14 km · +700 m"
              data-testid={`itinerary-distance-${i}`}
            />
          </li>
        ))}
      </ol>

      <div className="mt-5 pt-5 space-y-2" style={{ borderTop: "1px solid var(--border-gold)" }}>
        <div className="caption flex items-center gap-1.5">
          <GripVertical size={11} style={{ color: "var(--gold)" }} /> Add day {legs.length + 1}
        </div>
        <input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          className="chic-input"
          placeholder="Day title e.g. Base to high camp"
          data-testid="itinerary-new-title"
        />
        <textarea
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          rows={2}
          className="chic-input"
          placeholder="Notes (optional)"
          data-testid="itinerary-new-notes"
        />
        <input
          value={draft.distance}
          onChange={(e) => setDraft({ ...draft, distance: e.target.value })}
          className="chic-input"
          placeholder="Distance / gain (optional)"
          data-testid="itinerary-new-distance"
        />
        <button onClick={add} disabled={!draft.title.trim()} className="pill-btn pill-btn-primary w-full" data-testid="itinerary-add-button">
          <Plus size={14} /> Add day
        </button>
      </div>
    </div>
  );
}
