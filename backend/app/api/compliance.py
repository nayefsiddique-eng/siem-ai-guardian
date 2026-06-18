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
from fastapi.responses import StreamingResponse as _SR
import io as _io
from datetime import datetime as _dt

@router.get("/export/pdf")
async def export_compliance_pdf(db: AsyncSession = Depends(get_db)):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_CENTER
    from sqlalchemy import select, desc

    result = await db.execute(select(Alert).order_by(desc(Alert.created_at)))
    alerts = result.scalars().all()
    data = compute_compliance(alerts)

    buf = _io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm,
        topMargin=0*mm, bottomMargin=16*mm)

    C_INDIGO  = colors.HexColor("#6366f1")
    C_CYAN    = colors.HexColor("#06b6d4")
    C_RED     = colors.HexColor("#ef4444")
    C_ORANGE  = colors.HexColor("#f97316")
    C_YELLOW  = colors.HexColor("#eab308")
    C_GREEN   = colors.HexColor("#22c55e")
    C_TEXT    = colors.HexColor("#1e293b")
    C_MUTED   = colors.HexColor("#64748b")
    C_BORDER  = colors.HexColor("#e2e8f0")
    C_SURFACE = colors.HexColor("#f8fafc")
    C_HEADER  = colors.HexColor("#1e293b")
    C_WHITE   = colors.HexColor("#ffffff")
    C_BLACK   = colors.HexColor("#0f172a")

    STATUS_COLOR = {"compliant": C_GREEN, "at_risk": C_YELLOW, "non_compliant": C_RED}
    STATUS_LABEL = {"compliant": "COMPLIANT", "at_risk": "AT RISK", "non_compliant": "NON-COMPLIANT"}
    FW_COLOR     = {"SOC2": C_INDIGO, "ISO27001": C_CYAN, "GDPR": C_RED, "NIST_CSF": C_YELLOW}
    SEV_COLOR    = {"critical": C_RED, "high": C_ORANGE, "medium": C_YELLOW, "low": C_GREEN}
    FW_SHORT     = {"SOC2": "SOC2", "ISO27001": "ISO27001", "GDPR": "GDPR", "NIST_CSF": "NIST"}

    def S(text, font="Helvetica", size=10, color=C_TEXT, align=TA_LEFT, sb=0, sa=4):
        st = ParagraphStyle("x", fontName=font, fontSize=size, textColor=color,
                            alignment=align, spaceAfter=sa, spaceBefore=sb, leading=size*1.5)
        return Paragraph(text, st)

    def HR(color=C_BORDER, thick=0.5, sb=6, sa=6):
        return HRFlowable(width="100%", thickness=thick, color=color, spaceAfter=sa, spaceBefore=sb)

    overall_color = STATUS_COLOR.get(data["overall_status"], C_MUTED)
    overall_label = STATUS_LABEL.get(data["overall_status"], "UNKNOWN")

    story = []

    # Black top banner
    banner_data = [[Paragraph(
        "<b>SentinelOps</b>",
        ParagraphStyle("bn", fontName="Helvetica-Bold", fontSize=15,
                       textColor=C_WHITE, alignment=1, leading=20)
    )]]
    banner = Table(banner_data, colWidths=[174*mm])
    banner.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), C_BLACK),
        ("TOPPADDING",    (0,0), (-1,-1), 14),
        ("BOTTOMPADDING", (0,0), (-1,-1), 14),
        ("LEFTPADDING",   (0,0), (-1,-1), 0),
        ("RIGHTPADDING",  (0,0), (-1,-1), 0),
    ]))
    story += [banner, Spacer(1, 6*mm)]

    # Title block
    story += [
        S("Compliance Audit Report", "Helvetica-Bold", 24, C_TEXT, TA_CENTER, sa=4),
        HR(C_INDIGO, 1.5, sb=0, sa=4),
        S(_dt.utcnow().strftime("Generated %B %d, %Y  -  %H:%M UTC"), "Helvetica", 9, C_MUTED, TA_CENTER, sa=3),
        Spacer(1, 2*mm),
    ]

    # Status badge
    badge_data = [[Paragraph(
        f"<b>Overall Status: {overall_label}</b>",
        ParagraphStyle("b", fontName="Helvetica-Bold", fontSize=11,
                       textColor=C_WHITE, alignment=1, leading=16)
    )]]
    badge = Table(badge_data, colWidths=[174*mm])
    badge.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), overall_color),
        ("TOPPADDING",    (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("LEFTPADDING",   (0,0), (-1,-1), 12),
        ("RIGHTPADDING",  (0,0), (-1,-1), 12),
    ]))
    story += [badge, Spacer(1, 6*mm)]

    # Executive Summary
    story.append(S("Executive Summary", "Helvetica-Bold", 13, C_TEXT, sb=2, sa=4))
    story.append(HR())
    summary_data = [
        ["Metric", "Value"],
        ["Alerts Analyzed",     str(data["alerts_analyzed"])],
        ["Controls Triggered",  str(data["controls_triggered"])],
        ["Frameworks Impacted", f"{data['frameworks_impacted']} / 4"],
        ["Overall Impact",      f"{data['overall_pct']}%"],
        ["Report Status",       overall_label],
    ]
    t = Table(summary_data, colWidths=[95*mm, 79*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0),  C_HEADER),
        ("TEXTCOLOR",     (0,0), (-1,0),  C_WHITE),
        ("FONTNAME",      (0,0), (-1,0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,0),  10),
        ("FONTNAME",      (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE",      (0,1), (-1,-1), 10),
        ("TEXTCOLOR",     (0,1), (0,-1),  C_MUTED),
        ("TEXTCOLOR",     (1,1), (1,-1),  C_TEXT),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [C_WHITE, C_SURFACE]),
        ("GRID",          (0,0), (-1,-1), 0.4, C_BORDER),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("RIGHTPADDING",  (0,0), (-1,-1), 10),
        ("TOPPADDING",    (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("TEXTCOLOR",     (1,-1),(1,-1),  overall_color),
        ("FONTNAME",      (1,-1),(1,-1),  "Helvetica-Bold"),
    ]))
    story += [t, Spacer(1, 8*mm)]

    # Framework Analysis — bigger text, KeepTogether per framework
    story.append(S("Framework Analysis", "Helvetica-Bold", 13, C_TEXT, sb=2, sa=4))
    story.append(HR())
    for fw_id, fw in data["frameworks"].items():
        fw_color  = FW_COLOR.get(fw_id, C_INDIGO)
        fw_status = STATUS_LABEL.get(fw["status"], "UNKNOWN")
        block = []
        block.append(S(
            f"<b>{fw['name']}</b>  -  {fw['desc']}",
            "Helvetica-Bold", 11, fw_color, sb=4, sa=3))
        block.append(S(
            f"Status: <b>{fw_status}</b>  |  Impact: <b>{fw['impact_pct']}%</b>  |  Violated: <b>{fw['triggered']}</b> / {fw['total_controls']} controls",
            "Helvetica", 10, C_MUTED, sa=4))
        if fw["triggered_list"]:
            block.append(S(
                "<b>Violated:</b>  " + "   ".join(fw["triggered_list"]),
                "Courier", 10, C_RED, sa=3))
        if fw["clean_list"]:
            block.append(S(
                "<b>Clean:</b>  " + "   ".join(fw["clean_list"]),
                "Courier", 10, C_GREEN, sa=3))
        block += [Spacer(1, 3*mm), HR(C_BORDER, 0.4, sb=0, sa=5)]
        story.append(KeepTogether(block))

    # Attack Mapping — use KeepTogether to prevent split
    atk_rows = [["Attack Type", "MITRE", "Severity", "Count", "Frameworks"]]
    ps_wrap = ParagraphStyle("w", fontName="Helvetica", fontSize=9, leading=12, textColor=colors.HexColor("#1e293b"))
    for atype, info in data["attack_mapping"].items():
        fw_short = ", ".join([FW_SHORT.get(f, f) for f in info["frameworks"]])
        atk_rows.append([
            atype.replace("_", " ").title(),
            Paragraph(info["mitre"], ps_wrap),
            info["severity"].upper(),
            str(info["count"]),
            fw_short,
        ])
    # 40+58+20+12+44 = 174mm
    atk = Table(atk_rows, colWidths=[38*mm, 52*mm, 24*mm, 14*mm, 46*mm], repeatRows=1)
    atk_style = [
        ("BACKGROUND",    (0,0), (-1,0),  C_HEADER),
        ("TEXTCOLOR",     (0,0), (-1,0),  C_WHITE),
        ("FONTNAME",      (0,0), (-1,0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,0),  9),
        ("FONTNAME",      (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE",      (0,1), (-1,-1), 9),
        ("TEXTCOLOR",     (0,1), (-1,-1), C_TEXT),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [C_WHITE, C_SURFACE]),
        ("GRID",          (0,0), (-1,-1), 0.4, C_BORDER),
        ("LEFTPADDING",   (0,0), (-1,-1), 7),
        ("RIGHTPADDING",  (0,0), (-1,-1), 7),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]
    for i, (_, info) in enumerate(data["attack_mapping"].items(), 1):
        sc = SEV_COLOR.get(info["severity"], C_MUTED)
        atk_style += [
            ("TEXTCOLOR", (2,i), (2,i), sc),
            ("FONTNAME",  (2,i), (2,i), "Helvetica-Bold"),
        ]
    atk.setStyle(TableStyle(atk_style))

    atk_section = [
        Spacer(1, 2*mm),
        S("Attack-to-Compliance Mapping", "Helvetica-Bold", 13, C_TEXT, sb=2, sa=4),
        HR(),
        atk,
    ]
    story.append(KeepTogether(atk_section))

    story += [
        Spacer(1, 10*mm),
        HR(C_INDIGO, 1),
        Spacer(1, 3*mm),
        S("This report was automatically generated by SentinelOps.", "Helvetica", 7, C_MUTED, TA_CENTER),
        S("For internal use only. Do not distribute without authorization.", "Helvetica", 7, C_MUTED, TA_CENTER),
    ]

    doc.build(story)
    buf.seek(0)
    fname = f"sentinelops_compliance_{_dt.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    return _SR(buf, media_type="application/pdf",
               headers={"Content-Disposition": f"attachment; filename={fname}"})



