from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
import re

from app.core.database import get_db
from app.services.ai_service import ai_analysis_service
from app.services.sentinal_ai_service import investigate_alert
from app.services.abuseipdb_service import lookup_ip
from app.services.mitre_service import MITRE_MAP

router = APIRouter()


class FreeformAnalysisRequest(BaseModel):
    context: str


@router.post("/freeform")
async def freeform_analysis(
    payload: FreeformAnalysisRequest,
    db: AsyncSession = Depends(get_db)
):
    context = payload.context.strip()

    if not context:
        raise HTTPException(
            status_code=400,
            detail="Provide context."
        )

    try:

        # INVESTIGATE ALERT X
        match = re.search(
            r"investigate alert\s+(\d+)",
            context.lower()
        )

        if match:
            alert_id = int(match.group(1))
            return await investigate_alert(alert_id, db)

        # MITRE TECHNIQUE
        mitre_match = re.search(
            r"(T\d{4})",
            context.upper()
        )

        if mitre_match:
            technique = mitre_match.group(1)

            for _, data in MITRE_MAP.items():
                if data["id"] == technique:
                    return data

        # IP LOOKUP
        ip_match = re.search(
            r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
            context
        )

        if ip_match:
            ip = ip_match.group()
            return await lookup_ip(ip)

        # DEFAULT GEMINI
        return await ai_analysis_service.analyze_freeform(context)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/investigate-alert/{alert_id}")
async def investigate_existing_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await investigate_alert(alert_id, db)

    if "error" in result:
        raise HTTPException(
            status_code=404,
            detail=result["error"]
        )

    return result



