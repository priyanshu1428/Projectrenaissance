import React, { useEffect, useMemo, useState } from "react";
import { Search, Archive, WifiOff } from "lucide-react";
import api, { formatApiErrorDetail } from "../lib/api";
import { readVault, saveVaultEntry } from "../lib/vault";
import { useNetwork } from "../context/NetworkContext";
import { useAuth } from "../context/AuthContext";
import BriefingCard from "../components/BriefingCard";
import LanguageVault from "../components/LanguageVault";
import LeafletMap from "../components/LeafletMap";
import Readiness from "../components/Readiness";
import EmergencyMenu from "../components/EmergencyMenu";
import VaultDrawer from "../components/VaultDrawer";

export default function Dashboard() {
  const { user } = useAuth();
  const { online, lastKnown } = useNetwork();

  const [query, setQuery] = useState("");
  const [briefing, setBriefing] = useState(null);
  const [phrases, setPhrases] = useState(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [loadingPhrases, setLoadingPhrases] = useState(false);
  const [error, setError] = useState("");
  const [vault, setVault] = useState(readVault());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const [categories, setCategories] = useState([]);
  const [checked, setChecked] = useState(() => {
    return JSON.parse(localStorage.getItem("eg_checked") || "{}");
  });
  const [extras, setExtras] = useState(() => {
    return JSON.parse(localStorage.getItem("eg_extras") || "{}");
  });

  useEffect(() => {
    localStorage.setItem("eg_checked", JSON.stringify(checked));
  }, [checked]);
  useEffect(() => {
    localStorage.setItem("eg_extras", JSON.stringify(extras));
  }, [extras]);

  // Load checklist template
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const { data } = await api.get("/checklist/template");
        setCategories(data.categories || []);
      } catch {
        setCategories([]);
      }
    };
    fetchTemplate();
  }, []);

  const runSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setError("");
    setSaved(false);

    if (!online) {
      // Offline: search vault
      const hit = vault.find(
        (v) =>
          v.briefing?.destination?.toLowerCase().includes(query.toLowerCase()) ||
          v.briefing?.region?.toLowerCase().includes(query.toLowerCase())
      );
      if (hit) {
        setBriefing(hit.briefing);
        setPhrases(hit.phrases);
        setError("");
      } else {
        setError("No matching dossier in your offline Vault.");
      }
      return;
    }

    setLoadingBriefing(true);
    setLoadingPhrases(true); // start phrase loader immediately so UI shows work-in-progress
    setBriefing(null);
    setPhrases(null);
    try {
      const { data } = await api.post("/briefing", { destination: query });
      setBriefing(data);
      setLoadingBriefing(false);

      // fetch phrase pack
      if (data.language?.primary) {
        try {
          const { data: pp } = await api.post("/phrases", {
            destination: data.destination,
            language: data.language.primary,
          });
          setPhrases(pp);
        } catch (err) {
          setPhrases(null);
        } finally {
          setLoadingPhrases(false);
        }
      } else {
        setLoadingPhrases(false);
      }
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
      setLoadingBriefing(false);
      setLoadingPhrases(false);
    }
  };

  const handleSaveToVault = () => {
    if (!briefing) return;
    saveVaultEntry({ briefing, phrases });
    setVault(readVault());
    setSaved(true);
  };

  const handleLoadFromVault = (entry) => {
    setBriefing(entry.briefing);
    setPhrases(entry.phrases);
    setDrawerOpen(false);
    setQuery(entry.briefing?.destination || "");
  };

  const marker = useMemo(() => {
    if (!briefing?.coordinates) return null;
    return {
      lat: Number(briefing.coordinates.lat),
      lng: Number(briefing.coordinates.lng),
      label: briefing.destination,
    };
  }, [briefing]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
      {!online && (
        <div
          className="mb-6 p-3 rounded flex items-center gap-2 text-sm"
          style={{
            backgroundColor: "var(--badge)",
            border: "1px solid #B94040",
            color: "var(--text)",
          }}
          data-testid="offline-banner"
        >
          <WifiOff size={14} style={{ color: "#B94040" }} />
          <span>
            <b>Offline mode.</b> Searches pull from your local Vault.
            {lastKnown && (
              <span className="ml-1">
                Last known: <span className="font-mono">{lastKnown.lat.toFixed(3)}, {lastKnown.lng.toFixed(3)}</span>
              </span>
            )}
          </span>
        </div>
      )}

      <div className="mb-8">
        <div className="caption">Bienvenue, {user?.name || "Explorer"}</div>
        <h1
          className="font-serif-display text-4xl sm:text-5xl mt-1"
          style={{ color: "var(--text)" }}
        >
          Where does the map end?
        </h1>
        <p className="mt-2 text-base max-w-2xl" style={{ color: "var(--text-muted)" }}>
          Search a city, mountain range, or wilderness. We&apos;ll draft the dossier — weather,
          terrain, water, hazards — and generate a local phrase pack you can carry offline.
        </p>
      </div>

      <form onSubmit={runSearch} className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search
            size={16}
            style={{ color: "var(--gold)", position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Patagonia · Kyoto · Atlas Mountains"
            className="chic-input"
            style={{ paddingLeft: 40 }}
            data-testid="destination-search-input"
          />
        </div>
        <button
          type="submit"
          disabled={loadingBriefing}
          data-testid="destination-search-button"
          className="pill-btn pill-btn-primary"
          style={{ padding: "0.75rem 1.5rem" }}
        >
          {loadingBriefing ? "Preparing dossier..." : "Prepare"}
        </button>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="pill-btn"
          data-testid="offline-vault-drawer-toggle"
        >
          <Archive size={14} /> Vault ({vault.length})
        </button>
      </form>

      {error && (
        <div
          className="mb-6 p-3 rounded text-sm"
          data-testid="search-error"
          style={{
            backgroundColor: "color-mix(in srgb, #B94040 15%, transparent)",
            color: "#B94040",
          }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {briefing ? (
            <BriefingCard briefing={briefing} onSaveToVault={handleSaveToVault} saved={saved} />
          ) : (
            <EmptyState />
          )}

          <div className="parchment-card overflow-hidden">
            <div className="p-4 gold-border-b flex items-center justify-between">
              <div className="caption">Route Planner · Leaflet + OSM</div>
              {!online && (
                <span className="text-xs" style={{ color: "#B94040" }}>OFFLINE — cached tiles only</span>
              )}
            </div>
            <div style={{ height: 420 }}>
              <LeafletMap
                center={marker ? [marker.lat, marker.lng] : [48.8566, 2.3522]}
                marker={marker}
                rescuePin={!online ? lastKnown : null}
              />
            </div>
          </div>

          <Readiness
            categories={categories}
            checked={checked}
            setChecked={setChecked}
            extras={extras}
            setExtras={setExtras}
          />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <LanguageVault phrasePack={phrases} loading={loadingPhrases} />
          <EmergencyMenu />
        </div>
      </div>

      <VaultDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        entries={vault}
        onDelete={(next) => setVault(next)}
        onLoad={handleLoadFromVault}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="parchment-card p-8 text-center">
      <div className="caption mb-2">Awaiting Coordinates</div>
      <h3 className="font-serif-display text-2xl" style={{ color: "var(--text)" }}>
        Search a destination to open the dossier
      </h3>
      <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
        Gemini will draft a briefing covering weather, terrain, water, and hazards, and auto-generate a regional phrase pack.
      </p>
    </div>
  );
}
