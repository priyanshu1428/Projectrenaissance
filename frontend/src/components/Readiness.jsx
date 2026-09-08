import React, { useMemo, useState } from "react";
import { Plus, X, ShieldCheck } from "lucide-react";

export default function Readiness({ categories, checked, setChecked, extras, setExtras }) {
  const [newItem, setNewItem] = useState("");
  const [newCat, setNewCat] = useState(categories[0]?.id || "navigation");

  const allItems = useMemo(() => {
    const merged = categories.map((c) => ({
      ...c,
      items: [
        ...c.items,
        ...(extras[c.id] || []),
      ],
    }));
    return merged;
  }, [categories, extras]);

  const totals = useMemo(() => {
    const byCat = {};
    let total = 0;
    let done = 0;
    allItems.forEach((c) => {
      const t = c.items.length;
      const d = c.items.filter((it) => checked[it.id]).length;
      byCat[c.id] = { total: t, done: d, percent: t ? Math.round((d / t) * 100) : 0 };
      total += t;
      done += d;
    });
    const overall = total ? Math.round((done / total) * 100) : 0;
    return { overall, byCat };
  }, [allItems, checked]);

  const toggle = (id) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const addItem = () => {
    if (!newItem.trim()) return;
    const id = `custom-${Date.now()}`;
    setExtras((prev) => ({
      ...prev,
      [newCat]: [...(prev[newCat] || []), { id, text: newItem.trim() }],
    }));
    setNewItem("");
  };

  const removeItem = (catId, itemId) => {
    setExtras((prev) => ({
      ...prev,
      [catId]: (prev[catId] || []).filter((it) => it.id !== itemId),
    }));
  };

  return (
    <div className="parchment-card p-6 sm:p-8" data-testid="readiness-score-panel">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <div>
          <div className="caption flex items-center gap-1.5">
            <ShieldCheck size={12} style={{ color: "var(--gold)" }} /> Readiness Score
          </div>
          <h3 className="font-serif-display text-2xl mt-1" style={{ color: "var(--text)" }}>
            Preparation Status
          </h3>
        </div>
        <div className="text-right">
          <div
            className="font-serif-display text-4xl leading-none"
            style={{ color: "var(--gold)" }}
            data-testid="readiness-score-gauge"
          >
            {totals.overall}%
          </div>
          <div className="caption mt-1">Overall</div>
        </div>
      </div>

      <div className="score-track mb-6">
        <div className="score-fill" style={{ width: `${totals.overall}%` }} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6" data-testid="category-readiness-breakdown">
        {allItems.map((c) => (
          <div
            key={c.id}
            className="p-3 rounded"
            data-testid={`category-summary-${c.id}`}
            style={{ backgroundColor: "var(--badge)", border: "1px solid var(--border-gold)" }}
          >
            <div className="caption">{c.name}</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-serif-display text-2xl" style={{ color: "var(--text)" }}>
                {totals.byCat[c.id]?.percent || 0}%
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {totals.byCat[c.id]?.done}/{totals.byCat[c.id]?.total}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {allItems.map((c) => (
          <div key={c.id}>
            <div className="caption mb-2">{c.name}</div>
            <ul className="space-y-1.5">
              {c.items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center gap-3 p-2.5 rounded transition-colors"
                  style={{
                    backgroundColor: checked[it.id] ? "var(--badge)" : "transparent",
                    border: "1px solid var(--border-gold)",
                  }}
                >
                  <label className="flex items-center gap-3 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checked[it.id]}
                      onChange={() => toggle(it.id)}
                      data-testid="checklist-item-checkbox"
                      className="w-4 h-4 rounded"
                      style={{ accentColor: "var(--gold)" }}
                    />
                    <span
                      className="text-sm"
                      style={{
                        color: checked[it.id] ? "var(--text-muted)" : "var(--text)",
                        textDecoration: checked[it.id] ? "line-through" : "none",
                      }}
                    >
                      {it.text}
                    </span>
                  </label>
                  {it.id.startsWith("custom-") && (
                    <button
                      onClick={() => removeItem(c.id, it.id)}
                      data-testid="remove-checklist-item"
                      className="opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <X size={13} style={{ color: "var(--text-muted)" }} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--border-gold)" }}>
        <div className="caption mb-2">Add custom item</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            className="chic-input sm:w-44"
            data-testid="add-checklist-category-select"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="e.g. Pack thermal blanket"
            className="chic-input flex-1"
            data-testid="add-checklist-item-input"
          />
          <button onClick={addItem} className="pill-btn pill-btn-primary" data-testid="add-checklist-item-button">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
