import React, { useCallback, useEffect, useMemo, useState } from "react";
import { WifiOff, Map as MapIcon, ClipboardList, Backpack, Siren, Compass, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiErrorDetail } from "../lib/api";
import { useNetwork } from "../context/NetworkContext";
import { useAuth } from "../context/AuthContext";
import { useTracker } from "../context/TrackerContext";
import {
  listExpeditions, saveExpedition, deleteExpedition, getGearState, putGearState,
} from "../lib/expeditions";
import ExpeditionForm from "../components/ExpeditionForm";
import DossierView from "../components/DossierView";
import SupplyTracker from "../components/SupplyTracker";
import TrackerPanel from "../components/TrackerPanel";
import OfflineKit from "../components/OfflineKit";
import LanguageVault from "../components/LanguageVault";
import LeafletMap from "../components/LeafletMap";
import EmergencyMenu from "../components/EmergencyMenu";

const TABS = [
  { id: "plan", label: "Plan", icon: Compass },
  { id: "dossier", label: "Dossier", icon: ClipboardList },
  { id: "kit", label: "Kit", icon: Backpack },
  { id: "map", label: "Map", icon: MapIcon },
  { id: "field", label: "Field", icon: Siren },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { online } = useNetwork();
  const { track, last } = useTracker();

  const [tab, setTab] = useState("plan");
  const [plan, setPlan] = useState(null);
  const [phrases, setPhrases] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingPhrases, setLoadingPhrases] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);
  const [vault, setVault] = useState([]);
  const [gearItems, setGearItems] = useState({});

  const gearKey = saved || "draft";

  useEffect(() => {
    listExpeditions().then(setVault).catch(() => {});
  }, []);

  useEffect(() => {
    getGearState(gearKey)
      .then((rec) => setGearItems(rec?.items || {}))
      .catch(() => setGearItems({}));
  }, [gearKey]);

  const updateGear = useCallback(
    (updater) => {
      setGearItems((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        putGearState(gearKey, next).catch(() => {});
        return next;
      });
    },
    [gearKey]
  );

  const generate = async (params) => {
    setError("");
    setSaved(null);
    setLoadingPlan(true);
    setPlan(null);
    setPhrases(null);
    try {
      const { data } = await api.post("/expedition/plan", params);
      setPlan(data);
      setTab("dossier");
      setLoadingPlan(false);
      if (data.language?.primary) {
        setLoadingPhrases(true);
        try {
          const { data: pp } = await api.post("/phrases", {
            destination: data.destination || params.destination,
            language: data.language.primary,
          });
          setPhrases(pp);
        } catch {
          setPhrases(null);
        } finally {
          setLoadingPhrases(false);
        }
      }
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
      setLoadingPlan(false);
    }
  };

  const handleSaveVault = async () => {
    if (!plan) return;
    const rec = await saveExpedition({ plan, phrases, id: saved || undefined });
    await putGearState(rec.id, gearItems);
    setSaved(rec.id);
    setVault(await listExpeditions());
    if (online) {
      api.post("/expeditions", { plan, phrases }).catch(() => {});
    }
    toast.success("Dossier stored on-device");
  };

  const loadEntry = async (entry) => {
    setPlan(entry.plan);
    setPhrases(entry.phrases);
    setSaved(entry.id);
    setTab("dossier");
    if (!entry.phrases && online && entry.plan?.language?.primary) {
      setLoadingPhrases(true);
      try {
        const { data } = await api.post("/phrases", {
          destination: entry.plan.destination,
          language: entry.plan.language.primary,
        });
        setPhrases(data);
        await saveExpedition({ plan: entry.plan, phrases: data, id: entry.id });
        setVault(await listExpeditions());
      } catch {
        /* stays offline-empty */
      } finally {
        setLoadingPhrases(false);
      }
    }
  };

  const removeEntry = async (id) => {
    await deleteExpedition(id);
    setVault(await listExpeditions());
    if (saved === id) setSaved(null);
  };

  const marker = useMemo(() => {
    if (!plan?.coordinates) return null;
    return {
      lat: Number(plan.coordinates.lat),
      lng: Number(plan.coordinates.lng),
      label: plan.destination,
    };
  }, [plan]);

  const members = plan?.params?.member_count || 1;
  const days = plan?.params?.duration_days || 1;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-10 pb-28 sm:pb-10">
      {!online && (
        <div
          className="mb-4 p-3 rounded flex items-start gap-2 text-sm"
          style={{ backgroundColor: "var(--badge)", border: "1px solid #B94040", color: "var(--text)" }}
          data-testid="offline-banner"
        >
          <WifiOff size={14} className="shrink-0 mt-0.5" style={{ color: "#B94040" }} />
          <span>
            <b>Offline mode.</b> Dossiers, map tiles and your GPS trail all run from on-device storage.
          </span>
        </div>
      )}

      <div className="mb-5">
        <div className="caption">Bienvenue, {user?.name || "Explorer"}</div>
        <h1 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl mt-1 leading-tight" style={{ color: "var(--text)" }}>
          {plan ? plan.destination : "Where does the map end?"}
        </h1>
        {!plan && (
          <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--text-muted)" }}>
            Enter your place, dates and team. The analyst scales every litre, tent and radio to your group.
          </p>
        )}
      </div>

      {/* Desktop / tablet tabs */}
      <div className="hidden sm:flex items-center gap-2 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="pill-btn"
            style={{ backgroundColor: tab === t.id ? "var(--badge)" : "var(--card)", borderColor: tab === t.id ? "var(--gold)" : "var(--border-gold)" }}
            data-testid={`tab-${t.id}`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-5 p-3 rounded text-sm" data-testid="plan-error" style={{ color: "#B94040", border: "1px solid #B94040" }}>
          {error}
        </div>
      )}

      {tab === "plan" && (
        <div className="space-y-6">
          <ExpeditionForm onSubmit={generate} loading={loadingPlan} disabled={!online} />
          <SavedList entries={vault} onLoad={loadEntry} onDelete={removeEntry} />
        </div>
      )}

      {tab === "dossier" && (
        <div className="space-y-6">
          {loadingPlan && <Generating />}
          {!loadingPlan && !plan && <Empty onGo={() => setTab("plan")} />}
          {plan && (
            <>
              <OfflineKit plan={plan} onSaveVault={handleSaveVault} savedId={saved} />
              <DossierView plan={plan} />
            </>
          )}
        </div>
      )}

      {tab === "kit" && (
        plan?.gear?.length ? (
          <SupplyTracker gear={plan.gear} items={gearItems} setItems={updateGear} members={members} days={days} />
        ) : (
          <Empty onGo={() => setTab("plan")} label="Generate a dossier to get a quantity-scaled kit list." />
        )
      )}

      {tab === "map" && (
        <div className="space-y-4">
          <div className="parchment-card overflow-hidden">
            <div className="p-3 sm:p-4 gold-border-b flex items-center justify-between gap-2 flex-wrap">
              <div className="caption">Offline Map · Leaflet + OSM</div>
              <span className="text-xs font-mono" style={{ color: online ? "var(--text-muted)" : "#B94040" }}>
                {online ? `${track.length} fixes` : `OFFLINE · ${track.length} fixes`}
              </span>
            </div>
            <div style={{ height: "min(62vh, 520px)" }}>
              <LeafletMap
                center={marker ? [marker.lat, marker.lng] : last ? [last.lat, last.lng] : [48.8566, 2.3522]}
                marker={marker}
                rescuePin={!track.length && last ? { ...last, at: new Date(last.t).toISOString() } : null}
                track={track}
              />
            </div>
          </div>
          <TrackerPanel />
        </div>
      )}

      {tab === "field" && (
        <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
          <div className="space-y-6">
            <EmergencyMenu />
            <TrackerPanel />
          </div>
          <LanguageVault phrasePack={phrases} loading={loadingPhrases} />
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{ backgroundColor: "var(--card)", borderTop: "1px solid var(--border-gold)", paddingBottom: "env(safe-area-inset-bottom)" }}
        data-testid="mobile-bottom-nav"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 flex flex-col items-center gap-0.5 transition-colors"
            style={{ color: tab === t.id ? "var(--gold)" : "var(--text-muted)" }}
            data-testid={`mobile-tab-${t.id}`}
          >
            <t.icon size={18} />
            <span className="text-[0.62rem] tracking-wide uppercase">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

const Generating = () => (
  <div className="parchment-card p-8 text-center" data-testid="plan-loading">
    <Loader2 size={22} className="animate-spin mx-auto" style={{ color: "var(--gold)" }} />
    <h3 className="font-serif-display text-xl sm:text-2xl mt-3" style={{ color: "var(--text)" }}>
      Analysing place, season and team
    </h3>
    <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
      Predicting weather for your dates, grading navigation and language difficulty, and scaling every consumable to your headcount.
    </p>
  </div>
);

const Empty = ({ onGo, label }) => (
  <div className="parchment-card p-7 sm:p-9 text-center" data-testid="dossier-empty-state">
    <div className="caption mb-2">Awaiting Coordinates</div>
    <h3 className="font-serif-display text-xl sm:text-2xl" style={{ color: "var(--text)" }}>
      {label || "No dossier loaded"}
    </h3>
    <button onClick={onGo} className="pill-btn pill-btn-primary mt-5" data-testid="goto-plan-button">
      Set up an expedition
    </button>
  </div>
);

const SavedList = ({ entries, onLoad, onDelete }) => (
  <div className="parchment-card p-5 sm:p-7" data-testid="saved-expeditions-panel">
    <div className="caption">Offline Vault · {entries.length}</div>
    <h3 className="font-serif-display text-xl sm:text-2xl mt-1 mb-4" style={{ color: "var(--text)" }}>
      Saved dossiers
    </h3>
    {entries.length === 0 ? (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Nothing stored yet. Generate a dossier, then tap &ldquo;Save dossier to Vault&rdquo; to keep it available with no signal.
      </p>
    ) : (
      <ul className="space-y-3">
        {entries.map((e) => (
          <li key={e.id} className="p-4 rounded" data-testid="vault-saved-item-card" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border-gold)" }}>
            <div className="font-serif-display text-lg" style={{ color: "var(--text)" }}>
              {e.plan?.destination || "Untitled"}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {e.plan?.params?.start_date} → {e.plan?.params?.end_date} · {e.plan?.params?.member_count} members
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => onLoad(e)} className="pill-btn flex-1" style={{ padding: "0.35rem 0.85rem", fontSize: "0.75rem" }} data-testid="vault-item-load">
                Load dossier
              </button>
              <button onClick={() => onDelete(e.id)} className="pill-btn" style={{ padding: "0.35rem 0.6rem" }} data-testid="vault-item-delete">
                <Trash2 size={13} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);
