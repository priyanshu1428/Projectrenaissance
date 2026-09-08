import React, { useEffect } from "react";
import { Archive, Trash2 } from "lucide-react";
import { deleteVaultEntry } from "../lib/vault";

export default function VaultDrawer({ open, onClose, entries, onDelete, onLoad }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full overflow-y-auto p-6"
        style={{ backgroundColor: "var(--card)", borderLeft: "1px solid var(--border-gold)" }}
        onClick={(e) => e.stopPropagation()}
        data-testid="offline-vault-drawer"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="caption flex items-center gap-1.5">
              <Archive size={12} style={{ color: "var(--gold)" }} /> Offline Vault
            </div>
            <h3 className="font-serif-display text-2xl mt-1" style={{ color: "var(--text)" }}>
              Saved dossiers
            </h3>
          </div>
          <button onClick={onClose} className="pill-btn" data-testid="vault-drawer-close">
            Close
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            No dossiers saved yet. Search a destination and tap &ldquo;Save to Vault&rdquo;.
          </div>
        ) : (
          <ul className="space-y-3">
            {entries.map((e) => (
              <li
                key={e.id}
                data-testid="vault-saved-item-card"
                className="p-4 rounded"
                style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border-gold)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-serif-display text-lg" style={{ color: "var(--text)" }}>
                      {e.briefing?.destination || "Untitled"}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {e.briefing?.region}
                    </div>
                    <div className="text-xs mt-1 font-mono" style={{ color: "var(--text-muted)" }}>
                      Saved · {new Date(e.savedAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const next = deleteVaultEntry(e.id);
                      onDelete(next);
                    }}
                    className="pill-btn"
                    style={{ padding: "0.35rem 0.6rem" }}
                    data-testid="vault-item-delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <button
                  onClick={() => onLoad(e)}
                  data-testid="vault-item-load"
                  className="pill-btn mt-3"
                  style={{ padding: "0.35rem 0.85rem", fontSize: "0.75rem" }}
                >
                  Load into dashboard →
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
