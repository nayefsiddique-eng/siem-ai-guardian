from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.models.alert import Alert
from app.models.log_entry import LogEntry
from app.services.gemini_service import gemini_service

router = APIRouter()


class FreeformAnalysisRequest(BaseModel):
    context: str  # free text describing the incident


@router.post("/freeform", summary="Ask Gemini about a security incident in plain English")
async def freeform_analysis(payload: FreeformAnalysisRequest):
    """
    Send any security context to Gemini for analysis.
    Useful for analysts who want to describe an incident manually.
    """
    if not gemini_service.api_key:
        raise HTTPException(status_code=503, detail="Gemini API key not configured.")

    import httpx, json

    prompt = f"""You are a senior SOC analyst. A security analyst describes the following incident:

{payload.context}

Provide a structured analysis in JSON format only (no markdown):
{{
  "threat_summary": "...",
  "risk_level": "low|medium|high|critical",
  "likely_attack_type": "...",
  "mitre_techniques": ["T1110 - Brute Force", "..."],
  "recommendations": ["action 1", "action 2", "action 3"],
  "investigation_steps": ["step 1", "step 2"]
}}"""

    payload_data = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 1024},
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_service.model}:generateContent",
                params={"key": gemini_service.api_key},
                json=payload_data,
            )
            response.raise_for_status()
            data = response.json()

        text = data["candidates"][0]["content"]["parts"][0]["text"]
        text = text.strip().strip("```json").strip("```").strip()
        return json.loads(text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini analysis failed: {str(e)}")
