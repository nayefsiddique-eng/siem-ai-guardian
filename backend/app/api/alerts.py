from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.models.alert import Alert
from app.models.log_entry import LogEntry
from app.services.ai_service import ai_analysis_service

router = APIRouter()


class AlertUpdateRequest(BaseModel):
    status: Optional[str] = None
    acknowledged: Optional[bool] = None


@router.get("/", summary="List alerts with filters")
async def list_alerts(
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0),
    severity: Optional[str] = None,
    status: Optional[str] = None,
    alert_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Alert).order_by(desc(Alert.created_at))

    if severity:
        query = query.where(Alert.severity == severity)
    if status:
        query = query.where(Alert.status == status)
    if alert_type:
        query = query.where(Alert.alert_type == alert_type)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    alerts = result.scalars().all()

    return {"alerts": [a.to_dict() for a in alerts], "count": len(alerts)}


@router.get("/{alert_id}", summary="Get alert details")
async def get_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    return alert.to_dict()


@router.patch("/{alert_id}", summary="Update alert status")
async def update_alert(
    alert_id: int,
    payload: AlertUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")

    valid_statuses = {"open", "investigating", "resolved", "false_positive"}
    if payload.status and payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose: {valid_statuses}")

    if payload.status:
        alert.status = payload.status
    if payload.acknowledged is not None:
        alert.acknowledged = payload.acknowledged

    await db.commit()
    return {"status": "updated", "alert": alert.to_dict()}


@router.post("/{alert_id}/analyze", summary="Trigger AI analysis for an alert")
async def analyze_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    """Manually trigger AI analysis for an existing alert."""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")

    # Fetch related logs
    related_logs = []
    if alert.related_log_ids:
        logs_result = await db.execute(
            select(LogEntry).where(LogEntry.id.in_(alert.related_log_ids))
        )
        related_logs = logs_result.scalars().all()

    analysis = await ai_analysis_service.analyze_alert(alert, related_logs)

    alert.ai_analysis = analysis.get("threat_summary")
    alert.ai_risk_level = analysis.get("risk_level")
    alert.ai_recommendations = analysis.get("recommendations")
    await db.commit()

    return {
    "status": "analyzed",
    "threat_summary": analysis.get("threat_summary"),
    "risk_level": analysis.get("risk_level"),
    "confidence": analysis.get("confidence"),
    "attack_stage": analysis.get("attack_stage"),
    "recommendations": analysis.get("recommendations"),
    "false_positive_likelihood": analysis.get("false_positive_likelihood"),
}
