from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.models.log_entry import LogEntry
from app.services.detection_engine import detection_engine
from app.services.ai_service import ai_analysis_service
from app.services.mitre_service import enrich_alert
from app.services.correlation_engine import correlate
from app.services.tiering_engine import assign_tier, write_to_cold_storage, read_cold_storage, get_cold_storage_stats

router = APIRouter()


# --- Pydantic Schemas --------------------------------------------------------

class LogIngestRequest(BaseModel):
    source_ip: str = Field(..., example="192.168.1.100")
    destination_ip: Optional[str] = None
    source_port: Optional[int] = None
    destination_port: Optional[int] = None
    event_type: str = Field(..., example="failed_login")
    severity: str = Field(default="low", pattern="^(low|medium|high|critical)$")
    hostname: Optional[str] = None
    username: Optional[str] = None
    log_source: str = Field(default="unknown", example="windows")
    raw_message: Optional[str] = None
    extra_fields: Optional[dict] = None

class BulkIngestRequest(BaseModel):
    logs: List[LogIngestRequest]


# --- Routes ------------------------------------------------------------------

@router.post("/ingest", summary="Ingest a single log entry")
async def ingest_log(payload: LogIngestRequest, db: AsyncSession = Depends(get_db)):
    """Ingest one log event. Runs detection engine and may generate an alert."""
    log = LogEntry(**payload.model_dump())
    db.add(log)
    await db.flush()  # get the ID before detection

    alert = await detection_engine.analyze_log(log, db)
    await correlate(log, db)

    # If alert triggered, run AI analysis asynchronously (don't block response)
    if alert:
        try:
            analysis = await ai_analysis_service.analyze_alert(alert, [log])
            alert.ai_analysis = analysis.get("threat_summary")
            alert.ai_risk_level = analysis.get("risk_level")
            alert.ai_recommendations = analysis.get("recommendations")
        except Exception:
            pass  # AI failure should never block log ingestion

    await db.commit()

    return {
        "status": "ingested",
        "log_id": log.id,
        "alert_generated": alert is not None,
        "alert_id": alert.id if alert else None,
    }


@router.post("/ingest/bulk", summary="Ingest multiple log entries")
async def ingest_bulk(payload: BulkIngestRequest, db: AsyncSession = Depends(get_db)):
    """Ingest up to 1000 logs in one request. Returns count of alerts generated."""
    if len(payload.logs) > 1000:
        raise HTTPException(status_code=400, detail="Max 1000 logs per bulk request.")

    alert_count = 0
    log_ids = []

    for item in payload.logs:
        log = LogEntry(**item.model_dump())
        db.add(log)
        await db.flush()
        log_ids.append(log.id)

        alert = await detection_engine.analyze_log(log, db)
        if alert:
            alert_count += 1

    await db.commit()
    return {
        "status": "ingested",
        "logs_processed": len(payload.logs),
        "alerts_generated": alert_count,
        "log_ids": log_ids,
    }


@router.get("/", summary="List log entries with filters")
async def list_logs(
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0),
    source_ip: Optional[str] = None,
    event_type: Optional[str] = None,
    severity: Optional[str] = None,
    log_source: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(LogEntry).order_by(desc(LogEntry.timestamp))

    if source_ip:
        query = query.where(LogEntry.source_ip == source_ip)
    if event_type:
        query = query.where(LogEntry.event_type == event_type)
    if severity:
        query = query.where(LogEntry.severity == severity)
    if log_source:
        query = query.where(LogEntry.log_source == log_source)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    logs = result.scalars().all()

    return {"logs": [log.to_dict() for log in logs], "count": len(logs)}


@router.get("/cold", summary="Query cold storage logs by date")
async def get_cold_logs(date: str = Query(default=None, example="2026-06-09")):
    from datetime import datetime, timezone
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    logs = read_cold_storage(date)
    return {"date": date, "logs": logs, "count": len(logs)}


@router.get("/cold/stats", summary="Cold storage statistics")
async def cold_storage_stats():
    return get_cold_storage_stats()


@router.get("/{log_id}", summary="Get a single log entry")
async def get_log(log_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LogEntry).where(LogEntry.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found.")
    return log.to_dict()



