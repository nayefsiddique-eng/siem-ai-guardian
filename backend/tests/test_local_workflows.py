from fastapi.testclient import TestClient
from pydantic import ValidationError
import pytest


@pytest.fixture(scope="module")
def app_client(tmp_path_factory):
    with pytest.MonkeyPatch.context() as env:
        db = tmp_path_factory.mktemp("siem") / "test.db"
        env.setenv("DEBUG", "false")
        env.setenv("TELEMETRY_TENANT_ID", "1")
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

    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    outsider = dict(account, email="outsider@example.invalid", tenant_slug="other-soc")
    other = app_client.post("/api/auth/register", json=outsider)
    assert other.status_code == 200
    outsider_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}
    assert app_client.get("/api/logs/").status_code == 401
    assert app_client.get("/api/logs/", headers=outsider_headers).status_code == 403
    assert app_client.get("/api/reports/", headers=outsider_headers).status_code == 403

    event = {"source_ip": "192.0.2.1", "event_type": "test_event"}
    ingested = app_client.post("/api/logs/ingest", json=event, headers=headers)
    assert ingested.status_code == 200
    assert app_client.get(f"/api/logs/{ingested.json()['log_id']}", headers=headers).json()["source_ip"] == event["source_ip"]


def test_cors_patch_preflight(app_client):
    origin = "http://localhost:5173"
    headers = {"Origin": origin, "Access-Control-Request-Method": "PATCH"}
    response = app_client.options("/api/alerts/1", headers=headers)
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin


@pytest.fixture
def owner_headers(app_client):
    login = app_client.post("/api/auth/login", json={
        "email": "analyst@example.invalid", "password": "local-test-password",
    })
    if login.status_code == 401:
        response = app_client.post("/api/auth/register", json={
            "email": "analyst@example.invalid", "password": "local-test-password",
            "full_name": "Test Analyst", "tenant_name": "Test SOC", "tenant_slug": "test-soc",
        })
        assert response.status_code == 200
        login = response
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


@pytest.mark.parametrize("query", ["limit=-1", "offset=-1", "limit=501"])
def test_log_pagination_bounds(app_client, owner_headers, query):
    assert app_client.get(f"/api/logs/?{query}", headers=owner_headers).status_code == 422


def test_cold_storage_calendar_validation(app_client, owner_headers):
    assert app_client.get("/api/logs/cold?date=2026-02-30", headers=owner_headers).status_code == 422
    response = app_client.get("/api/logs/cold?date=2026-02-28", headers=owner_headers)
    assert response.json() == {"date": "2026-02-28", "logs": [], "count": 0}


def test_non_debug_server_requires_signing_key(app_client):
    from app.core.config import Settings

    with pytest.raises(ValidationError, match="JWT_SECRET_KEY"):
        Settings(DEBUG=False, JWT_SECRET_KEY=None)


def test_correlation_in_both_ingestion_modes_and_soc_workflow(app_client, owner_headers):
    first_source = "192.0.2.51"
    second_source = "192.0.2.52"
    attack_log = {"event_type": " FAILED_LOGIN ", "log_source": " SYSLOG ", "hostname": "demo"}
    for _ in range(5):
        response = app_client.post("/api/logs/ingest", headers=owner_headers,
                                   json=dict(attack_log, source_ip=first_source))
        assert response.status_code == 200
    assert response.json()["alert_generated"]

    correlation = {"event_type": "successful_login", "source_ip": first_source}
    response = app_client.post("/api/logs/ingest", json=correlation, headers=owner_headers)
    assert response.status_code == 200 and response.json()["alert_generated"]
    generated_ids = response.json()["alert_ids"]

    second_logs = [dict(attack_log, source_ip=second_source)] * 3 + [
        dict(correlation, source_ip=second_source),
    ]
    bulk = app_client.post("/api/logs/ingest/bulk", json={"logs": second_logs}, headers=owner_headers)
    assert bulk.status_code == 200 and bulk.json()["alerts_generated"] >= 1

    logs = app_client.get("/api/logs/", params={"event_type": "FAILED_LOGIN", "source_ip": first_source},
                          headers=owner_headers).json()
    assert logs["count"] == 5 and all(row["log_source"] == "syslog" for row in logs["logs"])
    alerts = app_client.get("/api/alerts/", params={"alert_type": "brute_force_success"}, headers=owner_headers).json()
    assert alerts["count"] == 2

    alert_id = next(row["id"] for row in alerts["alerts"] if row["source_ip"] == first_source)
    assert alert_id in generated_ids
    alert = app_client.get(f"/api/alerts/{alert_id}", headers=owner_headers).json()
    assert alert["mitre_technique_id"] == "T1110"
    assert app_client.get("/api/dashboard/stats", headers=owner_headers).status_code == 200
    assert app_client.patch(f"/api/alerts/{alert_id}", json={"status": "investigating"},
                            headers=owner_headers).status_code == 200
    assert app_client.post(f"/api/playbooks/{alert_id}/generate", headers=owner_headers).status_code == 200
    assert app_client.post(f"/api/playbooks/{alert_id}/approve", headers=owner_headers).status_code == 200
    assert app_client.post(f"/api/playbooks/{alert_id}/reject", headers=owner_headers,
                           json={"reason": "Already reviewed"}).status_code == 400
    pdf = app_client.get("/api/reports/pdf", headers=owner_headers)
    assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF-")


def test_expired_token_is_denied(app_client):
    from datetime import timedelta
    from app.services.auth_service import create_access_token

    token = create_access_token({"sub": "1"}, expires_delta=timedelta(seconds=-1))
    response = app_client.get("/api/logs/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
