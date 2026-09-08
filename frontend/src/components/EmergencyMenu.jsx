import React, { useState } from "react";
import { Siren, Compass, Droplet, HeartPulse, Package, X, Radio } from "lucide-react";
import { useNetwork } from "../context/NetworkContext";

const ACTIONS = {
  im_lost: {
    testId: "emergency-action-im-lost",
    label: "I'm Lost",
    icon: <Compass size={16} />,
    steps: [
      "Stop, calm, breathe. Do not wander further.",
      "Broadcast your last known coordinates using the button below.",
      "STOP protocol: Stop, Think, Observe, Plan.",
      "Return uphill or to your last known landmark if safe.",
    ],
  },
  low_water: {
    testId: "emergency-action-low-water",
    label: "Low on Water",
    icon: <Droplet size={16} />,
    steps: [
      "Ration existing water — small sips, not gulps.",
      "Seek shade, reduce exertion, cover skin.",
      "Move downhill toward valleys or vegetation lines.",
      "Purify any water found (boil ≥1 min or tablets).",
    ],
  },
  medical: {
    testId: "emergency-action-medical",
    label: "Medical Problem",
    icon: <HeartPulse size={16} />,
    steps: [
      "Assess: Airway, Breathing, Circulation.",
      "Stop major bleeding with direct pressure.",
      "Broadcast coordinates and injury type.",
      "Do not move the patient if spinal injury is suspected.",
    ],
  },
  lost_supplies: {
    testId: "emergency-action-lost-supplies",
    label: "Lost Supplies",
    icon: <Package size={16} />,
    steps: [
      "Inventory everything remaining on your person.",
      "Prioritize: shelter > water > fire > food.",
      "Improvise: mylar or leaves for insulation.",
      "Signal: three of anything (fires, whistles, mirrors).",
    ],
  },
};

export default function EmergencyMenu() {
  const [open, setOpen] = useState(null);
  const [broadcast, setBroadcast] = useState(null);
  const { lastKnown } = useNetwork();

  const doBroadcast = () => {
    let coords = lastKnown;
    if (!coords && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            at: new Date().toISOString(),
          };
          setBroadcast(c);
        },
        () => {
          setBroadcast({ lat: null, lng: null, at: new Date().toISOString(), unavailable: true });
        }
      );
      return;
    }
    setBroadcast(coords || { unavailable: true, at: new Date().toISOString() });
  };

  return (
    <div className="parchment-card p-6 sm:p-8" data-testid="emergency-menu-panel">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="caption flex items-center gap-1.5">
            <Siren size={12} style={{ color: "#B94040" }} /> Field Response
          </div>
          <h3 className="font-serif-display text-2xl mt-1" style={{ color: "var(--text)" }}>
            Emergency Menu
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {Object.entries(ACTIONS).map(([key, a]) => (
          <button
            key={key}
            onClick={() => {
              setOpen(key);
              setBroadcast(null);
            }}
            data-testid={a.testId}
            className="p-4 rounded text-left transition-transform hover:-translate-y-0.5"
            style={{
              backgroundColor: "var(--badge)",
              border: "1px solid var(--border-gold)",
            }}
          >
            <div className="flex items-center gap-2 mb-1" style={{ color: "var(--gold)" }}>
              {a.icon}
              <span className="font-serif-display text-lg" style={{ color: "var(--text)" }}>
                {a.label}
              </span>
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              Tap for a 4-step response protocol
            </div>
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setOpen(null)}
        >
          <div
            className="parchment-card p-6 max-w-md w-full animate-fade-up"
            onClick={(e) => e.stopPropagation()}
            data-testid="emergency-modal"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2" style={{ color: "var(--gold)" }}>
                {ACTIONS[open].icon}
                <h4 className="font-serif-display text-xl" style={{ color: "var(--text)" }}>
                  {ACTIONS[open].label}
                </h4>
              </div>
              <button onClick={() => setOpen(null)} data-testid="emergency-modal-close">
                <X size={18} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>
            <ol className="space-y-2 mb-5">
              {ACTIONS[open].steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm" style={{ color: "var(--text)" }}>
                  <span
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                    style={{
                      backgroundColor: "var(--gold)",
                      color: "var(--bg)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>

            <button
              onClick={doBroadcast}
              data-testid="emergency-coord-broadcast"
              className="pill-btn pill-btn-primary w-full"
              style={{ backgroundColor: "#B94040", borderColor: "#B94040" }}
            >
              <Radio size={14} /> Broadcast Coordinates
            </button>

            {broadcast && (
              <div
                className="mt-3 p-3 rounded text-sm"
                style={{
                  backgroundColor: "var(--badge)",
                  border: "1px solid var(--border-gold)",
                  color: "var(--text)",
                }}
                data-testid="emergency-broadcast-result"
              >
                {broadcast.unavailable ? (
                  <span>Coordinates unavailable — signal via whistle (3 blasts) or mirror.</span>
                ) : (
                  <>
                    <div className="caption mb-1">Broadcast payload</div>
                    <div className="font-mono text-xs">
                      LAT {broadcast.lat.toFixed(5)} · LNG {broadcast.lng.toFixed(5)}
                    </div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      Time · {new Date(broadcast.at).toLocaleString()}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
