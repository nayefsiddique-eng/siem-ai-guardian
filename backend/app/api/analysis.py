from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import ai_analysis_service

router = APIRouter()


class FreeformAnalysisRequest(BaseModel):
    context: str


@router.post(
    "/freeform",
    summary="Ask AI about a security incident in plain English"
)
async def freeform_analysis(payload: FreeformAnalysisRequest):

    context = payload.context

    if not context:
        raise HTTPException(
            status_code=400,
            detail="Provide context."
        )

    if not ai_analysis_service.api_key:
        raise HTTPException(
            status_code=503,
            detail="AI API key not configured."
        )

    try:
        result = await ai_analysis_service.analyze_freeform(context)
        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {str(e)}"
        )
