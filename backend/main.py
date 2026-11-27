from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import logs, alerts, analysis, dashboard, auth, playbooks, compliance, reports
from app.api import threat_intel
from app.core.database import init_db
from app.core.config import settings
from app.core.dependencies import require_telemetry_access
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting SIEM backend...")
    await init_db()
    yield
    logger.info("Shutting down SIEM backend...")


app = FastAPI(
    title="AI-Powered SIEM",
    description="Security Information and Event Management with Gemini AI",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

telemetry_access = [Depends(require_telemetry_access)]

app.include_router(logs.router, prefix="/api/logs", tags=["Logs"], dependencies=telemetry_access)
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"], dependencies=telemetry_access)
app.include_router(analysis.router, prefix="/api/analysis", tags=["AI Analysis"], dependencies=telemetry_access)
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"], dependencies=telemetry_access)
app.include_router(playbooks.router, prefix="/api/playbooks", tags=["Playbooks"], dependencies=telemetry_access)
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"], dependencies=telemetry_access)
app.include_router(threat_intel.router, dependencies=telemetry_access)
app.include_router(compliance.router, prefix="/api/compliance", tags=["Compliance"], dependencies=telemetry_access)
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI-Powered SIEM"}


