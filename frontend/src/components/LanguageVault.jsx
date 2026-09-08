import React, { useState } from "react";
import { Languages, Copy, Check } from "lucide-react";

const CATEGORIES = [
  { id: "emergency", label: "Emergency" },
  { id: "navigation", label: "Navigation" },
  { id: "medical", label: "Medical" },
];

export default function LanguageVault({ phrasePack, loading }) {
  const [active, setActive] = useState("emergency");
  const [copiedIdx, setCopiedIdx] = useState(null);

  const copy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1400);
  };

  return (
    <div className="parchment-card p-5 sm:p-8" data-testid="language-vault-panel">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="caption flex items-center gap-1.5">
            <Languages size={12} style={{ color: "var(--gold)" }} />
            Language Vault
          </div>
          <h3 className="font-serif-display text-xl sm:text-2xl mt-1" style={{ color: "var(--text)" }}>
            {phrasePack?.language || "Offline Phrase Pack"}
            {phrasePack?.code && (
              <span className="ml-2 text-sm font-work uppercase tracking-widest" style={{ color: "var(--gold)" }}>
                {phrasePack.code}
              </span>
            )}
          </h3>
        </div>
      </div>

      {loading && (
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          Preparing regional phrases...
        </div>
      )}

      {!loading && !phrasePack && (
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          Generate an expedition dossier to auto-build a regional phrase pack for offline use.
        </div>
      )}

      {phrasePack && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                data-testid={`phrase-category-tab-${c.id}`}
                className="pill-btn"
                style={{
                  backgroundColor: active === c.id ? "var(--navy)" : "var(--card)",
                  color: active === c.id ? "#FBF9F5" : "var(--text)",
                  borderColor: active === c.id ? "var(--navy)" : "var(--border-gold)",
                  fontSize: "0.8rem",
                  padding: "0.4rem 0.9rem",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          <ul className="space-y-2">
            {(phrasePack[active] || []).map((p, i) => (
              <li
                key={i}
                data-testid="phrase-item-row"
                className="flex items-start gap-3 p-3 rounded"
                style={{ backgroundColor: "var(--badge)", border: "1px solid var(--border-gold)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {p.en}
                  </div>
                  <div className="font-serif-display text-lg mt-0.5" style={{ color: "var(--gold)" }}>
                    {p.local}
                  </div>
                  <div className="text-xs mt-0.5 italic" style={{ color: "var(--text-muted)" }}>
                    /{p.phonetic}/
                  </div>
                </div>
                <button
                  onClick={() => copy(`${p.en} — ${p.local} (${p.phonetic})`, `${active}-${i}`)}
                  data-testid="copy-phrase-button"
                  className="pill-btn shrink-0"
                  style={{ padding: "0.35rem 0.7rem" }}
                >
                  {copiedIdx === `${active}-${i}` ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
