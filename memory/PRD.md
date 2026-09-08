# Expedition Guardian — PRD

## Original Problem Statement
Build a fully responsive, mobile-first web app "Expedition Guardian" — tagline "Prepare Online. Operate Offline." with a French Chic / Parisian Vintage aesthetic (cream #FBF9F5, olive/navy, antique gold). Features: 4-theme switcher, global destination search via Gemini API, auto offline language phrase pack, Leaflet+OSM map, Save-to-Vault (localStorage), online/offline toggle with last-known coords rescue pin, interactive readiness score with dynamic categorized checklists, and a Field Response emergency menu (I'm Lost / Low on Water / Medical / Lost Supplies). No AI chatbox.

## User Choices (2026-02-08)
- Gemini 3 Flash (`gemini-3-flash-preview`) via Emergent Universal LLM Key
- Leaflet + OpenStreetMap (no Google Maps key)
- localStorage vault
- JWT-based email/password auth
- Fonts: Playfair Display + Work Sans

## Architecture
- **Backend** (FastAPI + MongoDB): JWT auth (bcrypt + PyJWT, httpOnly cookie + Bearer), `/api/briefing`, `/api/phrases`, `/api/checklist/template`, admin auto-seed
- **Frontend** (React 19 + Tailwind + Leaflet): 4-theme CSS variables system, AuthContext / ThemeContext / NetworkContext, dashboard hub, localStorage vault helpers

## User Persona
- **Solo trekker / expedition planner** who needs a self-contained briefing tool that continues to serve them once cell signal drops.

## What's Been Implemented (2026-02-08)
- French Chic UI with parchment background, antique gold borders, grain overlay, Playfair Display + Work Sans typography
- 4-theme switcher (Parisian Chic / Tactical Dark / Deep Jungle / Desert Sand) via CSS variables
- JWT auth: register / login / me / logout with cookie + Bearer, admin seeding
- Landing page with sample dossier card
- Dashboard: global destination search → Gemini briefing (weather / terrain / water sources / medical hazards / language)
- Auto-triggered Offline Language Phrase Pack (emergency / navigation / medical, 6 phrases each with local script + phonetic + copy button)
- Interactive Leaflet + OSM map with antique sepia tint, gold destination marker, red pulsing rescue pin
- Real-time Readiness Score gauge + per-category breakdown (Navigation, Water, Communication, First Aid)
- Interactive checklist with default items, custom additions, live score recompute
- Save-to-Vault (localStorage) + Vault drawer to view / load / delete saved dossiers
- Online/Offline network toggle: captures last-known coords on going offline, drops rescue pin, offline banner, falls back to Vault for searches
- Emergency menu: 4 field-response protocols, coord broadcast payload

## Prioritized Backlog
- **P1**: Streaming Gemini responses for faster perceived load
- **P1**: Downloadable / printable dossier (PDF) for truly offline handoff
- **P2**: Share expedition dossier with a base contact via link/email
- **P2**: Import GPX / KML tracks onto the Leaflet map
- **P2**: Multi-checkpoint route builder with waypoint list
- **P3**: Weather API refresh (Open-Meteo) to keep briefing current
- **P3**: PWA install + service-worker map tile caching for true offline map

## Test Credentials
- Admin: `admin@expedition.com` / `Guardian2026!`
- See `/app/memory/test_credentials.md`
