from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.alert import Alert
from app.models.user import User
from app.services.compliance_engine import map_alert_to_compliance, generate_compliance_report

router = APIRouter()


@router.get("/{alert_id}", summary="Get compliance mapping for a specific alert")
async def get_alert_compliance(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Alert not found.")
    return map_alert_to_compliance(alert.alert_type)


@router.get("/", summary="Full compliance report across all alerts")
async def get_compliance_report(
    limit: int = Query(default=100, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Alert).limit(limit))
    alerts = result.scalars().all()
    alert_dicts = [a.to_dict() for a in alerts]
    return generate_compliance_report(alert_dicts)


@router.get("/frameworks/summary", summary="Which frameworks are triggered by which alert types")
async def frameworks_summary(current_user: User = Depends(get_current_user)):
    from app.services.compliance_engine import COMPLIANCE_MAP
    summary = {}
    for alert_type, frameworks in COMPLIANCE_MAP.items():
        summary[alert_type] = {
            "frameworks": list(frameworks.keys()),
            "total_controls": sum(len(c) for c in frameworks.values())
        }
    return summary
