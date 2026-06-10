from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import logs, alerts, analysis, dashboard, auth, playbooks, compliance, reports
from app.core.database import init_db
from app.core.config import settings
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
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(logs.router, prefix="/api/logs", tags=["Logs"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["AI Analysis"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(playbooks.router, prefix="/api/playbooks", tags=["Playbooks"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(compliance.router, prefix="/api/compliance", tags=["Compliance"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI-Powered SIEM"}
