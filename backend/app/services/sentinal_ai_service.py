from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert
from app.models.log_entry import LogEntry
from app.services.ai_service import ai_analysis_service


async def investigate_alert(alert_id: int, db: AsyncSession):

    result = await db.execute(
        select(Alert).where(Alert.id == alert_id)
    )

    alert = result.scalar_one_or_none()

    if not alert:
        return {"error": "Alert not found"}

    related_logs = []

    if alert.related_log_ids:
        logs_result = await db.execute(
            select(LogEntry).where(
                LogEntry.id.in_(alert.related_log_ids)
            )
        )

        related_logs = [
            log.to_dict()
            for log in logs_result.scalars().all()
        ]

    context = f"""
Alert ID: {alert.id}
Alert Type: {alert.alert_type}
Severity: {alert.severity}
Title: {alert.title}
Description: {alert.description}
Source IP: {alert.source_ip}
MITRE Technique: {alert.mitre_technique_id}

Related Logs:
{related_logs}
"""

    response = await ai_analysis_service.analyze_freeform(context)

    return {
        "alert": alert.to_dict(),
        "logs": related_logs,
        "analysis": response,
    }