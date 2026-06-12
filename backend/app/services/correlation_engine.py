"""
Correlation Engine
Detects multi-step attack patterns across multiple log events.
"""
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.log_entry import LogEntry
from app.models.alert import Alert
import logging

logger = logging.getLogger(__name__)

CORRELATION_WINDOW = 300  # 5 minutes


async def correlate(log: LogEntry, db: AsyncSession):
    """Run all correlation rules against incoming log."""
    results = []
    r = await _brute_then_success(log, db)
    if r: results.append(r)
    r = await _scan_then_exploit(log, db)
    if r: results.append(r)
    return results


async def _brute_then_success(log: LogEntry, db: AsyncSession):
    """Brute force followed by successful login = confirmed compromise."""
    if log.event_type not in ("successful_login","login_success","user_logon"):
        return None
    window = datetime.now(timezone.utc) - timedelta(seconds=CORRELATION_WINDOW)
    result = await db.execute(
        select(func.count(LogEntry.id)).where(
            LogEntry.source_ip == log.source_ip,
            LogEntry.event_type.in_(["failed_login","authentication_failure"]),
            LogEntry.timestamp >= window,
        )
    )
    count = result.scalar_one()
    if count >= 3:
        alert = Alert(
            alert_type="brute_force_success",
            severity="critical",
            title=f"Confirmed Compromise: Brute Force + Login from {log.source_ip}",
            description=f"{count} failed logins followed by successful login from {log.source_ip}. Account {log.username or 'unknown'} likely compromised.",
            source_ip=log.source_ip,
            affected_system=log.hostname,
            username=log.username,
            mitre_technique_id="T1110",
            mitre_technique_name="Brute Force",
            mitre_tactic="Credential Access",
            related_log_ids=[log.id],
            status="open",
        )
        db.add(alert)
        await db.flush()
        logger.warning(f"[CORRELATION] Brute+Success from {log.source_ip}")
        return alert
    return None


async def _scan_then_exploit(log: LogEntry, db: AsyncSession):
    """Port scan followed by connection attempt = active exploitation."""
    if log.event_type not in ("connection_attempt","successful_connection"):
        return None
    window = datetime.now(timezone.utc) - timedelta(seconds=CORRELATION_WINDOW)
    result = await db.execute(
        select(func.count(LogEntry.destination_port.distinct())).where(
            LogEntry.source_ip == log.source_ip,
            LogEntry.event_type.in_(["port_probe","firewall_drop"]),
            LogEntry.timestamp >= window,
        )
    )
    ports = result.scalar_one()
    if ports >= 5:
        alert = Alert(
            alert_type="scan_then_exploit",
            severity="high",
            title=f"Scan-to-Exploit Pattern from {log.source_ip}",
            description=f"Port scan ({ports} ports) followed by connection attempt from {log.source_ip}. Active exploitation likely.",
            source_ip=log.source_ip,
            affected_system=log.hostname,
            mitre_technique_id="T1046",
            mitre_technique_name="Network Service Discovery",
            mitre_tactic="Discovery",
            related_log_ids=[log.id],
            status="open",
        )
        db.add(alert)
        await db.flush()
        logger.warning(f"[CORRELATION] Scan+Exploit from {log.source_ip}")
        return alert
    return None



