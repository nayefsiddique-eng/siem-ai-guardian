from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import datetime, timedelta, timezone

from app.core.database import get_db
from app.models.log_entry import LogEntry
from app.models.alert import Alert

router = APIRouter()


@router.get("/stats", summary="Dashboard summary statistics")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)

    # Total logs (all time and last 24h)
    total_logs = (await db.execute(select(func.count(LogEntry.id)))).scalar_one()
    logs_24h = (await db.execute(
        select(func.count(LogEntry.id)).where(LogEntry.timestamp >= last_24h)
    )).scalar_one()

    # Total alerts by severity
    alert_rows = (await db.execute(
        select(Alert.severity, func.count(Alert.id))
        .group_by(Alert.severity)
    )).all()
    alerts_by_severity = {row[0]: row[1] for row in alert_rows}

    # Open alerts
    open_alerts = (await db.execute(
        select(func.count(Alert.id)).where(Alert.status == "open")
    )).scalar_one()

    # Critical + high alerts in last 24h
    critical_alerts_24h = (await db.execute(
        select(func.count(Alert.id)).where(
            Alert.severity.in_(["critical", "high"]),
            Alert.created_at >= last_24h,
        )
    )).scalar_one()

    # Top attacker IPs
    top_ips = (await db.execute(
        select(LogEntry.source_ip, func.count(LogEntry.id).label("count"))
        .where(LogEntry.timestamp >= last_24h)
        .group_by(LogEntry.source_ip)
        .order_by(desc("count"))
        .limit(10)
    )).all()

    # Alerts over last 7 days (daily counts)
    alerts_timeline = (await db.execute(
        select(
            func.date(Alert.created_at).label("date"),
            func.count(Alert.id).label("count"),
        )
        .where(Alert.created_at >= last_7d)
        .group_by(func.date(Alert.created_at))
        .order_by("date")
    )).all()

    # Alert types breakdown
    alert_types = (await db.execute(
        select(Alert.alert_type, func.count(Alert.id))
        .group_by(Alert.alert_type)
    )).all()

    # Recent alerts (last 5)
    recent_alerts_result = await db.execute(
        select(Alert).order_by(desc(Alert.created_at)).limit(5)
    )
    recent_alerts = [a.to_dict() for a in recent_alerts_result.scalars().all()]

    return {
        "overview": {
            "total_logs": total_logs,
            "logs_last_24h": logs_24h,
            "open_alerts": open_alerts,
            "critical_alerts_24h": critical_alerts_24h,
            "total_alerts": sum(alerts_by_severity.values()),
        },
        "alerts_by_severity": alerts_by_severity,
        "alerts_by_type": {row[0]: row[1] for row in alert_types},
        "top_attacker_ips": [
            {"ip": row[0], "count": row[1]} for row in top_ips
        ],
        "alerts_timeline": [
            {"date": str(row[0]), "count": row[1]} for row in alerts_timeline
        ],
        "recent_alerts": recent_alerts,
    }
