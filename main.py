"""
FloodSafe Chennai — FastAPI backend
------------------------------------
Implements the flood-risk engine, safe-route engine, emergency routing,
facilities, chat and USSD endpoints described in the project spec.

Design principles:
- Every external dependency (weather API, routing API, LLM) has a
  demo-data fallback. The app must run and demo successfully with
  ZERO API keys configured.
- The scoring engine (compute_risk) is intentionally simple and
  transparent for the hackathon MVP. It is isolated in its own function
  so it can be swapped for a trained ML model later without touching
  the rest of the app.

Run locally:
    pip install fastapi uvicorn pydantic
    uvicorn main:app --reload --port 8000

Note: this file mirrors the logic in the standalone frontend
(floodsafe-chennai.html) so both stay consistent, but the HTML file
does not require this backend to run — it is fully self-contained.
"""

import math
import os
import logging
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth import create_access_token, current_user, hash_password, require_roles, verify_password
from ai_service import generate_reply, provider_status
from db import Assignment, Base, EmergencyRequest, EmergencyStatus, RoadClosure, User, UserRole, db_session, engine, init_db
from providers import fetch_route, fetch_weather

app = FastAPI(title="FloodSafe Chennai Platform API", version="2.0.0", description="AI-assisted flood intelligence and emergency coordination platform")
init_db()
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(message)s")
logger = logging.getLogger("floodsafe")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        started = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - started) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        logger.info({"request_id": request_id, "method": request.method, "path": request.url.path, "status": response.status_code, "duration_ms": duration_ms})
        return response


app.add_middleware(RequestLoggingMiddleware)

allowed_origins = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8000,null").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key"],
    allow_credentials=True,
)

API_KEY = os.getenv("FLOODSAFE_API_KEY")
FRONTEND_PATH = Path(__file__).with_name("floodsafe-chennai.html")


def provision_local_staff() -> None:
    """Create explicitly configured local responder accounts once at startup."""
    if os.getenv("SEED_LOCAL_STAFF", "false").lower() != "true":
        return
    configured = (
        ("AMBULANCE_LOGIN_EMAIL", "AMBULANCE_LOGIN_PASSWORD", UserRole.AMBULANCE),
        ("FIRE_RESCUE_LOGIN_EMAIL", "FIRE_RESCUE_LOGIN_PASSWORD", UserRole.FIRE_RESCUE),
    )
    session = next(db_session())
    try:
        for email_key, password_key, role in configured:
            email = os.getenv(email_key, "").strip().lower()
            password = os.getenv(password_key, "")
            if not email or len(password) < 8 or session.query(User).filter(User.email == email).first():
                continue
            session.add(User(email=email, password_hash=hash_password(password), role=role.value))
        session.commit()
    finally:
        session.close()


provision_local_staff()


def require_api_key(x_api_key: Optional[str] = Header(default=None)):
    """Require an API key when the deployment configures one."""
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Missing or invalid API key")


@app.get("/", include_in_schema=False)
def frontend():
    return FileResponse(FRONTEND_PATH)

# ---------------------------------------------------------------------------
# DEMO DATA — clearly labeled. Replace with real datasets when available.
# ---------------------------------------------------------------------------

AREAS = [
    {"id": "velachery", "name": "Velachery", "lat": 12.9756, "lng": 80.2201, "rainfall_mm": 82, "elevation_risk": 90, "waterlogging_risk": 90, "historical_risk": 91},
    {"id": "pallikaranai", "name": "Pallikaranai", "lat": 12.9394, "lng": 80.2183, "rainfall_mm": 78, "elevation_risk": 88, "waterlogging_risk": 92, "historical_risk": 85},
    {"id": "tambaram", "name": "Tambaram", "lat": 12.9249, "lng": 80.1000, "rainfall_mm": 70, "elevation_risk": 75, "waterlogging_risk": 80, "historical_risk": 78},
    {"id": "saidapet", "name": "Saidapet", "lat": 13.0206, "lng": 80.2229, "rainfall_mm": 60, "elevation_risk": 65, "waterlogging_risk": 70, "historical_risk": 68},
    {"id": "guindy", "name": "Guindy", "lat": 13.0067, "lng": 80.2206, "rainfall_mm": 55, "elevation_risk": 60, "waterlogging_risk": 58, "historical_risk": 60},
    {"id": "kodambakkam", "name": "Kodambakkam", "lat": 13.0524, "lng": 80.2231, "rainfall_mm": 50, "elevation_risk": 55, "waterlogging_risk": 52, "historical_risk": 50},
    {"id": "madipakkam", "name": "Madipakkam", "lat": 12.9616, "lng": 80.1988, "rainfall_mm": 48, "elevation_risk": 50, "waterlogging_risk": 55, "historical_risk": 52},
    {"id": "adyar", "name": "Adyar", "lat": 13.0012, "lng": 80.2565, "rainfall_mm": 40, "elevation_risk": 45, "waterlogging_risk": 42, "historical_risk": 40},
    {"id": "sholinganallur", "name": "Sholinganallur", "lat": 12.9010, "lng": 80.2279, "rainfall_mm": 38, "elevation_risk": 40, "waterlogging_risk": 45, "historical_risk": 42},
    {"id": "porur", "name": "Porur", "lat": 13.0359, "lng": 80.1567, "rainfall_mm": 35, "elevation_risk": 38, "waterlogging_risk": 40, "historical_risk": 36},
    {"id": "perungudi", "name": "Perungudi", "lat": 12.9634, "lng": 80.2422, "rainfall_mm": 42, "elevation_risk": 44, "waterlogging_risk": 46, "historical_risk": 44},
    {"id": "ambattur", "name": "Ambattur", "lat": 13.1143, "lng": 80.1548, "rainfall_mm": 25, "elevation_risk": 30, "waterlogging_risk": 28, "historical_risk": 25},
    {"id": "anna_nagar", "name": "Anna Nagar", "lat": 13.0850, "lng": 80.2101, "rainfall_mm": 22, "elevation_risk": 25, "waterlogging_risk": 24, "historical_risk": 20},
    {"id": "t_nagar", "name": "T. Nagar", "lat": 13.0418, "lng": 80.2341, "rainfall_mm": 28, "elevation_risk": 32, "waterlogging_risk": 30, "historical_risk": 29},
    {"id": "royapettah", "name": "Royapettah", "lat": 13.0537, "lng": 80.2646, "rainfall_mm": 20, "elevation_risk": 22, "waterlogging_risk": 20, "historical_risk": 18},
]

HOSPITALS = [
    {"name": "Government General Hospital", "area": "Royapettah", "lat": 13.0827, "lng": 80.2707, "addr": "Park Town, Chennai", "contact": "044-2530 5000"},
    {"name": "Chennai Government Multi-Super Speciality Hospital", "area": "Anna Nagar", "lat": 13.0790, "lng": 80.2135, "addr": "Anna Nagar, Chennai", "contact": "044-2670 1000"},
    {"name": "Government Hospital, Tambaram", "area": "Tambaram", "lat": 12.9270, "lng": 80.1150, "addr": "Tambaram, Chennai", "contact": "044-2226 1000"},
    {"name": "K.K. Nagar Government Hospital", "area": "Kodambakkam", "lat": 13.0392, "lng": 80.2075, "addr": "K.K. Nagar, Chennai", "contact": "044-2472 1000"},
    {"name": "Voluntary Health Services Hospital", "area": "Adyar", "lat": 12.9950, "lng": 80.2450, "addr": "Taramani, Chennai", "contact": "044-2254 1500"},
]

AMBULANCE = [
    {"name": "108 Ambulance Point — Velachery", "area": "Velachery", "lat": 12.98, "lng": 80.218, "addr": "Velachery Main Rd", "contact": "108"},
    {"name": "108 Ambulance Point — Guindy", "area": "Guindy", "lat": 13.009, "lng": 80.218, "addr": "Guindy Industrial Estate", "contact": "108"},
]

FIRE = [
    {"name": "Tambaram Fire Station", "area": "Tambaram", "lat": 12.93, "lng": 80.11, "addr": "GST Road, Tambaram", "contact": "101"},
    {"name": "Adyar Fire Station", "area": "Adyar", "lat": 13.006, "lng": 80.257, "addr": "LB Road, Adyar", "contact": "101"},
]

RELIEF = [
    {"name": "Velachery Community Relief Centre", "area": "Velachery", "lat": 12.979, "lng": 80.223, "addr": "Velachery, Chennai", "contact": "—"},
    {"name": "Madipakkam School Relief Centre", "area": "Madipakkam", "lat": 12.963, "lng": 80.202, "addr": "Madipakkam, Chennai", "contact": "—"},
]

AREA_INDEX = {a["id"]: a for a in AREAS}

# ---------------------------------------------------------------------------
# RISK ENGINE — transparent weighted scoring model (MVP).
# Swap this function for a trained model later; keep the same signature.
# ---------------------------------------------------------------------------


def compute_risk(area: dict) -> float:
    score = (
        area["rainfall_mm"] * 0.40
        + area["elevation_risk"] * 0.20
        + area["waterlogging_risk"] * 0.20
        + area["historical_risk"] * 0.20
    )
    return round(max(0.0, min(100.0, score)), 1)


def classify(score: float) -> str:
    if score >= 71:
        return "SEVERE"
    if score >= 51:
        return "HIGH"
    if score >= 31:
        return "MODERATE"
    return "LOW"


def road_risk(area: dict) -> int:
    return round((area["waterlogging_risk"] + area["historical_risk"]) / 2)


def recommended_action(level: str) -> str:
    return {
        "SEVERE": "Avoid unnecessary travel. Use the AI Safe Route before heading out.",
        "HIGH": "Travel with caution. Check the recommended safe route before departing.",
        "MODERATE": "Conditions are manageable but can change quickly.",
        "LOW": "Normal travel conditions. No significant flood risk detected.",
    }[level]


for a in AREAS:
    a["score"] = compute_risk(a)
    a["level"] = classify(a["score"])
    a["road_risk"] = road_risk(a)


def mark_area_as_reported_flood(area_id: str) -> dict:
    """Elevate an area when a citizen reports flooding there."""
    area = AREA_INDEX[area_id]
    area["reported_flood"] = True
    area["level"] = "SEVERE" if area["score"] >= 71 else "HIGH"
    area["score"] = max(area["score"], 71.0 if area["level"] == "SEVERE" else 51.0)
    area["road_risk"] = max(area["road_risk"], 70)
    return area


def restore_reported_flood_zones() -> None:
    """Restore flood-zone markers from persisted road-flood reports."""
    session = next(db_session())
    try:
        reports = session.query(EmergencyRequest.area_id).filter(
            EmergencyRequest.request_type == "road_flood"
        ).distinct().all()
        for (area_id,) in reports:
            if area_id in AREA_INDEX:
                mark_area_as_reported_flood(area_id)
    finally:
        session.close()


restore_reported_flood_zones()


def haversine_km(lat1, lon1, lat2, lon2) -> float:
    r = 6371
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    hav = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(hav), math.sqrt(1 - hav))


def build_routes(from_lat, from_lng, to_lat, to_lng, from_risk, to_risk) -> dict:
    """
    Demo distance/risk model used when a real routing provider (e.g. OSRM)
    is not configured or unavailable. This function must never raise —
    always returns a usable result.
    """
    straight = haversine_km(from_lat, from_lng, to_lat, to_lng)
    shortest_distance = max(1.2, straight * 1.15)
    shortest_risk = min(100, round((from_risk + to_risk) / 2 + max(from_risk, to_risk) * 0.15))
    congestion = 2.1 if shortest_risk > 60 else 1.5 if shortest_risk > 40 else 1.15
    shortest_time = round((shortest_distance / 28) * 60 * congestion)

    ai_distance = round(shortest_distance * (1.25 + shortest_risk / 300), 1)
    ai_risk = max(10, round(shortest_risk * 0.45))
    ai_time = round((ai_distance / 30) * 60 * 1.1)

    return {
        "shortest": {
            "distance_km": round(shortest_distance, 1),
            "time_min": shortest_time,
            "risk_score": shortest_risk,
            "risk_level": classify(shortest_risk),
        },
        "ai_safe": {
            "distance_km": ai_distance,
            "time_min": ai_time,
            "risk_score": ai_risk,
            "risk_level": classify(ai_risk),
            "explanation": (
                "Recommended route selected by balancing flood risk, road "
                "accessibility and reasonable travel distance."
            ),
        },
        "mode": "demo",
        "disclaimer": "Route geometry and risk estimates are illustrative. Verify live roads, closures and official emergency guidance.",
    }


# ---------------------------------------------------------------------------
# WEATHER SERVICE — uses OpenWeather if OPENWEATHER_API_KEY is set,
# otherwise falls back to deterministic demo data. Never raises.
# ---------------------------------------------------------------------------


def get_weather(area_id: str) -> dict:
    area = AREA_INDEX.get(area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Unknown area id")

    api_key = os.getenv("OPENWEATHER_API_KEY")
    if api_key:
        # Real integration point. Left as a placeholder — wire up a call to
        # https://api.openweathermap.org/data/2.5/weather here and map the
        # response into the same shape returned below. If the call fails
        # for any reason, fall through to the demo data path.
        pass

    condition = (
        "Heavy Rain" if area["level"] == "SEVERE"
        else "Rain" if area["level"] == "HIGH"
        else "Showers" if area["level"] == "MODERATE"
        else "Cloudy"
    )
    return {
        "area": area["name"],
        "rainfall_mm": area["rainfall_mm"],
        "temperature_c": round(27 - area["rainfall_mm"] / 15, 1),
        "humidity_pct": min(98, 60 + area["rainfall_mm"] // 2),
        "condition": condition,
        "source": "demo",
        "source_note": "Live OpenWeather integration is not enabled; demo data returned." if api_key else "Demo data returned because no OpenWeather key is configured.",
    }


# ---------------------------------------------------------------------------
# CHAT SERVICE — rule-based fallback (used when no LLM key is configured)
# ---------------------------------------------------------------------------


def chat_reply(message: str, language: str = "en") -> str:
    text = message.lower()
    mentioned = next((a for a in AREAS if a["name"].lower() in text), None)

    llm_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("OPENAI_API_KEY")
    if llm_key:
        # Real integration point: call the LLM provider here, passing the
        # current AREAS risk data as context. Fall back below on any error.
        pass

    if mentioned and any(k in text for k in ["safe", "risk", "flood"]):
        messages = {
            "en": f"{mentioned['name']} currently has a {mentioned['level'].lower()} flood-risk score ({mentioned['score']}/100). {recommended_action(mentioned['level'])}",
            "ta": f"{mentioned['name']} பகுதியில் தற்போது {mentioned['level']} வெள்ள அபாயம் உள்ளது ({mentioned['score']}/100). தேவையற்ற பயணத்தைத் தவிர்த்து, அதிகாரப்பூர்வ எச்சரிக்கைகளைப் பின்பற்றுங்கள்.",
            "te": f"{mentioned['name']} ప్రాంతంలో ప్రస్తుతం {mentioned['level']} వరద ప్రమాదం ఉంది ({mentioned['score']}/100). అవసరం లేని ప్రయాణాన్ని నివారించి అధికారిక హెచ్చరికలను పాటించండి.",
            "hi": f"{mentioned['name']} में अभी {mentioned['level']} बाढ़ जोखिम है ({mentioned['score']}/100)। अनावश्यक यात्रा से बचें और आधिकारिक चेतावनियों का पालन करें।",
        }
        return messages.get(language, messages["en"])
    if "emergency" in text or "help" in text:
        messages = {
            "en": "For immediate danger, call 112, 108 (Ambulance) or 101 (Fire). Open Emergency Mode for a prioritized safe route.",
            "ta": "உடனடி ஆபத்து என்றால் 112, 108 (ஆம்புலன்ஸ்) அல்லது 101 (தீயணைப்பு) அழைக்கவும். பாதுகாப்பான பாதைக்கு Emergency Mode-ஐ திறக்கவும்.",
            "te": "తక్షణ ప్రమాదంలో 112, 108 (అంబులెన్స్) లేదా 101 (అగ్నిమాపక)కు కాల్ చేయండి. సురక్షిత మార్గం కోసం Emergency Mode తెరవండి.",
            "hi": "तत्काल खतरे में 112, 108 (एम्बुलेंस) या 101 (फायर) पर कॉल करें। सुरक्षित मार्ग के लिए Emergency Mode खोलें।",
        }
        return messages.get(language, messages["en"])
    if "hospital" in text:
        messages = {
            "en": f"Nearby hospitals include {HOSPITALS[0]['name']} and {HOSPITALS[1]['name']}.",
            "ta": f"அருகிலுள்ள மருத்துவமனைகள் {HOSPITALS[0]['name']} மற்றும் {HOSPITALS[1]['name']}.",
            "te": f"సమీపంలోని ఆసుపత్రులు {HOSPITALS[0]['name']} మరియు {HOSPITALS[1]['name']}.",
            "hi": f"पास के अस्पतालों में {HOSPITALS[0]['name']} और {HOSPITALS[1]['name']} शामिल हैं।",
        }
        return messages.get(language, messages["en"])
    if "route" in text:
        messages = {
            "en": "Open Safe Route and enter your starting location and destination for a flood-risk-aware comparison.",
            "ta": "Safe Route-ஐ திறந்து, தொடக்க இடத்தையும் இலக்கையும் உள்ளிட்டு வெள்ள அபாயத்தை ஒப்பிடுங்கள்.",
            "te": "Safe Route తెరిచి, ప్రారంభ స్థలం మరియు గమ్యాన్ని నమోదు చేసి వరద ప్రమాదాన్ని పోల్చండి.",
            "hi": "Safe Route खोलकर अपना प्रारंभिक स्थान और गंतव्य डालें और बाढ़ जोखिम की तुलना करें।",
        }
        return messages.get(language, messages["en"])
    if "tip" in text or "safety" in text:
        messages = {
            "en": "Avoid moving water, keep your phone charged, move valuables to higher ground, and follow official alerts.",
            "ta": "ஓடும் நீரைத் தவிர்க்கவும், கைபேசியை சார்ஜில் வைத்திருக்கவும், பொருட்களை உயரமான இடத்திற்கு மாற்றவும், அதிகாரப்பூர்வ எச்சரிக்கைகளைப் பின்பற்றவும்.",
            "te": "ప్రవహించే నీటిని నివారించండి, ఫోన్ ఛార్జ్‌లో ఉంచండి, విలువైన వస్తువులను ఎత్తైన ప్రదేశానికి మార్చండి, అధికారిక హెచ్చరికలను పాటించండి.",
            "hi": "बहते पानी से बचें, फोन चार्ज रखें, कीमती सामान ऊंची जगह ले जाएं और आधिकारिक चेतावनियों का पालन करें।",
        }
        return messages.get(language, messages["en"])
    if mentioned:
        return f"{mentioned['name']}: risk score {mentioned['score']}/100 ({mentioned['level']})."
    messages = {
        "en": "I can help with flood risk by area, safe routes, hospitals, emergency help, or safety tips.",
        "ta": "பகுதி வெள்ள அபாயம், பாதுகாப்பான பாதைகள், மருத்துவமனைகள், அவசர உதவி அல்லது பாதுகாப்பு குறிப்புகள் குறித்து நான் உதவலாம்.",
        "te": "ప్రాంత వరద ప్రమాదం, సురక్షిత మార్గాలు, ఆసుపత్రులు, అత్యవసర సహాయం లేదా భద్రతా సూచనలపై నేను సహాయం చేయగలను.",
        "hi": "मैं क्षेत्रीय बाढ़ जोखिम, सुरक्षित मार्ग, अस्पताल, आपात सहायता या सुरक्षा सुझावों में मदद कर सकता हूं।",
    }
    return messages.get(language, messages["en"])


# ---------------------------------------------------------------------------
# USSD SERVICE — simulation for hackathon demo. See docstring for the
# adapter architecture to plug in a real USSD gateway later.
# ---------------------------------------------------------------------------

USSD_SESSIONS: dict = {}
MAX_USSD_SESSIONS = 10000

USSD_LANGUAGES = {"1": "en", "2": "ta", "3": "te", "4": "hi"}
USSD_LANGUAGE_LABELS = {"en": "English", "ta": "Tamil", "te": "Telugu", "hi": "Hindi"}
USSD_MENU = "FloodSafe *123#\n\n1. Flood Risk\n2. Safe Route\n3. Emergency Help\n4. Nearby Hospital\n5. Safety Tips"
USSD_LANGUAGE_MENU = "Select language / மொழியைத் தேர்வு செய்க\n\n1. English\n2. Tamil\n3. Telugu\n4. Hindi"


def ussd_handle(session_id: str, text: str) -> str:
    """
    text follows the USSD convention of '*' separated inputs, e.g. "1" or
    "1*2". For this demo we only look at the last entered value.
    In production, wire this behind a provider adapter:
        USSD Provider -> FastAPI -> FloodSafe Risk Engine -> Response
    Keep provider credentials in environment variables — never hard-code them.
    """
    session_id = session_id.strip()[:128]
    text = text.strip()[:256]
    if not session_id:
        raise HTTPException(status_code=422, detail="session_id is required")
    if len(USSD_SESSIONS) >= MAX_USSD_SESSIONS and session_id not in USSD_SESSIONS:
        oldest_session = next(iter(USSD_SESSIONS))
        del USSD_SESSIONS[oldest_session]
    last = text.split("*")[-1] if text else ""
    ref_area = AREA_INDEX["velachery"]

    if text.strip() in ("", "123#", "*123#"):
        USSD_SESSIONS[session_id] = {"state": "language"}
        return USSD_LANGUAGE_MENU

    session = USSD_SESSIONS.get(session_id, {"state": "language"})
    state = session.get("state", "language") if isinstance(session, dict) else session
    if state == "language":
        language = USSD_LANGUAGES.get(last)
        if not language:
            return USSD_LANGUAGE_MENU
        USSD_SESSIONS[session_id] = {"state": "menu", "language": language}
        return USSD_MENU if language == "en" else f"FloodSafe *123# ({USSD_LANGUAGE_LABELS[language]})\n\n1. Flood Risk\n2. Safe Route\n3. Emergency Help\n4. Nearby Hospital\n5. Safety Tips"
    if state == "menu":
        if last == "1":
            USSD_SESSIONS[session_id] = "result"
            return f"Flood Risk — {ref_area['name']}\n{ref_area['level']} risk ({ref_area['score']}/100).\n{recommended_action(ref_area['level'])}\n\n0. Back"
        if last == "2":
            USSD_SESSIONS[session_id] = "result"
            return "Open the app's Safe Route section, or call 112 for urgent routing help.\n\n0. Back"
        if last == "3":
            USSD_SESSIONS[session_id] = "result"
            return "112 - Emergency\n108 - Ambulance\n101 - Fire & Rescue\n\n0. Back"
        if last == "4":
            USSD_SESSIONS[session_id] = "result"
            h = HOSPITALS[0]
            return f"{h['name']}\n{h['addr']}\n{h['contact']}\n\n0. Back"
        if last == "5":
            USSD_SESSIONS[session_id] = "result"
            return "Avoid moving water. Keep phone charged. Move valuables up. Follow alerts.\n\n0. Back"
        return "Invalid option. Dial *123# to restart."
    else:
        USSD_SESSIONS[session_id] = "menu"
        return USSD_MENU


# ---------------------------------------------------------------------------
# API MODELS
# ---------------------------------------------------------------------------


class RouteRequest(BaseModel):
    from_area_id: str = Field(min_length=1, max_length=64)
    to_area_id: str = Field(min_length=1, max_length=64)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    language: str = Field(default="en", pattern="^(en|ta|te|hi)$")


class TriageRequest(BaseModel):
    description: str = Field(min_length=3, max_length=2000)
    area_id: str = Field(min_length=1, max_length=64)


class UssdRequest(BaseModel):
    session_id: str = Field(min_length=1, max_length=128)
    text: str = Field(default="", max_length=256)


class AuthRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.USER


class AdminBootstrapRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    bootstrap_key: str = Field(min_length=16, max_length=256)


class EmergencyRequestModel(BaseModel):
    request_type: str = Field(min_length=2, max_length=32)
    description: str = Field(min_length=2, max_length=2000)
    area_id: str = Field(min_length=1, max_length=64)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    priority: str = Field(default="high", pattern="^(low|medium|high|critical)$")


class FloodReportRequest(BaseModel):
    report_type: str = Field(min_length=2, max_length=32)
    description: str = Field(default="", max_length=2000)
    area_id: str = Field(min_length=1, max_length=64)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    priority: str = Field(default="high", pattern="^(low|medium|high|critical)$")
    image_name: Optional[str] = Field(default=None, max_length=255)
    image_type: Optional[str] = Field(default=None, max_length=100)
    image_size: Optional[int] = Field(default=None, ge=0, le=8_000_000)
    image_data: Optional[str] = Field(default=None, max_length=8_000_000)


class StatusUpdate(BaseModel):
    status: EmergencyStatus


class ResponderDecision(BaseModel):
    decision: str = Field(pattern="^(agree|disagree)$")


class ClosureModel(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    area_id: str = Field(min_length=1, max_length=64)
    reason: str = Field(min_length=2, max_length=255)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


# ---------------------------------------------------------------------------
# ENDPOINTS
# ---------------------------------------------------------------------------


@app.get("/api/health")
def health():
    database_ok = True
    try:
        with engine.connect() as connection:
            connection.exec_driver_sql("SELECT 1")
    except Exception:
        database_ok = False
    return {"status": "ok" if database_ok else "degraded", "database": database_ok, "ai": provider_status(), "version": app.version, "time": datetime.now(timezone.utc).isoformat()}


@app.post("/api/auth/register")
def register(req: AuthRequest, session: Session = Depends(db_session)):
    if session.query(User).filter(User.email == req.email.lower()).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(email=req.email.lower(), password_hash=hash_password(req.password), role=UserRole.USER.value)
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"access_token": create_access_token(user), "token_type": "bearer", "user": {"id": user.id, "email": user.email, "role": user.role}}


@app.post("/api/auth/login")
def login(req: AuthRequest, session: Session = Depends(db_session)):
    user = session.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"access_token": create_access_token(user), "token_type": "bearer", "user": {"id": user.id, "email": user.email, "role": user.role}}


@app.post("/api/auth/bootstrap-admin")
def bootstrap_admin(req: AdminBootstrapRequest, session: Session = Depends(db_session)):
    expected = os.getenv("BOOTSTRAP_ADMIN_KEY")
    if not expected or req.bootstrap_key != expected:
        raise HTTPException(status_code=403, detail="Admin bootstrap is disabled or unauthorized")
    if session.query(User).filter(User.email == req.email.lower()).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    if session.query(User).filter(User.role == UserRole.ADMIN.value).first():
        raise HTTPException(status_code=409, detail="An admin already exists")
    user = User(email=req.email.lower(), password_hash=hash_password(req.password), role=UserRole.ADMIN.value)
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"access_token": create_access_token(user), "token_type": "bearer", "user": {"id": user.id, "email": user.email, "role": user.role}}


@app.post("/api/admin/users", dependencies=[Depends(require_api_key)])
def create_staff(req: AuthRequest, user: User = Depends(require_roles(UserRole.ADMIN)), session: Session = Depends(db_session)):
    if req.role not in {UserRole.RESPONDER, UserRole.AMBULANCE, UserRole.FIRE_RESCUE}:
        raise HTTPException(status_code=422, detail="Admin can create responder, ambulance, or fire_rescue accounts")
    if session.query(User).filter(User.email == req.email.lower()).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    staff = User(email=req.email.lower(), password_hash=hash_password(req.password), role=req.role.value)
    session.add(staff)
    session.commit()
    session.refresh(staff)
    return {"id": staff.id, "email": staff.email, "role": staff.role}


@app.get("/api/auth/me")
def me(user: User = Depends(current_user)):
    return {"id": user.id, "email": user.email, "role": user.role}


@app.post("/api/emergency-requests", dependencies=[Depends(require_api_key)])
def create_emergency(req: EmergencyRequestModel, user: User = Depends(current_user), session: Session = Depends(db_session)):
    if req.area_id not in AREA_INDEX:
        raise HTTPException(status_code=404, detail="Unknown area id")
    item = EmergencyRequest(**req.model_dump(), created_by=user.id)
    session.add(item)
    session.commit()
    session.refresh(item)
    return {"id": item.id, "status": item.status, "priority": item.priority}


def department_for_report(report_type: str) -> dict:
    mapping = {
        "road_flood": {"department": "Public Works Department", "priority": "high", "issue": "Flooded road or waterlogged street"},
        "medical": {"department": "Emergency Medical Services", "priority": "critical", "issue": "Medical emergency, illness, injury, or medicine needed"},
        "bike_accident": {"department": "Emergency Medical Services", "priority": "critical", "issue": "Flood-related accident or rescue needed"},
        "tree_fall": {"department": "Fire & Rescue", "priority": "high", "issue": "Fallen tree blocking or endangering an area"},
        "wire_cut": {"department": "Electricity Board + Fire Rescue", "priority": "critical", "issue": "Live wire or damaged electrical line in flood water"},
        "evacuation": {"department": "Disaster Response & Relief", "priority": "critical", "issue": "Evacuation or shelter assistance needed"},
    }
    return mapping.get(report_type, {"department": "Emergency Control Room", "priority": "high", "issue": "Flood emergency report"})


def triage_report(description: str) -> dict:
    text = description.lower()
    if any(word in text for word in ("wire", "electric", "cable", "current")):
        report_type = "wire_cut"
    elif any(word in text for word in ("tree", "branch", "fallen")):
        report_type = "tree_fall"
    elif any(word in text for word in ("medicine", "insulin", "fever", "injury", "patient", "medical")):
        report_type = "medical"
    elif any(word in text for word in ("evacuate", "evacuation", "shelter", "trapped")):
        report_type = "evacuation"
    else:
        report_type = "road_flood"
    department = department_for_report(report_type)
    return {
        "report_type": report_type,
        "department": department["department"],
        "priority": department["priority"],
        "issue": department["issue"],
        "confidence": "high" if report_type != "road_flood" else "medium",
        "source": "policy-model",
    }


def responder_roles_for_report(report_type: str) -> set[str]:
    if report_type in {"medical", "bike_accident"}:
        return {UserRole.AMBULANCE.value, UserRole.RESPONDER.value, UserRole.ADMIN.value}
    if report_type in {"tree_fall", "wire_cut", "evacuation"}:
        return {UserRole.FIRE_RESCUE.value, UserRole.RESPONDER.value, UserRole.ADMIN.value}
    return {UserRole.RESPONDER.value, UserRole.ADMIN.value}


@app.post("/api/flood-reports")
def create_flood_report(req: FloodReportRequest, session: Session = Depends(db_session)):
    if req.area_id not in AREA_INDEX:
        raise HTTPException(status_code=404, detail="Unknown area id")

    department = department_for_report(req.report_type)
    description = req.description.strip() or department["issue"]
    is_flood_report = req.report_type == "road_flood" or any(
        word in description.lower() for word in ("flood", "waterlogged", "water on road", "flooded")
    )
    if req.image_name:
        description = f"{description} [Condition image: {req.image_name}]"
    area = AREA_INDEX[req.area_id]

    item = EmergencyRequest(
        request_type=req.report_type,
        description=f"{department['issue']} — {description}",
        area_id=req.area_id,
        latitude=req.latitude if -90 <= req.latitude <= 90 else area["lat"],
        longitude=req.longitude if -180 <= req.longitude <= 180 else area["lng"],
        priority=department["priority"],
        status=EmergencyStatus.REPORTED.value,
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    area_risk = mark_area_as_reported_flood(req.area_id) if is_flood_report else area

    return {
        "id": item.id,
        "report_type": req.report_type,
        "department": department["department"],
        "status": item.status,
        "priority": item.priority,
        "area_id": req.area_id,
        "area_name": area["name"],
        "location": {"latitude": item.latitude, "longitude": item.longitude},
        "image_attached": bool(req.image_data or req.image_name),
        "image_name": req.image_name,
        "area_risk_level": area_risk["level"],
        "area_risk_score": area_risk["score"],
        "area_marked_as_risk_zone": is_flood_report,
        "stored": True,
    }


@app.get("/api/emergency-requests", dependencies=[Depends(require_api_key)])
def list_emergencies(user: User = Depends(require_roles(UserRole.RESPONDER, UserRole.AMBULANCE, UserRole.FIRE_RESCUE, UserRole.ADMIN)), session: Session = Depends(db_session)):
    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    requests = session.query(EmergencyRequest).order_by(EmergencyRequest.created_at.desc()).all()
    visible = [item for item in requests if item.status not in {EmergencyStatus.RESOLVED.value, EmergencyStatus.CANCELLED.value} and user.role in responder_roles_for_report(item.request_type)]
    visible.sort(key=lambda item: (priority_order.get(item.priority, 4), item.created_at))
    return [{"id": item.id, "type": item.request_type, "description": item.description, "area_id": item.area_id, "priority": item.priority, "status": item.status, "department": department_for_report(item.request_type)["department"], "roles": sorted(responder_roles_for_report(item.request_type))} for item in visible]


@app.post("/api/emergency-requests/{request_id}/assign", dependencies=[Depends(require_api_key)])
def assign_emergency(request_id: int, user: User = Depends(require_roles(UserRole.RESPONDER, UserRole.AMBULANCE, UserRole.FIRE_RESCUE, UserRole.ADMIN)), session: Session = Depends(db_session)):
    item = session.get(EmergencyRequest, request_id)
    if not item:
        raise HTTPException(status_code=404, detail="Emergency request not found")
    if item.assignment:
        raise HTTPException(status_code=409, detail="Emergency request already assigned")
    assignment = Assignment(request_id=item.id, responder_id=user.id, status=EmergencyStatus.ASSIGNED.value)
    item.status = EmergencyStatus.ASSIGNED.value
    session.add(assignment)
    session.commit()
    return {"request_id": item.id, "assignment_id": assignment.id, "status": assignment.status}


@app.post("/api/emergency-requests/{request_id}/decision", dependencies=[Depends(require_api_key)])
def decide_emergency(request_id: int, req: ResponderDecision, user: User = Depends(require_roles(UserRole.RESPONDER, UserRole.AMBULANCE, UserRole.FIRE_RESCUE, UserRole.ADMIN)), session: Session = Depends(db_session)):
    item = session.get(EmergencyRequest, request_id)
    if not item:
        raise HTTPException(status_code=404, detail="Emergency request not found")
    if user.role not in responder_roles_for_report(item.request_type):
        raise HTTPException(status_code=403, detail="This report is not routed to your department")
    if req.decision == "agree":
        if not item.assignment:
            session.add(Assignment(request_id=item.id, responder_id=user.id, status=EmergencyStatus.ASSIGNED.value))
        item.status = EmergencyStatus.ASSIGNED.value
        message = "Incident accepted and assigned to your unit"
    else:
        item.status = EmergencyStatus.CANCELLED.value
        message = "Incident declined and removed from the active queue"
    session.commit()
    return {"id": item.id, "decision": req.decision, "status": item.status, "message": message}


@app.patch("/api/emergency-requests/{request_id}/status", dependencies=[Depends(require_api_key)])
def update_emergency_status(request_id: int, req: StatusUpdate, user: User = Depends(current_user), session: Session = Depends(db_session)):
    item = session.get(EmergencyRequest, request_id)
    if not item:
        raise HTTPException(status_code=404, detail="Emergency request not found")
    if item.created_by != user.id and user.role not in {UserRole.ADMIN.value, UserRole.RESPONDER.value, UserRole.AMBULANCE.value, UserRole.FIRE_RESCUE.value}:
        raise HTTPException(status_code=403, detail="Not allowed to update this request")
    item.status = req.status.value
    if item.assignment:
        item.assignment.status = req.status.value
    session.commit()
    return {"id": item.id, "status": item.status}


@app.get("/api/road-closures", dependencies=[Depends(require_api_key)])
def list_closures(session: Session = Depends(db_session)):
    return [{"id": item.id, "name": item.name, "area_id": item.area_id, "reason": item.reason, "status": item.status, "latitude": item.latitude, "longitude": item.longitude} for item in session.query(RoadClosure).filter(RoadClosure.status == "active").all()]


@app.post("/api/road-closures", dependencies=[Depends(require_api_key)])
def create_closure(req: ClosureModel, user: User = Depends(require_roles(UserRole.ADMIN, UserRole.RESPONDER)), session: Session = Depends(db_session)):
    item = RoadClosure(**req.model_dump())
    session.add(item)
    session.commit()
    session.refresh(item)
    return {"id": item.id, "status": item.status}


@app.get("/api/flood-zones", dependencies=[Depends(require_api_key)])
def flood_zones():
    return {"areas": AREAS, "note": "DEMO DATA — illustrative figures for prototype purposes."}


@app.get("/api/flood-risk/{area_id}", dependencies=[Depends(require_api_key)])
def flood_risk(area_id: str):
    area = AREA_INDEX.get(area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Unknown area id")
    return area


@app.get("/api/weather", dependencies=[Depends(require_api_key)])
async def weather(area: str = "velachery"):
    fallback = get_weather(area)
    point = AREA_INDEX[area]
    return await fetch_weather(point["lat"], point["lng"], fallback)


@app.get("/api/forecast", dependencies=[Depends(require_api_key)])
def forecast(area: str = "velachery"):
    a = AREA_INDEX.get(area)
    if not a:
        raise HTTPException(status_code=404, detail="Unknown area id")
    now = datetime.now(timezone.utc)
    points = []
    for offset in range(24):
        # Project the current weighted risk across the next day with a small,
        # deterministic rainfall-cycle adjustment for the demo dataset.
        cycle = math.sin((offset - 5) * math.pi / 12) * 5
        rainfall_trend = min(18, offset * 0.45)
        pct = round(max(5, min(97, a["score"] * 0.72 + cycle + rainfall_trend)))
        points.append({
            "time": (now + timedelta(hours=offset)).strftime("%H:00"),
            "risk_pct": pct,
            "risk_level": classify(pct),
        })
    return {
        "area": a["name"],
        "horizon_hours": 24,
        "method": "weighted-risk-projection",
        "forecast": points,
        "disclaimer": "24-hour flood-risk projection based on current demo signals; not a guaranteed forecast.",
    }


@app.post("/api/safe-route", dependencies=[Depends(require_api_key)])
async def safe_route(req: RouteRequest, session: Session = Depends(db_session)):
    a, b = AREA_INDEX.get(req.from_area_id), AREA_INDEX.get(req.to_area_id)
    if not a or not b:
        raise HTTPException(status_code=404, detail="Unknown area id(s)")
    result = build_routes(a["lat"], a["lng"], b["lat"], b["lng"], a["road_risk"], b["road_risk"])
    active_closures = session.query(RoadClosure).filter(RoadClosure.status == "active").all()
    result["closures_considered"] = [{"name": item.name, "area_id": item.area_id, "reason": item.reason} for item in active_closures]
    result["live_route"] = await fetch_route(a["lat"], a["lng"], b["lat"], b["lng"], result["ai_safe"])
    if result["live_route"].get("source") == "osrm":
        result["ai_safe"].update({key: result["live_route"][key] for key in ("distance_km", "time_min", "geometry") if key in result["live_route"]})
        result["mode"] = "osrm"
    return result


@app.post("/api/emergency-route", dependencies=[Depends(require_api_key)])
async def emergency_route(req: RouteRequest, session: Session = Depends(db_session)):
    result = await safe_route(req, session)
    result["priority_order"] = ["flood_safety", "road_accessibility", "facility_proximity", "distance"]
    result["disclaimer"] = "This is an informational routing aid. Follow official emergency instructions and road closures."
    return result


@app.get("/api/emergency-facilities", dependencies=[Depends(require_api_key)])
def emergency_facilities():
    return {"hospitals": HOSPITALS, "ambulance": AMBULANCE, "fire_stations": FIRE, "relief_centres": RELIEF}


@app.post("/api/chat", dependencies=[Depends(require_api_key)])
async def chat(req: ChatRequest):
    fallback = chat_reply(req.message, req.language)
    context = {
        "language": req.language,
        "areas": [{"name": area["name"], "level": area["level"], "score": area["score"]} for area in AREAS],
        "facilities": {"hospitals": HOSPITALS[:5], "ambulance": AMBULANCE, "fire": FIRE, "relief": RELIEF},
    }
    return await generate_reply(req.message, context, fallback)


@app.post("/api/ai/triage", dependencies=[Depends(require_api_key)])
def ai_triage(req: TriageRequest):
    area = AREA_INDEX.get(req.area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Unknown area id")
    result = triage_report(req.description)
    result["area"] = area["name"]
    result["risk_level"] = area["level"]
    result["risk_score"] = area["score"]
    return result


@app.post("/api/ussd", dependencies=[Depends(require_api_key)])
def ussd(req: UssdRequest):
    return {"response": ussd_handle(req.session_id, req.text)}
