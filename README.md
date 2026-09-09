# 🌧️ FloodSafe Chennai
### Predict. Navigate. Stay Safe.

FloodSafe is a deployable emergency-intelligence platform for residents,
ambulance teams, fire and rescue teams, and operations coordinators. It turns
flood signals and citizen reports into prioritized, explainable actions.

The platform uses provider-backed AI with a deterministic safety fallback, so
it remains available when an external model, weather provider, or routing
provider is unavailable.

---

## What's in this folder

```
floodsafe-chennai.html   ← browser application shell

main.py                 ← FastAPI platform API and orchestration layer.
ai_service.py           ← provider-backed AI gateway with safe fallback.
db.py / auth.py         ← persistence and role-based authentication.
requirements.txt        ← backend dependencies.
test_app.py             ← Backend regression tests.
floodsafe-chennai/      ← legacy nested copy; root files are canonical.

```

## Run locally

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Open `http://localhost:8000`. The API serves the frontend and exposes
interactive documentation at `http://localhost:8000/docs`.

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
- **USSD language selection** — `*123#` starts with English, Tamil, Telugu, or Hindi selection.
- **AI Flood Assistant** — `/api/chat` uses the configured AI provider with
  flood-risk and facility context, then falls back to local safety policy.
- **Incident reports** — medical, accident, tree-fall, electrical, evacuation,
  and road-flood reports are routed to the responsible department. Critical
  reports appear first in the ambulance or fire-and-rescue workspace.
- **Toll-free voice help** — browser speech playback and speech recognition
  assist callers before dialing 1800 425 3222 when supported by the browser.

Health is available at `http://localhost:8000/api/health` and reports database,
platform version, and AI provider mode.

## Design notes

- **Risk engine**: `Flood Risk Score = Rainfall×0.40 + Elevation×0.20 +
  Waterlogging×0.20 + Historical×0.20`, classified as LOW (0–30),
  MODERATE (31–50), HIGH (51–70), SEVERE (71–100). It's a transparent
  weighted model by design — swap `compute_risk()` for a trained model
  later without touching anything else.
- **Fallback mode is explicit**: provider responses identify their source and
  stale/fallback state. Emergency guidance never claims a dispatch was
  completed unless the API stored the request.
- **Deployment guard**: set `FLOODSAFE_API_KEY` to require `X-API-Key` on
  non-health API endpoints, and set `ALLOWED_ORIGINS` to trusted frontend
  origins separated by commas.
- **Live weather provider**: set `OPENWEATHER_API_KEY` in the process
  environment. Credentials are not stored in the HTML or committed to the
  repository. If the provider rejects the key or is unreachable, the API
  returns an explicit `demo_fallback` response.
- **AI provider**: set `OPENAI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL`. The
  adapter is OpenAI-compatible and can point to a managed gateway or private
  model endpoint.
- **All area, rainfall, weather, and facility figures are illustrative
  demo data**, clearly labeled as such throughout the UI — not live
  government data.

## Production foundation

The root backend now includes a production-shaped vertical slice:

- JWT login, password hashing, bearer-token identity, and server-side roles.
- SQLAlchemy models for users, road closures, emergency requests, and
  responder assignments. SQLite is the local default; PostgreSQL is selected
  with `DATABASE_URL`.
- OpenWeather, OSRM, and OpenAI-compatible AI adapters. Configure keys and
  URLs to enable live data; responses identify whether they are live or
  fallback data.
- Structured AI triage at `/api/ai/triage`, including category, department,
  urgency, confidence, and local flood-risk context.
- API-served frontend, health metadata, and OpenAPI documentation.
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
