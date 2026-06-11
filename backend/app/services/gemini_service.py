import json
import logging

import httpx

from app.core.config import settings
from app.models.alert import Alert

logger = logging.getLogger(__name__)

GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "{model}:generateContent"
)


class GeminiAnalysisService:

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        self.url = GEMINI_API_URL.format(model=self.model)

    async def analyze_freeform(self, context: str) -> dict:

        prompt = f"""
You are a senior SOC analyst.

Analyze this security event:

{context}

RULES:

1. threat_summary must be 2-3 sentences maximum.
2. recommendations must contain at most 5 items.
3. risk_level must be ONLY:
   low, medium, high, critical
4. confidence must be ONLY:
   low, medium, high
5. false_positive_likelihood must be ONLY:
   low, medium, high
6. attack_stage must be ONLY one of:

reconnaissance
initial_access
execution
persistence
privilege_escalation
defense_evasion
credential_access
discovery
lateral_movement
collection
exfiltration
command_and_control
impact

Return ONLY valid JSON:

{{
  "threat_summary": "",
  "risk_level": "",
  "confidence": "",
  "attack_stage": "",
  "indicators_of_compromise": [],
  "recommendations": [],
  "false_positive_likelihood": "",
  "false_positive_reason": ""
}}
"""

        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ]
        }

        async with httpx.AsyncClient(timeout=30) as client:

            response = await client.post(
                self.url,
                params={"key": self.api_key},
                json=payload
            )

            response.raise_for_status()

            data = response.json()

            text = data["candidates"][0]["content"]["parts"][0]["text"]

            text = (
                text.replace("```json", "")
                .replace("```", "")
                .strip()
            )

            return json.loads(text)

    async def analyze_alert(
        self,
        alert: Alert,
        log_entries: list
    ) -> dict:

        context = (
            f"Alert Type: {alert.alert_type}\n"
            f"Severity: {alert.severity}\n"
            f"Description: {alert.description}"
        )

        return await self.analyze_freeform(context)


gemini_service = GeminiAnalysisService()
