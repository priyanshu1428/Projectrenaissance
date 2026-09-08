import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Compass, Globe2, ShieldCheck, Languages, MapPinned } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const goStart = () => navigate(user ? "/dashboard" : "/register");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-12 sm:pt-20 pb-24 relative">
      <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        <div className="lg:col-span-7 animate-fade-up">
          <div className="caption mb-5 flex items-center gap-2">
            <Compass size={12} style={{ color: "var(--gold)" }} />
            <span>Para el explorador moderno</span>
          </div>
          <h1
            className="font-serif-display font-bold tracking-tight leading-[1.02] text-5xl sm:text-6xl lg:text-7xl"
            style={{ color: "var(--text)" }}
            data-testid="landing-hero-title"
          >
            Prepare Online.
            <br />
            <em
              style={{
                fontStyle: "italic",
                color: "var(--gold)",
                fontWeight: 500,
              }}
            >
              Operate Offline.
            </em>
          </h1>
          <p
            className="mt-6 text-lg leading-relaxed max-w-2xl"
            style={{ color: "var(--text-muted)" }}
          >
            A cartographer&apos;s briefing table for the wild. Distill any destination
            into weather, terrain, water, and hazards — then pack the whole
            expediente into your pocket for the moment the signal fades.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button
              onClick={goStart}
              data-testid="landing-cta-start"
              className="pill-btn pill-btn-primary"
              style={{ padding: "0.75rem 1.75rem", fontSize: "0.95rem" }}
            >
              Comenzar preparación
              <span aria-hidden>→</span>
            </button>
            <NavLink to="/login" data-testid="landing-cta-login" className="pill-btn">
              Entrar
            </NavLink>
          </div>

          <div className="mt-12 divider-ornament">
            <span>◆</span>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FeatureRow
              icon={<Globe2 size={18} />}
              title="Global Briefings"
              body="Any city, ridge, or wilderness — distilled by Gemini into a field-ready expediente."
            />
            <FeatureRow
              icon={<Languages size={18} />}
              title="Bóveda de Frases"
              body="A local phrase pack auto-generated for emergencies, medical, and navigation."
            />
            <FeatureRow
              icon={<MapPinned size={18} />}
              title="Bóveda Offline"
              body="Save expedientes, cached maps & your GPS trail. Everything works with no signal."
            />
            <FeatureRow
              icon={<ShieldCheck size={18} />}
              title="Readiness Score"
              body="A live gauge that climbs as you tick items across four vital domains."
            />
          </div>
        </div>

        <div className="lg:col-span-5">
          <div
            className="parchment-card p-6 sm:p-8 animate-fade-up"
            style={{ animationDelay: "0.15s" }}
          >
            <div className="caption mb-3">Ω · Expediente de muestra</div>
            <div
              className="font-serif-display text-2xl mb-1"
              style={{ color: "var(--text)" }}
            >
              Picos de Europa, Cantabria
            </div>
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>
              43.1857° N · 4.8517° W · Asturias, España
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                ["Weather", "-2°C → 11°C · Clear"],
                ["Terrain", "Karst · 300–2650 m"],
                ["Water", "3 reliable sources"],
                ["Language", "Español · es"],
              ].map(([label, val]) => (
                <div
                  key={label}
                  className="p-3 rounded"
                  style={{
                    backgroundColor: "var(--badge)",
                    border: "1px solid var(--border-gold)",
                  }}
                >
                  <div className="caption">{label}</div>
                  <div
                    className="mt-1 text-sm font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    {val}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="flex items-baseline justify-between mb-2">
                <span className="caption">Readiness</span>
                <span
                  className="font-serif-display text-2xl"
                  style={{ color: "var(--gold)" }}
                >
                  74%
                </span>
              </div>
              <div className="score-track">
                <div className="score-fill" style={{ width: "74%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon, title, body }) {
  return (
    <div className="flex gap-3 items-start">
      <div
        className="mt-1 w-9 h-9 rounded-full shrink-0 flex items-center justify-center"
        style={{
          backgroundColor: "var(--badge)",
          border: "1px solid var(--border-gold)",
          color: "var(--gold)",
        }}
      >
        {icon}
      </div>
      <div>
        <div
          className="font-serif-display text-lg"
          style={{ color: "var(--text)" }}
        >
          {title}
        </div>
        <div className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          {body}
        </div>
      </div>
    </div>
  );
}
