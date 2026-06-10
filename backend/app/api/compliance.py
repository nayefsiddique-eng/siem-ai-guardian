from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.alert import Alert
from datetime import datetime

router = APIRouter(tags=["compliance"])

FRAMEWORK_CONTROLS = {
    "SOC2": {
        "CC6.1":  "Logical and physical access controls",
        "CC6.6":  "External threat protection",
        "CC7.1":  "Vulnerability detection and monitoring",
        "CC7.2":  "Security incident response",
        "CC7.3":  "Threat evaluation and response",
        "CC8.1":  "Change management controls",
    },
    "ISO27001": {
        "A.12.4.1": "Event logging and monitoring",
        "A.12.6.1": "Management of technical vulnerabilities",
        "A.13.1.1": "Network security controls",
        "A.16.1.2": "Reporting information security events",
        "A.16.1.4": "Assessment and decision on events",
        "A.9.4.2":  "Secure log-on procedures",
    },
    "GDPR": {
        "Art.32": "Security of processing",
        "Art.33": "Notification of personal data breach",
        "Art.25": "Data protection by design",
        "Art.5":  "Principles of data processing",
    },
    "NIST_CSF": {
        "DE.AE-1": "Baseline network activity established",
        "DE.AE-2": "Detected events analyzed",
        "DE.CM-1": "Network monitored for attacks",
        "DE.CM-7": "Monitoring for unauthorized activity",
        "RS.AN-1": "Notifications from detection systems",
        "RS.MI-1": "Incidents contained",
    },
}

ATTACK_COMPLIANCE_MAP = {
    "brute_force": {
        "mitre":    "T1110 - Brute Force",
        "severity": "high",
        "frameworks": {
            "SOC2":     ["CC6.1", "CC6.6", "CC7.2"],
            "ISO27001": ["A.9.4.2", "A.16.1.2", "A.16.1.4"],
            "GDPR":     ["Art.32", "Art.33"],
            "NIST_CSF": ["DE.CM-1", "DE.CM-7", "RS.MI-1"],
        },
    },
    "port_scan": {
        "mitre":    "T1046 - Network Service Scanning",
        "severity": "medium",
        "frameworks": {
            "SOC2":     ["CC6.6", "CC7.1"],
            "ISO27001": ["A.12.6.1", "A.13.1.1"],
            "GDPR":     ["Art.32"],
            "NIST_CSF": ["DE.AE-1", "DE.CM-1", "RS.AN-1"],
        },
    },
    "privilege_escalation": {
        "mitre":    "T1068 - Exploitation for Privilege Escalation",
        "severity": "critical",
        "frameworks": {
            "SOC2":     ["CC6.1", "CC7.2", "CC7.3", "CC8.1"],
            "ISO27001": ["A.12.4.1", "A.16.1.2", "A.16.1.4"],
            "GDPR":     ["Art.32", "Art.33", "Art.25"],
            "NIST_CSF": ["DE.AE-2", "RS.AN-1", "RS.MI-1"],
        },
    },
    "threat_intel_match": {
        "mitre":    "T1071 - Application Layer Protocol",
        "severity": "critical",
        "frameworks": {
            "SOC2":     ["CC6.6", "CC7.1", "CC7.3"],
            "ISO27001": ["A.12.6.1", "A.16.1.4"],
            "GDPR":     ["Art.32", "Art.33"],
            "NIST_CSF": ["DE.CM-1", "DE.CM-7", "RS.MI-1"],
        },
    },
    "after_hours_login": {
        "mitre":    "T1078 - Valid Accounts",
        "severity": "medium",
        "frameworks": {
            "SOC2":     ["CC6.1", "CC7.2"],
            "ISO27001": ["A.9.4.2", "A.12.4.1"],
            "GDPR":     ["Art.32"],
            "NIST_CSF": ["DE.AE-2", "DE.CM-7"],
        },
    },
}

FRAMEWORK_META = {
    "SOC2":     {"name": "SOC 2 Type II",               "color": "#818cf8", "desc": "Trust Services Criteria"},
    "ISO27001": {"name": "ISO/IEC 27001:2022",           "color": "#22d3ee", "desc": "Information Security Management"},
    "GDPR":     {"name": "GDPR",                         "color": "#f87171", "desc": "EU Data Protection Regulation"},
    "NIST_CSF": {"name": "NIST Cybersecurity Framework", "color": "#fbbf24", "desc": "Detect & Respond Functions"},
}


def compute_compliance(alerts):
    triggered_controls = {fw: set() for fw in FRAMEWORK_CONTROLS}
    attack_hits = {}

    for alert in alerts:
        atype = alert.alert_type
        if atype not in ATTACK_COMPLIANCE_MAP:
            continue
        mapping = ATTACK_COMPLIANCE_MAP[atype]
        if atype not in attack_hits:
            attack_hits[atype] = {
                "mitre":      mapping["mitre"],
                "severity":   mapping["severity"],
                "count":      0,
                "frameworks": list(mapping["frameworks"].keys()),
            }
        attack_hits[atype]["count"] += 1
        for fw, controls in mapping["frameworks"].items():
            triggered_controls[fw].update(controls)

    frameworks = {}
    total_controls = 0
    total_triggered = 0

    for fw, meta in FRAMEWORK_META.items():
        all_controls  = set(FRAMEWORK_CONTROLS[fw].keys())
        triggered     = triggered_controls[fw]
        clean         = all_controls - triggered
        impact_pct    = round(len(triggered) / len(all_controls) * 100) if all_controls else 0
        total_controls  += len(all_controls)
        total_triggered += len(triggered)

        status = "compliant"
        if impact_pct >= 60:
            status = "non_compliant"
        elif impact_pct >= 25:
            status = "at_risk"

        frameworks[fw] = {
            "id":               fw,
            "name":             meta["name"],
            "color":            meta["color"],
            "desc":             meta["desc"],
            "total_controls":   len(all_controls),
            "triggered":        len(triggered),
            "clean":            len(clean),
            "impact_pct":       impact_pct,
            "status":           status,
            "triggered_list":   sorted(triggered),
            "clean_list":       sorted(clean),
            "control_details":  FRAMEWORK_CONTROLS[fw],
        }

    overall_pct = round(total_triggered / total_controls * 100) if total_controls else 0
    if overall_pct >= 50:
        overall_status = "non_compliant"
    elif overall_pct >= 20:
        overall_status = "at_risk"
    else:
        overall_status = "compliant"

    return {
        "generated_at":    datetime.utcnow().isoformat(),
        "overall_status":  overall_status,
        "overall_pct":     overall_pct,
        "alerts_analyzed": len(alerts),
        "controls_triggered": total_triggered,
        "frameworks_impacted": sum(1 for f in frameworks.values() if f["triggered"] > 0),
        "frameworks":      frameworks,
        "attack_mapping":  attack_hits,
    }


@router.get("/", dependencies=[])
async def get_compliance(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).order_by(desc(Alert.created_at)))
    alerts = result.scalars().all()
    return compute_compliance(alerts)


@router.get("/framework/{fw_id}")
async def get_framework(fw_id: str, db: AsyncSession = Depends(get_db)):
    if fw_id not in FRAMEWORK_META:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Framework not found")
    result = await db.execute(select(Alert).order_by(desc(Alert.created_at)))
    alerts = result.scalars().all()
    data = compute_compliance(alerts)
    return data["frameworks"][fw_id]




