from fastapi import APIRouter, Query
from app.services.abuseipdb_service import lookup_ip, bulk_lookup

router = APIRouter(prefix="/api/threat-intel", tags=["Threat Intelligence"])

@router.get("/lookup")
async def lookup_single(ip: str = Query(..., description="IP address to check")):
    return await lookup_ip(ip)

@router.post("/bulk")
async def lookup_bulk(payload: dict):
    ips = payload.get("ips", [])
    if not ips:
        return {"error": "No IPs provided"}
    if len(ips) > 10:
        return {"error": "Maximum 10 IPs per bulk request"}
    return await bulk_lookup(ips)

@router.get("/health")
async def health():
    import os
    key = os.getenv("ABUSEIPDB_API_KEY","")
    return {
        "status": "configured" if key else "missing_key",
        "key_preview": key[:8]+"..." if key else None,
    }
