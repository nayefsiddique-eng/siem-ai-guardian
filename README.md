# AI-Powered SIEM — Setup Guide

A full-stack Security Information and Event Management platform with Gemini AI threat analysis.

## Architecture

```
Logs (API / Script)
        │
        ▼
FastAPI Backend  ─── Detection Engine (5 rules)
        │                    │
        ▼                    ▼
  SQLite DB            Alert Table
        │
        ▼
  Gemini AI  ──────── AI Analysis + Recommendations
        │
        ▼
  React Dashboard  ─── Charts, Alerts, Log Stream
```

## Quick Start

### 1. Backend Setup

```powershell
cd siem-project\backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy and configure .env
Copy-Item .env.example .env
# Edit .env and add your GEMINI_API_KEY
# Get free key at: https://aistudio.google.com/app/apikey

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

### 2. Frontend Setup

```powershell
cd siem-project\frontend

npm install
npm run dev
```

Dashboard at `http://localhost:5173`

### 3. Seed Test Data

```powershell
# In a new terminal, with backend running:
cd siem-project
.\scripts\seed_test_data.ps1
```

This will:
- Trigger a **brute force alert** (6 failed logins from 185.220.101.45)
- Trigger a **port scan alert** (12 ports from 10.0.0.88)
- Trigger a **privilege escalation alert** (sudo su root)
- Add normal baseline activity

---

## Detection Rules

| Rule | Trigger | MITRE |
|------|---------|-------|
| Brute Force | ≥5 failed logins in 60s from same IP | T1110 |
| Port Scan | ≥10 distinct ports in 30s from same IP | T1046 |
| Threat Intel | Source IP in blacklist | T1071 |
| After-Hours Login | Successful login between 22:00–06:00 UTC | T1078 |
| Privilege Escalation | sudo/su root keywords in log message | T1068 |

---

## API Endpoints

### Log Ingestion
```
POST /api/logs/ingest          Single log event
POST /api/logs/ingest/bulk     Up to 1000 events
GET  /api/logs                 List logs (filterable)
```

### Alerts
```
GET    /api/alerts             List alerts
GET    /api/alerts/{id}        Alert detail
PATCH  /api/alerts/{id}        Update status (open/investigating/resolved/false_positive)
POST   /api/alerts/{id}/analyze  Trigger AI analysis
```

### Dashboard
```
GET /api/dashboard/stats       All dashboard statistics
```

### AI Analysis
```
POST /api/analysis/freeform    Plain English incident analysis
```

### Log Event Format
```json
{
  "source_ip": "192.168.1.100",
  "destination_ip": "10.0.0.1",
  "source_port": 54321,
  "destination_port": 22,
  "event_type": "failed_login",
  "severity": "medium",
  "hostname": "server-01",
  "username": "admin",
  "log_source": "linux",
  "raw_message": "Failed password for admin from 192.168.1.100"
}
```

Valid `event_type` values for detection: `failed_login`, `authentication_failure`, `port_probe`, `connection_attempt`, `firewall_drop`, `successful_login`, `login_success`, `user_logon`, `privilege_event`

---

## Project Structure

```
siem-project/
├── backend/
│   ├── main.py                   FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── api/
│       │   ├── logs.py           Log ingestion routes
│       │   ├── alerts.py         Alert management routes
│       │   ├── dashboard.py      Stats routes
│       │   └── analysis.py       AI analysis routes
│       ├── core/
│       │   ├── config.py         Settings + .env loading
│       │   └── database.py       SQLAlchemy async setup
│       ├── models/
│       │   ├── log_entry.py      Log DB model
│       │   └── alert.py          Alert DB model
│       └── services/
│           ├── detection_engine.py  5-rule threat detector
│           └── gemini_service.py    Gemini AI integration
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── hooks/useSiem.jsx     Global state + API calls
│   │   └── components/
│   │       ├── dashboard/        Overview + charts
│   │       ├── alerts/           Alert cards + AI trigger
│   │       ├── logs/             Log stream + test injector
│   │       └── analysis/         Freeform AI analysis
│   ├── package.json
│   └── vite.config.js
└── scripts/
    └── seed_test_data.ps1        Test data generator
```

---

## Adding New Detection Rules

Edit `backend/app/services/detection_engine.py`:

```python
async def _check_your_rule(self, log: LogEntry, db: AsyncSession) -> Optional[Alert]:
    if log.event_type != "your_event_type":
        return None
    # your logic
    alert = Alert(
        alert_type="your_rule",
        severity="high",
        title="...",
        description="...",
        source_ip=log.source_ip,
        mitre_technique_id="T1234",
        mitre_technique_name="Your Technique",
        mitre_tactic="Your Tactic",
    )
    db.add(alert)
    await db.flush()
    return alert
```

Then add it to the `analyze_log` method chain.

---

## Production Upgrades (Month 2–3)

- [ ] Replace SQLite with PostgreSQL
- [ ] Add ML anomaly detection (Isolation Forest)
- [ ] Pull real threat intel feeds (AbuseIPDB, OpenPhish)
- [ ] Add Windows Event Log forwarder (Python agent)
- [ ] Add Linux syslog UDP listener
- [ ] PDF incident report generation
- [ ] User authentication (JWT)
- [ ] WebSocket for live log streaming
- [ ] Docker Compose deployment
