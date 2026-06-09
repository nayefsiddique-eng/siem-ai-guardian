"""
Gemini AI Analysis Service.
Takes an alert + related logs and returns structured threat analysis.
"""
import json
import logging
import httpx
from app.core.config import settings
from app.models.alert import Alert

logger = logging.getLogger(__name__)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

ANALYSIS_PROMPT_TEMPLATE = """You are a senior SOC (Security Operations Center) analyst AI assistant.

Analyze the following security alert and provide a structured threat analysis.

=== ALERT ===
Type: {alert_type}
Severity: {severity}
Title: {title}
Description: {description}
Source IP: {source_ip}
Affected System: {affected_system}
Username: {username}
MITRE Technique: {mitre_technique_id} - {mitre_technique_name} ({mitre_tactic})

=== RELATED LOG EVENTS ===
{log_summary}

=== YOUR TASK ===
Respond ONLY with a valid JSON object in this exact format, no markdown:
{{
  "threat_summary": "2-3 sentence plain English summary of what is happening",
  "risk_level": "low|medium|high|critical",
  "confidence": "low|medium|high",
  "attack_stage": "reconnaissance|initial_access|execution|persistence|privilege_escalation|defense_evasion|credential_access|discovery|lateral_movement|collection|exfiltration|command_and_control|impact",
  "indicators_of_compromise": ["list", "of", "IOCs"],
  "recommendations": [
    "Specific action 1",
    "Specific action 2",
    "Specific action 3"
  ],
  "false_positive_likelihood": "low|medium|high",
  "false_positive_reason": "Why this might be a false positive, or null if unlikely"
}}"""


class GeminiAnalysisService:

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        self.url = GEMINI_API_URL.format(model=self.model)

    async def analyze_alert(self, alert: Alert, log_entries: list) -> dict:
        """Send alert to Gemini for AI analysis. Returns parsed JSON dict."""
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not set — skipping AI analysis.")
            return self._fallback_analysis(alert)

        log_summary = self._summarize_logs(log_entries)

        prompt = ANALYSIS_PROMPT_TEMPLATE.format(
            alert_type=alert.alert_type,
            severity=alert.severity,
            title=alert.title,
            description=alert.description,
            source_ip=alert.source_ip or "unknown",
            affected_system=alert.affected_system or "unknown",
            username=alert.username or "unknown",
            mitre_technique_id=alert.mitre_technique_id or "N/A",
            mitre_technique_name=alert.mitre_technique_name or "N/A",
            mitre_tactic=alert.mitre_tactic or "N/A",
            log_summary=log_summary,
        )

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 1024,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.url,
                    params={"key": self.api_key},
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()

            # Extract text from Gemini response
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            text = text.strip().strip("```json").strip("```").strip()
            result = json.loads(text)
            logger.info(f"Gemini analysis complete for alert {alert.id}")
            return result

        except httpx.HTTPStatusError as e:
            logger.error(f"Gemini API HTTP error: {e.response.status_code} — {e.response.text}")
            return self._fallback_analysis(alert)
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Gemini response parse error: {e}")
            return self._fallback_analysis(alert)
        except Exception as e:
            logger.error(f"Gemini analysis failed: {e}")
            return self._fallback_analysis(alert)

    def _summarize_logs(self, log_entries: list) -> str:
        if not log_entries:
            return "No related log entries found."
        lines = []
        for log in log_entries[:20]:  # cap at 20 logs
            if hasattr(log, "to_dict"):
                d = log.to_dict()
            else:
                d = log
            lines.append(
                f"[{d.get('timestamp', 'N/A')}] {d.get('event_type')} from "
                f"{d.get('source_ip')} → {d.get('destination_ip', 'N/A')} "
                f"(port {d.get('destination_port', 'N/A')}) severity={d.get('severity')}"
            )
        return "\n".join(lines)

    def _fallback_analysis(self, alert: Alert) -> dict:
        """Return a basic rule-based analysis when Gemini is unavailable."""
        severity_to_risk = {
            "low": "low", "medium": "medium",
            "high": "high", "critical": "critical"
        }
        return {
            "threat_summary": f"Automated detection: {alert.description}",
            "risk_level": severity_to_risk.get(alert.severity, "medium"),
            "confidence": "medium",
            "attack_stage": self._infer_attack_stage(alert.alert_type),
            "indicators_of_compromise": [alert.source_ip] if alert.source_ip else [],
            "recommendations": [
                f"Investigate traffic from {alert.source_ip}",
                "Review authentication logs",
                "Check for lateral movement from affected system",
            ],
            "false_positive_likelihood": "medium",
            "false_positive_reason": "AI analysis unavailable — manual review required.",
        }

    def _infer_attack_stage(self, alert_type: str) -> str:
        mapping = {
            "brute_force": "credential_access",
            "port_scan": "reconnaissance",
            "threat_intel_match": "command_and_control",
            "after_hours_login": "initial_access",
            "privilege_escalation": "privilege_escalation",
        }
        return mapping.get(alert_type, "discovery")


gemini_service = GeminiAnalysisService()
