from secrets import token_urlsafe

from pydantic import Field, PositiveInt, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    APP_NAME: str = "AI-Powered SIEM"
    DEBUG: bool = False

    DATABASE_URL: str = "sqlite+aiosqlite:///./siem.db"

    JWT_SECRET_KEY: SecretStr | None = None
    TELEMETRY_TENANT_ID: PositiveInt | None = None
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=480, gt=0)

    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    BRUTE_FORCE_THRESHOLD: int = 5
    BRUTE_FORCE_WINDOW_SECONDS: int = 60

    PORT_SCAN_THRESHOLD: int = 10
    PORT_SCAN_WINDOW_SECONDS: int = 30

    ABUSEIPDB_API_KEY: str = ""

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def configure_jwt_secret(self):
        value = self.JWT_SECRET_KEY.get_secret_value() if self.JWT_SECRET_KEY else ""
        if not value and self.DEBUG:
            self.JWT_SECRET_KEY = SecretStr(token_urlsafe(48))
        elif len(value) < 32 or value == "change-this-in-production-use-a-long-random-string":
            raise ValueError("JWT_SECRET_KEY must be a random value of at least 32 characters.")
        return self


settings = Settings()



