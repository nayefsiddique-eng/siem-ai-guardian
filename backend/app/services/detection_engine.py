"""
Detection Engine â€” Rule-based threat detection.
Each rule checks a pattern in the incoming log and may trigger an Alert.
"""
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.log_entry import LogEntry
from app.models.alert import Alert
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# MITRE ATT&CK mapping for detected techniques
MITRE_MAP = {
    "brute_force": {
        "technique_id": "T1110",
        "technique_name": "Brute Force",
        "tactic": "Credential Access",
    },
    "port_scan": {
        "technique_id": "T1046",
        "technique_name": "Network Service Discovery",
        "tactic": "Discovery",
    },
    "threat_intel_match": {
        "technique_id": "T1071",
        "technique_name": "Application Layer Protocol",
        "tactic": "Command and Control",
    },
    "after_hours_login": {
        "technique_id": "T1078",
        "technique_name": "Valid Accounts",
        "tactic": "Defense Evasion",
    },
    "privilege_escalation": {
        "technique_id": "T1068",
        "technique_name": "Exploitation for Privilege Escalation",
        "tactic": "Privilege Escalation",
    },
}

# Known malicious IPs (in production: pull from threat intel feeds)
THREAT_INTEL_BLACKLIST = set([
    "10.0.0.666",  # placeholder â€” real feeds loaded via config
])


class DetectionEngine:

    async def analyze_log(self, log: LogEntry, db: AsyncSession) -> Optional[Alert]:
        """
        Run all detection rules against a new log entry.
        Returns an Alert if one is triggered, else None.
        """
        # Rule 1: Threat intel blacklist
        alert = await self._check_threat_intel(log, db)
        if alert:
            return alert

        # Rule 2: Brute force detection
        alert = await self._check_brute_force(log, db)
        if alert:
            return alert

        # Rule 3: Port scan detection
        alert = await self._check_port_scan(log, db)
        if alert:
            return alert

        # Rule 4: After-hours login
        alert = await self._check_after_hours_login(log, db)
        if alert:
            return alert

        # Rule 5: Privilege escalation keywords
        alert = await self._check_privilege_escalation(log, db)
        if alert:
            return alert

        return None

    async def _check_threat_intel(self, log: LogEntry, db: AsyncSession) -> Optional[Alert]:
        if log.source_ip in THREAT_INTEL_BLACKLIST:
            mitre = MITRE_MAP["threat_intel_match"]
            alert = Alert(
                alert_type="threat_intel_match",
                severity="critical",
                title=f"Known Malicious IP: {log.source_ip}",
                description=f"Source IP {log.source_ip} matched threat intelligence blacklist.",
                source_ip=log.source_ip,
                affected_system=log.hostname,
                mitre_technique_id=mitre["technique_id"],
                mitre_technique_name=mitre["technique_name"],
                mitre_tactic=mitre["tactic"],
                related_log_ids=[log.id],
                status="open",
            )
            db.add(alert)
            await db.flush()
            logger.warning(f"[ALERT] Threat intel match: {log.source_ip}")
            return alert
        return None

    async def _check_brute_force(self, log: LogEntry, db: AsyncSession) -> Optional[Alert]:
        if log.event_type not in ("failed_login", "authentication_failure"):
            return None

        window_start = datetime.now(timezone.utc) - timedelta(
            seconds=settings.BRUTE_FORCE_WINDOW_SECONDS
        )

        result = await db.execute(
            select(func.count(LogEntry.id)).where(
                LogEntry.source_ip == log.source_ip,
                LogEntry.event_type.in_(["failed_login", "authentication_failure"]),
                LogEntry.timestamp >= window_start,
            )
        )
        count = result.scalar_one()

        if count >= settings.BRUTE_FORCE_THRESHOLD:
            # Check we haven't already alerted on this IP recently
            existing = await db.execute(
                select(Alert).where(
                    Alert.source_ip == log.source_ip,
                    Alert.alert_type == "brute_force",
                    Alert.created_at >= window_start,
                )
            )
            if existing.scalar_one_or_none():
                return None  # already alerted

            mitre = MITRE_MAP["brute_force"]
            alert = Alert(
                alert_type="brute_force",
                severity="high",
                title=f"Brute Force Attack Detected from {log.source_ip}",
                description=(
                    f"{count} failed login attempts from {log.source_ip} "
                    f"in the last {settings.BRUTE_FORCE_WINDOW_SECONDS} seconds. "
                    f"Target username: {log.username or 'unknown'}."
                ),
                source_ip=log.source_ip,
                affected_system=log.hostname,
                username=log.username,
                mitre_technique_id=mitre["technique_id"],
                mitre_technique_name=mitre["technique_name"],
                mitre_tactic=mitre["tactic"],
                related_log_ids=[log.id],
                status="open",
            )
            db.add(alert)
            await db.flush()
            logger.warning(f"[ALERT] Brute force from {log.source_ip}: {count} attempts")
            return alert
        return None

    async def _check_port_scan(self, log: LogEntry, db: AsyncSession) -> Optional[Alert]:
        if log.event_type not in ("port_probe", "connection_attempt", "firewall_drop"):
            return None

        window_start = datetime.now(timezone.utc) - timedelta(
            seconds=settings.PORT_SCAN_WINDOW_SECONDS
        )

        # Count distinct destination ports from this IP in window
        result = await db.execute(
            select(func.count(LogEntry.destination_port.distinct())).where(
                LogEntry.source_ip == log.source_ip,
                LogEntry.event_type.in_(["port_probe", "connection_attempt", "firewall_drop"]),
                LogEntry.timestamp >= window_start,
                LogEntry.destination_port.isnot(None),
            )
        )
        distinct_ports = result.scalar_one()

        if distinct_ports >= settings.PORT_SCAN_THRESHOLD:
            existing = await db.execute(
                select(Alert).where(
                    Alert.source_ip == log.source_ip,
                    Alert.alert_type == "port_scan",
                    Alert.created_at >= window_start,
                )
            )
            if existing.scalar_one_or_none():
                return None

            mitre = MITRE_MAP["port_scan"]
            alert = Alert(
                alert_type="port_scan",
                severity="medium",
                title=f"Port Scan Detected from {log.source_ip}",
                description=(
                    f"{distinct_ports} distinct ports probed from {log.source_ip} "
                    f"in {settings.PORT_SCAN_WINDOW_SECONDS} seconds."
                ),
                source_ip=log.source_ip,
                affected_system=log.hostname,
                mitre_technique_id=mitre["technique_id"],
                mitre_technique_name=mitre["technique_name"],
                mitre_tactic=mitre["tactic"],
                related_log_ids=[log.id],
                status="open",
            )
            db.add(alert)
            await db.flush()
            logger.warning(f"[ALERT] Port scan from {log.source_ip}: {distinct_ports} ports")
            return alert
        return None

    async def _check_after_hours_login(self, log: LogEntry, db: AsyncSession) -> Optional[Alert]:
        """Flag successful logins outside business hours (22:00 - 06:00 UTC)."""
        if log.event_type not in ("successful_login", "login_success", "user_logon"):
            return None

        hour = datetime.now(timezone.utc).hour
        if 6 <= hour < 22:
            return None  # business hours, fine

        mitre = MITRE_MAP["after_hours_login"]
        alert = Alert(
            alert_type="after_hours_login",
            severity="medium",
            title=f"After-Hours Login: {log.username or 'unknown'} from {log.source_ip}",
            description=(
                f"Successful login detected at {datetime.now(timezone.utc).strftime('%H:%M UTC')} "
                f"(outside business hours). User: {log.username or 'unknown'}, IP: {log.source_ip}."
            ),
            source_ip=log.source_ip,
            affected_system=log.hostname,
            username=log.username,
            mitre_technique_id=mitre["technique_id"],
            mitre_technique_name=mitre["technique_name"],
            mitre_tactic=mitre["tactic"],
            related_log_ids=[log.id],
            status="open",
        )
        db.add(alert)
        await db.flush()
        logger.warning(f"[ALERT] After-hours login: {log.username} from {log.source_ip}")
        return alert

    async def _check_privilege_escalation(self, log: LogEntry, db: AsyncSession) -> Optional[Alert]:
        """Detect privilege escalation keywords in raw log messages."""
        if not log.raw_message:
            return None

        keywords = ["sudo", "su root", "privilege escalation", "runas", "UAC bypass", "chmod 777"]
        msg_lower = log.raw_message.lower()

        triggered = [kw for kw in keywords if kw.lower() in msg_lower]
        if not triggered:
            return None

        mitre = MITRE_MAP["privilege_escalation"]
        alert = Alert(
            alert_type="privilege_escalation",
            severity="high",
            title=f"Possible Privilege Escalation on {log.hostname or log.source_ip}",
            description=(
                f"Privilege escalation keywords detected in log: {', '.join(triggered)}. "
                f"Source IP: {log.source_ip}, User: {log.username or 'unknown'}."
            ),
            source_ip=log.source_ip,
            affected_system=log.hostname,
            username=log.username,
            mitre_technique_id=mitre["technique_id"],
            mitre_technique_name=mitre["technique_name"],
            mitre_tactic=mitre["tactic"],
            related_log_ids=[log.id],
            status="open",
        )
        db.add(alert)
        await db.flush()
        logger.warning(f"[ALERT] Privilege escalation: {triggered} on {log.hostname}")
        return alert


detection_engine = DetectionEngine()



