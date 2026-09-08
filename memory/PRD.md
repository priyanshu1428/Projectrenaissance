# Expedition Guardian — PRD

## Original Problem Statement
Mobile-first web app "Expedition Guardian" — "Prepare Online. Operate Offline." French Chic / Parisian Vintage aesthetic (cream #FBF9F5, olive/navy, antique gold), 4-theme switcher, AI-curated expedition dossiers, Leaflet + OSM maps, and full offline operation.

## User Choices
- Gemini 3 Flash (`gemini-3-flash-preview`) via Emergent Universal LLM Key
- Leaflet + OpenStreetMap (no Google Maps key)
- JWT email/password auth · Fonts: Playfair Display + Work Sans
- (2026-06) Offline: PWA + service worker + IndexedDB pre-downloaded tile cache
- (2026-06) GPS breadcrumb every 10 min, plotted on the offline map with coords
- (2026-06) Setup inputs: destination, start/end dates, team size, roster (names/roles/experience), team experience, trip type, notes
- (2026-06) Quantity-scaled supply tracker (required vs packed vs used, days-of-supply)
- (2026-06) Route Builder + Share To Base deferred to the next build
- (2026-06) Explicit requirement: must fit perfectly on every mobile device

## Architecture
- **Backend** (FastAPI + MongoDB): JWT auth (bcrypt + PyJWT, cookie + Bearer), `POST /api/expedition/plan` (Gemini-curated dossier + server-side gear quantity scaling in `_scale_gear`), `POST/GET/DELETE /api/expeditions`, `POST /api/phrases`, legacy `/api/briefing` + `/api/checklist/template`
- **Frontend** (React 19 + Tailwind + Leaflet): tabbed mobile shell (Plan / Dossier / Kit / Map / Field) with fixed bottom nav <640px and pill tabs above; contexts Auth / Theme / Network / Tracker; IndexedDB (`expedition_guardian`: expeditions, tiles, track, gear, meta); custom `OfflineTileLayer` (IndexedDB-first tiles); service worker app-shell cache

## What's Been Implemented
### 2026-02-08 (MVP)
- French Chic UI, 4 themes, JWT auth, landing page
- Destination briefing + offline language phrase pack (Gemini)
- Leaflet + OSM map, readiness score, checklist, localStorage vault, emergency menu

### 2026-06 (Offline + AI core)
- **AI-curated expedition dossier** from place + exact dates + team: summary, predicted weather for the window (with per-period risk), terrain, navigation difficulty gauge, language difficulty, communication/signal + device counts, water sources, medical hazards, group risk for that headcount, day-by-day timeline, analyst insights. Rendered as clean typography, no chatbox.
- **Quantity-scaled gear list**: required qty computed server-side from `daily_per_person × members × days`, `per_person × members`, or team `fixed_qty`; scaling basis shown per item.
- **Supply / consumables tracker**: packed & used +/- counters (offline-safe, persisted in IndexedDB per expedition), readiness score weighted 2× for critical items, per-category breakdown, days-of-supply per consumable with shortfall warning.
- **Offline Kit**: tile region pre-download (zoom 8–13, 10–80 km radius) with progress, on-device tile count, save dossier to IndexedDB Vault, downloadable JSON dossier.
- **True offline operation**: PWA manifest + icons + service worker shell cache; cached session so a reload with no network stays signed in; dossier, kit and cached map tiles all work offline (verified with the browser forced offline).
- **GPS breadcrumb tracker**: fix every 10 min (interval + warm `watchPosition`, screen wake lock), stored in IndexedDB, numbered trail + dashed polyline on the map, pulsing "LAST KNOWN" pin, decimal + DMS coords, accuracy, altitude, copy-coordinates, trail list, manual "Ping now".
- Emergency menu + Navbar now broadcast the live tracked coordinates; NetworkContext follows real `navigator.onLine` plus a manual toggle.
- Mobile-first pass: verified zero horizontal overflow on every tab at 390×844 and at 1920×800.

## Known Limitation (disclosed in the UI)
Browsers cannot sample GPS when the app is fully closed. Tracking runs while Expedition Guardian is open or backgrounded (installed PWA recommended); this is surfaced in the tracker panel.

### 2026-06 (Plan gating, custom itinerary, journey mode, real field protocols)
- **Plan gating**: Dossier / Kit / Map tabs are locked (lock icon + toast) until an expedition exists. The Plan form has live validation with a "X of 4 required complete" tracker, red inline errors, and requires a name for every roster member.
- **AI no longer writes a timeline** — replaced by a user-built **Itinerary** (add / edit / reorder / delete days with notes and distance), stored on-device per expedition and editable offline.
- **Kit journey mode**: while packing you set Packed amounts; at 100% a "Confirm kit & start journey" confirmation appears; after confirming, the Kit becomes a live consumption log (Remaining per item, Use / Undo, OUT flags, day counter, days-of-supply) with an "Adjust packed amounts" toggle and "End journey" escape. Phase persisted in IndexedDB.
- **Field Response rewritten**: 6 protocols (I'm Lost, Medical Emergency, Low on Water, Lost Supplies, Storm / Whiteout, Injured Member) with detailed correct-order field guidance plus a "Do not" block. Broadcast Coordinates now appears only on I'm Lost and Medical Emergency.
- Auth verified end-to-end: register → dashboard, sign out, sign back in with the same account.

## Prioritized Backlog
- **P0**: Route Builder — drop/reorder multi-checkpoint waypoints with saved elevation profiles
- **P0**: Share To Base — read-only dossier + live itinerary link for a base contact
- **P1**: Auto-cache tiles along the planned route corridor (not just a radius)
- **P1**: Printable / PDF dossier for paper handoff
- **P2**: GPX / KML import onto the map
- **P2**: Per-member gear assignment (who carries what)
- **P3**: Open-Meteo refresh to reconcile the AI forecast with live data

## Test Credentials
- Admin: `admin@expedition.com` / `Guardian2026!` (see `/app/memory/test_credentials.md`)

## Test Reports
- `/app/test_reports/iteration_1.json` (MVP), `/app/test_reports/iteration_2.json` (offline + AI core: backend 10/10, frontend ~95%)
