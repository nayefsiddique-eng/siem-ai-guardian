"""
Agentic Playbook Service
Generates AI mitigation playbooks for alerts.
Humans approve before any action executes.
"""
import json
import httpx
import logging
from datetime import datetime, timezone
from app.core.config import settings

logger = logging.getLogger(__name__)

PLAYBOOK_PROMPT = """You are a senior SOC automation engineer.

An alert has been triggered in our SIEM:

Alert Type: {alert_type}
Severity: {severity}
Title: {title}
Description: {description}
Source IP: {source_ip}
MITRE Technique: {mitre_id} - {mitre_name}

Generate an actionable incident response playbook.
Respond ONLY with valid JSON, no markdown:
{{
  "playbook_name": "Short name for this playbook",
  "threat_summary": "One sentence explaining the threat",
  "risk_level": "low|medium|high|critical",
  "steps": [
    {{
      "step_number": 1,
      "action": "Short action title",
      "description": "Detailed explanation of what to do and why",
      "command": "Optional CLI command or API call to execute this step",
      "requires_approval": true,
      "automated": false
    }}
  ],
  "estimated_time_minutes": 15,
  "rollback_plan": "What to do if these actions cause issues"
}}"""


async def generate_playbook(alert) -> dict:
    """Call Gemini to generate a response playbook for an alert."""
    if not settings.GEMINI_API_KEY:
        return _fallback_playbook(alert)

    prompt = PLAYBOOK_PROMPT.format(
        alert_type=alert.alert_type,
        severity=alert.severity,
        title=alert.title,
        description=alert.description,
        source_ip=alert.source_ip or "unknown",
        mitre_id=alert.mitre_technique_id or "N/A",
        mitre_name=alert.mitre_technique_name or "N/A",
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1500},
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent",
                params={"key": settings.GEMINI_API_KEY},
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        text = data["candidates"][0]["content"]["parts"][0]["text"]
        text = text.strip().strip("```json").strip("```").strip()
        playbook = json.loads(text)
        playbook["status"] = "pending_approval"
        playbook["generated_at"] = datetime.now(timezone.utc).isoformat()
        playbook["alert_id"] = alert.id
        return playbook

    except Exception as e:
        logger.error(f"Playbook generation failed: {e}")
        return _fallback_playbook(alert)


def _fallback_playbook(alert) -> dict:
    """Rule-based fallback playbook when Gemini is unavailable."""
    steps_map = {
        "brute_force": [
            {"step_number": 1, "action": "Block Source IP", "description": f"Block {alert.source_ip} at the firewall level.", "command": f"iptables -A INPUT -s {alert.source_ip} -j DROP", "requires_approval": True, "automated": False},
            {"step_number": 2, "action": "Lock Targeted Account", "description": "Temporarily lock the targeted user account.", "command": f"net user {alert.username or 'unknown'} /active:no", "requires_approval": True, "automated": False},
            {"step_number": 3, "action": "Enable MFA", "description": "Force MFA enrollment for the targeted account.", "command": None, "requires_approval": False, "automated": False},
            {"step_number": 4, "action": "Review Auth Logs", "description": "Check authentication logs for successful logins from same IP.", "command": "grep '185.220' /var/log/auth.log", "requires_approval": False, "automated": False},
        ],
        "port_scan": [
            {"step_number": 1, "action": "Block Scanning IP", "description": f"Block {alert.source_ip} at perimeter firewall.", "command": f"iptables -A INPUT -s {alert.source_ip} -j DROP", "requires_approval": True, "automated": False},
            {"step_number": 2, "action": "Check IDS Alerts", "description": "Review IDS/IPS for related alerts from same subnet.", "command": None, "requires_approval": False, "automated": False},
        ],
        "privilege_escalation": [
            {"step_number": 1, "action": "Isolate Host", "description": f"Isolate {alert.affected_system} from the network immediately.", "command": None, "requires_approval": True, "automated": False},
            {"step_number": 2, "action": "Revoke Session", "description": "Kill all active sessions for the affected user.", "command": f"pkill -u {alert.username or 'unknown'}", "requires_approval": True, "automated": False},
            {"step_number": 3, "action": "Capture Memory Dump", "description": "Preserve forensic evidence before remediation.", "command": "sudo avml /tmp/memory.lime", "requires_approval": False, "automated": False},
        ],
    }

    steps = steps_map.get(alert.alert_type, [
        {"step_number": 1, "action": "Investigate Alert", "description": "Manually review the alert details and related logs.", "command": None, "requires_approval": False, "automated": False},
        {"step_number": 2, "action": "Escalate if Confirmed", "description": "Escalate to senior analyst if threat is confirmed.", "command": None, "requires_approval": True, "automated": False},
    ])

    return {
        "playbook_name": f"Response: {alert.alert_type.replace('_', ' ').title()}",
        "threat_summary": alert.description,
        "risk_level": alert.severity,
        "steps": steps,
        "estimated_time_minutes": 20,
        "rollback_plan": "Unblock IP and restore account if actions were taken in error.",
        "status": "pending_approval",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "alert_id": alert.id,
    }


def approve_playbook(playbook, approved_by):
    playbook["status"] = "approved"
    playbook["approved_by"] = approved_by
    return playbook


def reject_playbook(playbook, rejected_by, reason):
    playbook["status"] = "rejected"
    playbook["rejected_by"] = rejected_by
    playbook["rejection_reason"] = reason
    return playbook




