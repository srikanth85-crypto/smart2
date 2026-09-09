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

main.py                 ← FastAPI backend for the REST API.
requirements.txt        ← Root backend dependencies.
test_app.py             ← Backend regression tests.
floodsafe-chennai/      ← Archived nested project copy; use the root files
                           above for the current demo.

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
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then visit `http://localhost:8000/api/health` and
`http://localhost:8000/docs` (FastAPI's built-in interactive API docs).

## Design notes

- **Risk engine**: `Flood Risk Score = Rainfall×0.40 + Elevation×0.20 +
  Waterlogging×0.20 + Historical×0.20`, classified as LOW (0–30),
  MODERATE (31–50), HIGH (51–70), SEVERE (71–100). It's a transparent
  weighted model by design — swap `compute_risk()` for a trained model
  later without touching anything else.
- **Demo mode is explicit**: route geometry, weather, and chat responses
  are illustrative fallback logic, not live emergency navigation or live
  weather data.
- **Deployment guard**: set `FLOODSAFE_API_KEY` to require `X-API-Key` on
  non-health API endpoints, and set `ALLOWED_ORIGINS` to trusted frontend
  origins separated by commas.
- **All area, rainfall, weather, and facility figures are illustrative
  demo data**, clearly labeled as such throughout the UI — not live
  government data.

## Production upgrade

The root backend now includes a production-shaped vertical slice:

- JWT login, password hashing, bearer-token identity, and server-side roles.
- SQLAlchemy models for users, road closures, emergency requests, and
  responder assignments. SQLite is the local default; PostgreSQL is selected
  with `DATABASE_URL`.
- OpenWeather and OSRM adapters. Configure their keys/URLs to enable live
  data; responses identify whether they are live or fallback data.
- Emergency request state transitions and assignment conflict protection.
- Structured request logs, database health reporting, Dockerfile, and
  PostgreSQL `docker-compose.yml`.
- Backend regression tests plus optional Playwright browser/accessibility
  smoke tests.

For the containerized stack:

```powershell
Copy-Item .env.example .env
# Replace JWT_SECRET and FLOODSAFE_API_KEY in .env before deployment.
docker compose up --build
```

The standalone HTML still supports an explicit offline demo when opened as a
file. When served from a web origin, it attempts JWT login against
`http://localhost:8000`; set `localStorage.floodsafe_api_base` to point it at
another API host.

## Suggested next steps

- Swap `AREAS` demo data for a real Chennai open-data flood/elevation
  dataset.
- Wire `get_weather()` to a real OpenWeather call when a key is present.
- Replace the demo distance/risk route model with a real OSRM instance.
- Add a persistence layer (the spec's suggested tables: `areas`,
  `flood_risk`, `weather`, `roads`, `routes`, `emergency_facilities`,
  `forecast`, `chat_logs`, `ussd_sessions`) — SQLite for a hackathon MVP,
  Postgres later.
