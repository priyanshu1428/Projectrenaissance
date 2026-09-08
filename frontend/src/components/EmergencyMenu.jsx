import React, { useState } from "react";
import { Siren, Compass, Droplet, HeartPulse, Package, X, Radio, CloudLightning, Bone, ShieldAlert } from "lucide-react";
import { useTracker } from "../context/TrackerContext";

const ACTIONS = {
  im_lost: {
    testId: "emergency-action-im-lost",
    label: "I'm Lost",
    icon: <Compass size={16} />,
    tagline: "Stop moving before you make it worse",
    broadcast: true,
    steps: [
      "STOP. Sit down for 3 minutes and drink water. Most people get properly lost in the 20 minutes after they realise they are lost, by walking fast in the wrong direction.",
      "Mark exactly where you are: drop a GPS fix (Ping now on the GPS panel) and pile stones or tie something bright. This becomes your anchor point.",
      "Reconstruct: when were you last certain of your position, and how long ago? At walking pace assume 4 km/h on trail, 2 km/h off trail. That radius is your search area.",
      "Look up, not down: find a ridge, river, road, coastline or power line — a 'handrail' you cannot miss. Water flows downhill to people; ridges give signal and visibility.",
      "If you have less than 2 hours of daylight, or weather is closing in: stop and make camp. Do not night-navigate unknown ground.",
      "Signal in threes: 3 whistle blasts, 3 flashes, 3 shouts, then wait 1 minute and repeat. Rescuers listen for patterns, not noise.",
      "If you decide to move, walk one bearing only and count your paces so you can walk back the exact same line.",
    ],
    donts: ["Don't split the group.", "Don't descend into a gorge or thick scrub to 'cut across'.", "Don't drain your phone battery on maps — screenshot or use the cached dossier."],
  },
  medical: {
    testId: "emergency-action-medical",
    label: "Medical Emergency",
    icon: <HeartPulse size={16} />,
    tagline: "Scene, ABC, bleeding, then evacuate",
    broadcast: true,
    steps: [
      "Make the scene safe first — rockfall, traffic, water, cold ground. A second casualty ends the expedition.",
      "Check response, then Airway, Breathing, Circulation. No breathing → start CPR: 30 compressions (5-6 cm deep, ~110/min) to 2 breaths, and do not stop to reassess.",
      "Catastrophic bleeding beats airway: hard direct pressure, packed dressing, and a tourniquet high and tight on a limb if pressure fails. Write the time on the casualty's forehead.",
      "Insulate immediately — ground pad, dry layers, hat, bivvy bag. Cold kills injured people faster than the injury.",
      "Broadcast coordinates plus this exact script: number of casualties, age/sex, what happened, main injury, whether they are breathing, and your landing/access options.",
      "Keep a written log every 15 minutes: pulse, breathing rate, alertness, drugs given. Rescuers act on the trend, not one number.",
      "Nil by mouth if surgery or evacuation is likely; small sips only if fully alert and no abdominal injury.",
    ],
    donts: ["Don't move a suspected spinal injury unless they are in immediate danger.", "Don't remove an embedded object.", "Don't give painkillers that thin blood (aspirin/ibuprofen) to someone bleeding."],
  },
  low_water: {
    testId: "emergency-action-low-water",
    label: "Low on Water",
    icon: <Droplet size={16} />,
    tagline: "Ration sweat, not water",
    broadcast: false,
    steps: [
      "Drink what you have — carrying water in your stomach is better than in a bottle. Dehydrated decision-making is the real danger.",
      "Ration sweat instead: stop moving in the heat, get in shade, loosen and cover up, move at dawn and dusk only.",
      "Head downhill and into the greenest line you can see. Gullies, boulder bases, north-facing slopes and animal tracks converge on water.",
      "Collect what you can: dew off a cloth at dawn, snow melted first (never eat snow), a clear bag tied over a leafy branch, condensation from a solar still.",
      "Treat everything: rolling boil 1 minute (3 minutes above 2,000 m), or filter, or chlorine dioxide with 30 minutes' contact time — double it if the water is cold or cloudy.",
      "Silty water: pre-settle in a bottle for 20 minutes and decant, otherwise you will clog your filter for the rest of the trip.",
      "Update your Kit tab so your days-of-supply figure stays honest for the whole team.",
    ],
    donts: ["Don't drink seawater, urine or alcohol.", "Don't push on into heat with under 1 L left.", "Don't eat much if water is short — digestion costs water."],
  },
  lost_supplies: {
    testId: "emergency-action-lost-supplies",
    label: "Lost Supplies",
    icon: <Package size={16} />,
    tagline: "Rebuild in the order that keeps you alive",
    broadcast: false,
    steps: [
      "Empty every pocket and pack and lay it all out. Inventory what you actually have before you plan anything.",
      "Rebuild in survival order: shelter and insulation first, then water, then fire/signal, then food. You survive weeks without food.",
      "Shelter fast and small: a tarp or bivvy low to the ground, insulated from below with pine, leaves or your empty pack — the ground steals more heat than the air.",
      "Improvise water carriage: dry bag, bottle, even a sealed pack liner. Boil in a metal container or with hot stones.",
      "Reassign the team's remaining kit deliberately — one navigator, one first aid holder, one signal holder — and note it in the Kit tab.",
      "Decide now: continue on reduced supplies or turn back. Set a hard turnaround time and honour it.",
      "Leave a note at your last camp with your name, date, plan and direction of travel in case searchers arrive.",
    ],
    donts: ["Don't keep searching for lost kit after dark.", "Don't share out the last of the food equally 'to be fair' — the strongest member gets you help.", "Don't burn daylight rebuilding gear you don't need."],
  },
  severe_weather: {
    testId: "emergency-action-severe-weather",
    label: "Storm / Whiteout",
    icon: <CloudLightning size={16} />,
    tagline: "Get low, get small, get insulated",
    broadcast: false,
    steps: [
      "Get off ridges, summits, cols and open water immediately. Descend even if it costs you the objective.",
      "Lightning: crouch on your pack, feet together, off metal and away from lone trees and cave mouths. Spread the group 5-10 m apart. Wait 30 minutes after the last thunder.",
      "Whiteout: stop and pitch. Navigating a whiteout on featureless snow reliably walks people in circles or over cornices.",
      "Pitch with the smallest end into the wind, dig out or build a wind wall, and clear the drift every hour so you are not buried.",
      "Change into dry layers before you get cold, then eat something fatty and brew a hot drink — shivering burns your reserves fast.",
      "Set a watch rotation and a check time. Agree what happens if the storm is still on at that time.",
    ],
    donts: ["Don't shelter under a lone tree or in a shallow overhang.", "Don't cross swollen rivers — wait, they usually drop within hours.", "Don't stay in wet cotton layers."],
  },
  injured_member: {
    testId: "emergency-action-injured-member",
    label: "Injured Member",
    icon: <Bone size={16} />,
    tagline: "Stabilise, decide, then move as a team",
    broadcast: false,
    steps: [
      "Treat the injury, then honestly test function: can they walk 20 m, carry a pack, use both hands? That answer sets the whole plan.",
      "Splint above and below the joint with poles, mats or a rolled sleeping bag. Check fingers/toes for warmth and feeling every 20 minutes.",
      "Sprains and soft tissue: compress, elevate, cool if you can spare water, and tape the boot firmly — support beats rest when you still have to walk out.",
      "Redistribute their load across the team before you move a step. One person walks in front, one behind, on their weak side.",
      "Set a realistic pace: assume half your normal speed and double your rest stops. Recalculate whether you still reach camp before dark — if not, camp now.",
      "If they cannot walk, do not attempt a long carry with fewer than four fit people. Shelter them, keep them warm, and send two people out for help with a written note of your position and time.",
    ],
    donts: ["Don't leave an injured person alone if you can avoid it.", "Don't hand out painkillers that mask a joint injury and hide further damage.", "Don't let them carry the group's critical kit."],
  },
};

export default function EmergencyMenu() {
  const [open, setOpen] = useState(null);
  const [broadcast, setBroadcast] = useState(null);
  const { last, ping } = useTracker();
  const lastKnown = last ? { lat: last.lat, lng: last.lng, at: new Date(last.t).toISOString() } : null;

  const doBroadcast = async () => {
    if (lastKnown) {
      setBroadcast(lastKnown);
      return;
    }
    try {
      const p = await ping();
      setBroadcast({ lat: p.lat, lng: p.lng, at: new Date(p.t).toISOString() });
    } catch {
      setBroadcast({ unavailable: true, at: new Date().toISOString() });
    }
  };

  const action = open ? ACTIONS[open] : null;

  return (
    <div className="parchment-card p-5 sm:p-8" data-testid="emergency-menu-panel">
      <div className="caption flex items-center gap-1.5">
        <Siren size={12} style={{ color: "#B94040" }} /> Respuesta en Campo
      </div>
      <h3 className="font-serif-display text-xl sm:text-2xl mt-1 mb-4" style={{ color: "var(--text)" }}>
        Menú de Emergencia
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {Object.entries(ACTIONS).map(([key, a]) => (
          <button
            key={key}
            onClick={() => {
              setOpen(key);
              setBroadcast(null);
            }}
            data-testid={a.testId}
            className="p-3.5 rounded text-left transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--badge)", border: "1px solid var(--border-gold)" }}
          >
            <div className="flex items-center gap-2" style={{ color: "var(--gold)" }}>
              {a.icon}
              <span className="font-serif-display text-lg" style={{ color: "var(--text)" }}>
                {a.label}
              </span>
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {a.tagline}
            </div>
          </button>
        ))}
      </div>

      {action && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          onClick={() => setOpen(null)}
        >
          <div
            className="parchment-card w-full sm:max-w-lg max-h-[88vh] overflow-y-auto eg-scroll p-5 sm:p-6 animate-fade-up"
            onClick={(e) => e.stopPropagation()}
            data-testid="emergency-modal"
            style={{ borderRadius: "10px 10px 0 0" }}
          >
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex items-center gap-2" style={{ color: "var(--gold)" }}>
                {action.icon}
                <h4 className="font-serif-display text-xl" style={{ color: "var(--text)" }}>
                  {action.label}
                </h4>
              </div>
              <button onClick={() => setOpen(null)} data-testid="emergency-modal-close" className="shrink-0">
                <X size={20} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{action.tagline}</p>

            <ol className="space-y-3 mb-5">
              {action.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "var(--text)" }} data-testid={`emergency-step-${i}`}>
                  <span
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                    style={{ backgroundColor: "var(--gold)", color: "var(--bg)" }}
                  >
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>

            <div className="p-3.5 rounded mb-5" style={{ border: "1px solid #B94040" }} data-testid="emergency-donts">
              <div className="caption flex items-center gap-1.5 mb-2" style={{ color: "#B94040" }}>
                <ShieldAlert size={12} /> No hagas esto
              </div>
              <ul className="space-y-1.5">
                {action.donts.map((d, i) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: "var(--text)" }}>
                    <span style={{ color: "#B94040" }}>×</span> {d}
                  </li>
                ))}
              </ul>
            </div>

            {action.broadcast && (
              <>
                <button
                  onClick={doBroadcast}
                  data-testid="emergency-coord-broadcast"
                  className="pill-btn pill-btn-primary w-full"
                  style={{ backgroundColor: "#B94040", borderColor: "#B94040", color: "#FBF9F5" }}
                >
                  <Radio size={14} /> Transmitir coordenadas
                </button>

                {broadcast && (
                  <div
                    className="mt-3 p-3 rounded text-sm"
                    style={{ backgroundColor: "var(--badge)", border: "1px solid var(--border-gold)", color: "var(--text)" }}
                    data-testid="emergency-broadcast-result"
                  >
                    {broadcast.unavailable ? (
                      <span>No GPS fix available — signal instead: 3 whistle blasts, 3 flashes, repeat every minute.</span>
                    ) : (
                      <>
                        <div className="caption mb-1">Lee esto en voz alta / envíalo por SMS</div>
                        <div className="font-mono text-xs break-all">
                          LAT {broadcast.lat.toFixed(5)} · LNG {broadcast.lng.toFixed(5)}
                        </div>
                        <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                          Hora de la toma · {new Date(broadcast.at).toLocaleString()}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
