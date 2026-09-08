import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Compass, Wifi, WifiOff, Palette, LogOut, MapPin, User } from "lucide-react";
import { useTheme, THEME_LABELS } from "../context/ThemeContext";
import { useNetwork } from "../context/NetworkContext";
import { useTracker } from "../context/TrackerContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { theme, setTheme, themes } = useTheme();
  const { online, toggle } = useNetwork();
  const { last } = useTracker();
  const lastKnown = last ? { lat: last.lat, lng: last.lng } : null;
  const { user, logout } = useAuth();
  const [themeOpen, setThemeOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="glass-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between gap-3">
        <NavLink
          to={user ? "/dashboard" : "/"}
          data-testid="navbar-brand"
          className="flex items-center gap-2.5 group"
        >
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border-gold)",
            }}
          >
            <Compass size={18} style={{ color: "var(--gold)" }} strokeWidth={1.6} />
          </span>
          <div className="hidden sm:block leading-tight">
            <div
              className="font-serif-display text-lg"
              style={{ color: "var(--text)" }}
            >
              Expedition Guardian
            </div>
            <div className="caption -mt-0.5">Prepara · Opera</div>
          </div>
        </NavLink>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Network status toggle */}
          <button
            data-testid="network-status-toggle"
            onClick={toggle}
            className="pill-btn"
            title={online ? "Online — click to go offline" : "Offline — pulling from Vault"}
          >
            {online ? (
              <>
                <Wifi size={15} />
                <span className="hidden sm:inline">Online</span>
                <span
                  className="w-1.5 h-1.5 rounded-full pulse-dot"
                  style={{ backgroundColor: "#4A5D4E" }}
                />
              </>
            ) : (
              <>
                <WifiOff size={15} />
                <span className="hidden sm:inline">Offline</span>
                <span
                  className="w-1.5 h-1.5 rounded-full pulse-dot"
                  style={{ backgroundColor: "#B94040" }}
                />
              </>
            )}
          </button>

          {lastKnown && (
            <div
              data-testid="last-known-coords-display"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
              style={{
                backgroundColor: "var(--badge)",
                border: "1px solid var(--border-gold)",
                color: "var(--text)",
              }}
            >
              <MapPin size={12} style={{ color: "var(--gold)" }} />
              <span className="font-mono">
                {lastKnown.lat.toFixed(3)}, {lastKnown.lng.toFixed(3)}
              </span>
            </div>
          )}

          {/* Theme switcher */}
          <div className="relative">
            <button
              data-testid="theme-switcher-select"
              onClick={() => setThemeOpen((v) => !v)}
              className="pill-btn"
              aria-label="Change theme"
            >
              <Palette size={15} />
              <span className="hidden md:inline">{THEME_LABELS[theme]}</span>
            </button>
            {themeOpen && (
              <div
                className="absolute right-0 mt-2 min-w-[190px] py-1.5 rounded-md z-50"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border-gold)",
                  boxShadow: "0 12px 32px -12px rgba(0,0,0,0.25)",
                }}
              >
                {themes.map((t) => (
                  <button
                    key={t}
                    data-testid={`theme-option-${t}`}
                    onClick={() => {
                      setTheme(t);
                      setThemeOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
                    style={{
                      color: theme === t ? "var(--gold)" : "var(--text)",
                      fontWeight: theme === t ? 600 : 400,
                    }}
                  >
                    {THEME_LABELS[t]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <button
              data-testid="logout-button"
              onClick={handleLogout}
              className="pill-btn"
              title="Sign out"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          ) : (
            <NavLink
              to="/login"
              data-testid="auth-modal-trigger"
              className="pill-btn pill-btn-primary"
            >
              <User size={15} />
              <span>Entrar</span>
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}
