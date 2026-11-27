from fastapi.testclient import TestClient
from pydantic import ValidationError
import pytest


@pytest.fixture(scope="module")
def app_client(tmp_path_factory):
    with pytest.MonkeyPatch.context() as env:
        db = tmp_path_factory.mktemp("siem") / "test.db"
        env.setenv("DEBUG", "false")
        env.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{db}")
        env.setenv("JWT_SECRET_KEY", "local-test-signing-key-for-synthetic-data")
        env.setenv("GEMINI_API_KEY", "")
        env.setenv("ABUSEIPDB_API_KEY", "")
        from main import app
        from app.services import tiering_engine

        env.setattr(tiering_engine, "COLD_STORAGE_DIR", str(db.parent / "cold"))
        with TestClient(app) as client:
            yield client


def test_account_login_and_log_ingestion(app_client):
    account = {
        "email": "analyst@example.invalid",
        "password": "local-test-password",
        "full_name": "Test Analyst",
        "tenant_name": "Test SOC",
        "tenant_slug": "test-soc",
    }
    assert app_client.post("/api/auth/register", json=account).status_code == 200
    credentials = {key: account[key] for key in ("email", "password")}
    login = app_client.post("/api/auth/login", json=credentials)
    assert login.status_code == 200
    user = app_client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )
    assert user.json()["email"] == account["email"]

    event = {"source_ip": "192.0.2.1", "event_type": "test_event"}
    ingested = app_client.post("/api/logs/ingest", json=event)
    assert ingested.status_code == 200
    assert app_client.get(f"/api/logs/{ingested.json()['log_id']}").json()["source_ip"] == event["source_ip"]


def test_cors_patch_preflight(app_client):
    origin = "http://localhost:5173"
    headers = {"Origin": origin, "Access-Control-Request-Method": "PATCH"}
    response = app_client.options("/api/alerts/1", headers=headers)
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin


@pytest.mark.parametrize("query", ["limit=-1", "offset=-1", "limit=501"])
def test_log_pagination_bounds(app_client, query):
    assert app_client.get(f"/api/logs/?{query}").status_code == 422


def test_cold_storage_calendar_validation(app_client):
    assert app_client.get("/api/logs/cold?date=2026-02-30").status_code == 422
    response = app_client.get("/api/logs/cold?date=2026-02-28")
    assert response.json() == {"date": "2026-02-28", "logs": [], "count": 0}


def test_non_debug_server_requires_signing_key(app_client):
    from app.core.config import Settings

    with pytest.raises(ValidationError, match="JWT_SECRET_KEY"):
        Settings(DEBUG=False, JWT_SECRET_KEY=None)
