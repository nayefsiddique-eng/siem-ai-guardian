from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    APP_NAME: str = "AI-Powered SIEM"
    DEBUG: bool = True

    DATABASE_URL: str = "sqlite:///./siem.db"

    SECRET_KEY: str = "your_secret_key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    ALLOWED_ORIGINS: str = '["http://localhost:5173","http://localhost:3000"]'

    BRUTE_FORCE_THRESHOLD: int = 5
    BRUTE_FORCE_WINDOW_SECONDS: int = 60

    PORT_SCAN_THRESHOLD: int = 10
    PORT_SCAN_WINDOW_SECONDS: int = 30

    ABUSEIPDB_API_KEY: str = ""

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
