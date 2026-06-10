from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI-Powered SIEM"
    DEBUG: bool = False

    # Database (SQLite for local dev, PostgreSQL for prod)
    DATABASE_URL: str = "sqlite+aiosqlite:///./siem.db"

    # Gemini AI
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # CORS - restrict in production
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Detection thresholds
    BRUTE_FORCE_THRESHOLD: int = 5       # failed logins in window
    BRUTE_FORCE_WINDOW_SECONDS: int = 60
    PORT_SCAN_THRESHOLD: int = 10        # ports in window
    PORT_SCAN_WINDOW_SECONDS: int = 30

    # Threat Intel
    ABUSEIPDB_API_KEY: str = ""
    THREAT_INTEL_FEEDS: List[str] = []

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

