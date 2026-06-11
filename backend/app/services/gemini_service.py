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
You are Sentinal AI, a Tier-3 SOC analyst.

Analyze:

{context}

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

        try:

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

                try:
                    return json.loads(text)

                except Exception:

                    return {
                        "threat_summary": text,
                        "risk_level": "medium",
                        "confidence": "medium",
                        "attack_stage": "discovery",
                        "indicators_of_compromise": [],
                        "recommendations": [],
                        "false_positive_likelihood": "low",
                        "false_positive_reason": ""
                    }

        except Exception as e:

            return {
                "threat_summary": f"AI provider unavailable: {str(e)}",
                "risk_level": "medium",
                "confidence": "low",
                "attack_stage": "discovery",
                "indicators_of_compromise": [],
                "recommendations": [
                    "Retry later",
                    "Check Gemini API quota",
                    "Use another Gemini API key"
                ],
                "false_positive_likelihood": "low",
                "false_positive_reason": ""
            }

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
