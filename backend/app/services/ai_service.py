"""
AI analysis service facade backed by Gemini.
"""

from app.services.gemini_service import gemini_service


class AIAnalysisService:
    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def provider(self):
        return gemini_service

    @property
    def api_key(self) -> str:
        return getattr(self.provider, "api_key", "")

    async def analyze_alert(self, alert, log_entries: list) -> dict:
        return await self.provider.analyze_alert(alert, log_entries)

    async def analyze_freeform(self, context: str) -> dict:
        return await self.provider.analyze_freeform(context)


ai_analysis_service = AIAnalysisService()



