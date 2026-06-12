"""
Log Tiering Engine
Scores incoming logs and routes them to hot or cold storage.
Hot  = SQLite DB (fast queries, recent/critical data)
Cold = Compressed JSON files (cheap, historical/low-value data)
"""
import gzip
import json
import os
from datetime import datetime, timezone
from app.models.log_entry import LogEntry

COLD_STORAGE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "cold_storage")


def _ensure_cold_dir():
    os.makedirs(COLD_STORAGE_DIR, exist_ok=True)


def score_log(log: LogEntry) -> int:
    """
    Score a log entry 0-100. Higher = more valuable = keep hot.
    """
    score = 0

    # Severity weight
    severity_scores = {"critical": 40, "high": 30, "medium": 15, "low": 0}
    score += severity_scores.get(log.severity, 0)

    # Event type weight
    high_value_events = {
        "failed_login", "authentication_failure",
        "privilege_event", "firewall_drop",
        "port_probe", "threat_intel_match",
    }
    if log.event_type in high_value_events:
        score += 30

    # Known attacker IPs (in production: check threat intel feed)
    if log.source_ip and log.source_ip.startswith("185.220"):
        score += 20

    # Has username = more forensic value
    if log.username:
        score += 10

    return min(score, 100)


def assign_tier(log: LogEntry) -> str:
    """Return 'hot' or 'cold' based on log score."""
    score = score_log(log)
    return "hot" if score >= 25 else "cold"


def write_to_cold_storage(log_dict: dict):
    """
    Append a log entry to a daily compressed cold storage file.
    File: cold_storage/YYYY-MM-DD.json.gz
    """
    _ensure_cold_dir()
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    filepath = os.path.join(COLD_STORAGE_DIR, f"{date_str}.json.gz")

    with gzip.open(filepath, "at", encoding="utf-8") as f:
        f.write(json.dumps(log_dict) + "\n")


def read_cold_storage(date_str: str) -> list:
    """
    Read all cold storage logs for a given date (YYYY-MM-DD).
    Returns list of log dicts.
    """
    _ensure_cold_dir()
    filepath = os.path.join(COLD_STORAGE_DIR, f"{date_str}.json.gz")

    if not os.path.exists(filepath):
        return []

    logs = []
    with gzip.open(filepath, "rt", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                logs.append(json.loads(line))
    return logs


def get_cold_storage_stats() -> dict:
    """Return stats about cold storage files."""
    _ensure_cold_dir()
    files = [f for f in os.listdir(COLD_STORAGE_DIR) if f.endswith(".json.gz")]
    total_size = sum(
        os.path.getsize(os.path.join(COLD_STORAGE_DIR, f)) for f in files
    )
    return {
        "files": len(files),
        "total_size_kb": round(total_size / 1024, 2),
        "dates": sorted([f.replace(".json.gz", "") for f in files]),
    }


tiering_engine_instance = {
    "score_log": score_log,
    "assign_tier": assign_tier,
    "write_to_cold_storage": write_to_cold_storage,
    "read_cold_storage": read_cold_storage,
    "get_cold_storage_stats": get_cold_storage_stats,
}



