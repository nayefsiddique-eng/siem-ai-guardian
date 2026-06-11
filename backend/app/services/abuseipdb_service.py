import httpx
import os
from datetime import datetime

from app.core.config import settings
ABUSEIPDB_KEY = settings.ABUSEIPDB_API_KEY
BASE_URL = "https://api.abuseipdb.com/api/v2"

async def lookup_ip(ip: str, max_age_days: int = 90) -> dict:
    if not ABUSEIPDB_KEY:
        return {"error": "ABUSEIPDB_API_KEY not configured"}
    if not ip or ip in ("-", ""):
        return {"error": "Invalid IP address"}

    headers = {
        "Key": ABUSEIPDB_KEY,
        "Accept": "application/json",
    }
    params = {
        "ipAddress": ip,
        "maxAgeInDays": max_age_days,
        "verbose": True,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(f"{BASE_URL}/check", headers=headers, params=params)
            if res.status_code == 200:
                data = res.json().get("data", {})
                return {
                    "ip":                   data.get("ipAddress"),
                    "abuse_score":          data.get("abuseConfidenceScore", 0),
                    "total_reports":        data.get("totalReports", 0),
                    "distinct_users":       data.get("numDistinctUsers", 0),
                    "country":              data.get("countryCode", "Unknown"),
                    "usage_type":           data.get("usageType", "Unknown"),
                    "isp":                  data.get("isp", "Unknown"),
                    "domain":               data.get("domain", ""),
                    "is_tor":               data.get("isTor", False),
                    "is_public":            data.get("isPublic", True),
                    "last_reported":        data.get("lastReportedAt"),
                    "last_checked":         datetime.utcnow().isoformat(),
                    "reports":              data.get("reports", [])[:10],
                    "threat_level":         _threat_level(data.get("abuseConfidenceScore", 0)),
                }
            elif res.status_code == 429:
                return {"error": "Rate limit exceeded - try again in a few minutes"}
            elif res.status_code == 422:
                return {"error": f"Invalid IP address: {ip}"}
            else:
                return {"error": f"AbuseIPDB returned status {res.status_code}"}
    except httpx.TimeoutException:
        return {"error": "Request timed out � AbuseIPDB may be slow"}
    except Exception as e:
        return {"error": str(e)}

async def bulk_lookup(ips: list[str]) -> dict:
    results = {}
    unique = list(set(ip for ip in ips if ip and ip not in ("-","")))[:10]
    for ip in unique:
        results[ip] = await lookup_ip(ip)
    return results

def _threat_level(score: int) -> str:
    if score >= 80: return "critical"
    if score >= 50: return "high"
    if score >= 25: return "medium"
    if score >= 5:  return "low"
    return "clean"

