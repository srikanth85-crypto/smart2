"""Provider-backed AI services with a deterministic emergency fallback.

The application never sends an incident to a model without a local fallback.
Model credentials stay in environment variables and are never returned.
"""
from __future__ import annotations

import json
import os
from typing import Any

import httpx


AI_SYSTEM_PROMPT = (
    "You are FloodSafe's emergency intelligence assistant. Give concise, "
    "Respond in the language named in the supplied context, preserving place "
    "names and emergency phone numbers. "
    "actionable guidance. Never claim to dispatch responders, diagnose a "
    "patient, or know live conditions unless the supplied context proves it. "
    "For immediate danger, direct the user to local emergency services."
)


def provider_status() -> dict[str, Any]:
    provider = os.getenv("AI_PROVIDER", "openai-compatible")
    configured = bool(os.getenv("OPENAI_API_KEY"))
    return {
        "provider": provider,
        "model": os.getenv("AI_MODEL", "gpt-4o-mini"),
        "configured": configured,
        "mode": "provider" if configured else "local-fallback",
    }


async def generate_reply(message: str, context: dict[str, Any], fallback: str) -> dict[str, Any]:
    status = provider_status()
    if not status["configured"]:
        return {"reply": fallback, "ai": {**status, "used": False}}

    endpoint = os.getenv("AI_BASE_URL", "https://api.openai.com/v1").rstrip("/") + "/chat/completions"
    payload = {
        "model": status["model"],
        "temperature": 0.2,
        "max_tokens": 300,
        "messages": [
            {"role": "system", "content": AI_SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps({"question": message, "context": context}, ensure_ascii=True)},
        ],
    }
    headers = {"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}", "Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.post(endpoint, headers=headers, json=payload)
            response.raise_for_status()
            body = response.json()
        content = body["choices"][0]["message"]["content"].strip()
        if not content:
            raise ValueError("AI provider returned an empty response")
        return {"reply": content, "ai": {**status, "used": True}}
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError):
        return {"reply": fallback, "ai": {**status, "used": False, "fallback_reason": "provider_unavailable"}}
