# 🌧️ FloodSafe Chennai
### Predict. Navigate. Stay Safe.

An AI-assisted flood safety and navigation platform for Chennai. It turns
flood information into an actionable decision: not just "where is it
flooding," but "what should I do next."

**All technologies used (maps, weather, routing, USSD, chatbots) already
exist individually.** The contribution here is connecting them through one
flood-risk decision engine, and — most importantly — building it so it
**never breaks**, even with zero API keys configured.

---

## What's in this folder

```
floodsafe-chennai.html   ← THE MAIN DEMO. Open this file directly in any
                            browser. No install, no build step, no API
                            keys. Fully self-contained (map, risk engine,
                            safe routing, emergency mode, USSD simulator,
                            AI assistant, dashboard).

backend/                 ← A FastAPI backend that mirrors the same risk
  app/main.py               engine and exposes the REST API described in
  requirements.txt          the project spec (/api/flood-zones,
                             /api/safe-route, /api/chat, /api/ussd, etc).
                             Useful if you want a real client/server
                             architecture to build on, or to wire in a
                             React frontend later. Not required to see
                             the demo working — the HTML file above
                             stands alone.

.env.example              ← Optional keys (OpenWeather, an LLM provider,
                             OSRM, a USSD gateway). Every one of these is
                             OPTIONAL — the app runs entirely on demo data
                             without any of them.
```

## Quickest path to a working demo

Just open `floodsafe-chennai.html` in a browser (double-click it, or drag
it into a browser tab). That's it — everything works immediately:

- **Dashboard** — citywide stats + interactive Leaflet map of 15 Chennai
  areas, color-coded by flood risk (click any marker for a full
  breakdown and a 3-hour forecast).
- **Safe Route** — pick a "from" and "to," see the shortest route vs. the
  AI-recommended safer route, with a plain-language explanation of the
  trade-off.
- **Emergency Mode** — a dedicated mode that always prioritizes flood
  safety over speed, plus one-tap 112 / 108 / 101 helplines.
- **Facilities** — hospitals, ambulance points, fire stations, relief
  centres.
- **USSD Access** — a simulated `*123#` menu for low-connectivity access.
- **AI Flood Assistant** — a floating chat assistant (rule-based; answers
  using the app's own live risk data — ask it "Is Velachery safe?").

## Running the backend (optional)

The backend is a scaffold matching the API architecture in the spec. It
was written but **not executed in this environment** (no network access
to install packages here), so test it locally before relying on it:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # or your preferred env tool
pip install -r requirements.txt
cp ../.env.example .env      # optional — all keys are optional
uvicorn app.main:app --reload --port 8000
```

Then visit `http://localhost:8000/api/health` and
`http://localhost:8000/docs` (FastAPI's built-in interactive API docs).

## Design notes

- **Risk engine**: `Flood Risk Score = Rainfall×0.40 + Elevation×0.20 +
  Waterlogging×0.20 + Historical×0.20`, classified as LOW (0–30),
  MODERATE (31–50), HIGH (51–70), SEVERE (71–100). It's a transparent
  weighted model by design — swap `compute_risk()` for a trained model
  later without touching anything else.
- **Every external dependency has a fallback**: weather, routing, the AI
  assistant, and USSD all degrade gracefully to demo data/logic if a key
  or provider is missing or unreachable. Nothing should ever crash the
  demo.
- **All area, rainfall, weather, and facility figures are illustrative
  demo data**, clearly labeled as such throughout the UI — not live
  government data.

## Suggested next steps

- Swap `AREAS` demo data for a real Chennai open-data flood/elevation
  dataset.
- Wire `get_weather()` to a real OpenWeather call when a key is present.
- Replace the demo distance/risk route model with a real OSRM instance.
- Add a persistence layer (the spec's suggested tables: `areas`,
  `flood_risk`, `weather`, `roads`, `routes`, `emergency_facilities`,
  `forecast`, `chat_logs`, `ussd_sessions`) — SQLite for a hackathon MVP,
  Postgres later.
