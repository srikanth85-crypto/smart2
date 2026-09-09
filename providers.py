"""External provider adapters with normalized responses and honest fallbacks."""
import os
from typing import Any

import httpx


async def fetch_weather(lat: float, lng: float, fallback: dict[str, Any]) -> dict[str, Any]:
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return {**fallback, "source": "demo", "stale": True}
    url = "https://api.openweathermap.org/data/2.5/weather"
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(url, params={"lat": lat, "lon": lng, "appid": api_key, "units": "metric"})
            response.raise_for_status()
            payload = response.json()
        return {
            "temperature_c": payload["main"]["temp"],
            "humidity_pct": payload["main"]["humidity"],
            "condition": payload["weather"][0]["main"],
            "rainfall_mm": payload.get("rain", {}).get("1h", 0),
            "source": "openweather",
            "stale": False,
        }
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError):
        return {**fallback, "source": "demo_fallback", "stale": True}


async def fetch_route(from_lat: float, from_lng: float, to_lat: float, to_lng: float, fallback: dict[str, Any]) -> dict[str, Any]:
    base_url = os.getenv("OSRM_BASE_URL")
    if not base_url:
        return {**fallback, "source": "demo", "stale": True}
    url = f"{base_url.rstrip('/')}/route/v1/driving/{from_lng},{from_lat};{to_lng},{to_lat}"
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.get(url, params={"overview": "full", "geometries": "geojson", "steps": "true"})
            response.raise_for_status()
            route = response.json()["routes"][0]
        return {
            "distance_km": round(route["distance"] / 1000, 1),
            "time_min": round(route["duration"] / 60),
            "geometry": route["geometry"],
            "source": "osrm",
            "stale": False,
        }
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError):
        return {**fallback, "source": "demo_fallback", "stale": True}
