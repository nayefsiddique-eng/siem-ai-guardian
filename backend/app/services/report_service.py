"""
Report generation service - JSON summaries + PDF export
"""
from datetime import datetime, timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_CENTER
import io


def generate_report_data(alerts: list, tenant_name: str = "SIEM AI Guardian") -> dict:
    """Generate structured report from alert list."""
    now = datetime.now(timezone.utc)
    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    type_counts = {}
    mitre_techniques = {}

    for a in alerts:
        sev = a.get("severity", "low")
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
        atype = a.get("alert_type", "unknown")
        type_counts[atype] = type_counts.get(atype, 0) + 1
        mid = a.get("mitre_technique_id")
        mname = a.get("mitre_technique_name")
        if mid and mname:
            mitre_techniques[mid] = mname

    resolved = sum(1 for a in alerts if a.get("status") == "resolved")
    open_count = sum(1 for a in alerts if a.get("status") == "open")

    return {
        "report_id": f"RPT-{now.strftime('%Y%m%d-%H%M%S')}",
        "generated_at": now.isoformat(),
        "tenant": tenant_name,
        "period": "Last 30 days",
        "summary": {
            "total_alerts": len(alerts),
            "open": open_count,
            "resolved": resolved,
            "resolution_rate": round((resolved / len(alerts) * 100) if alerts else 0, 1),
        },
        "severity_breakdown": severity_counts,
        "attack_types": type_counts,
        "mitre_techniques": mitre_techniques,
        "top_source_ips": _top_ips(alerts),
        "alerts": alerts[:50],
    }


def _top_ips(alerts: list) -> list:
    counts = {}
    for a in alerts:
        ip = a.get("source_ip")
        if ip:
            counts[ip] = counts.get(ip, 0) + 1
    return sorted([{"ip": k, "count": v} for k, v in counts.items()], key=lambda x: -x["count"])[:10]


def generate_pdf(report: dict) -> bytes:
    """Generate a professional PDF incident report."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    DARK = colors.HexColor("#0d1421")
    ACCENT = colors.HexColor("#0ea5e9")
    RED = colors.HexColor("#ef4444")
    ORANGE = colors.HexColor("#f97316")
    YELLOW = colors.HexColor("#eab308")
    GREEN = colors.HexColor("#22c55e")
    GRAY = colors.HexColor("#7a92b0")

    title_style = ParagraphStyle("title", fontSize=22, textColor=ACCENT,
        fontName="Helvetica-Bold", spaceAfter=4, alignment=TA_LEFT)
    sub_style = ParagraphStyle("sub", fontSize=10, textColor=GRAY,
        fontName="Helvetica", spaceAfter=2)
    h2_style = ParagraphStyle("h2", fontSize=13, textColor=DARK,
        fontName="Helvetica-Bold", spaceBefore=14, spaceAfter=6)
    body_style = ParagraphStyle("body", fontSize=9, textColor=colors.HexColor("#1e293b"),
        fontName="Helvetica", leading=14)

    story = []

    # Header
    story.append(Paragraph("SIEM AI Guardian", title_style))
    story.append(Paragraph("Incident Intelligence Report", sub_style))
    story.append(Paragraph(f"Report ID: {report['report_id']}  |  Generated: {report['generated_at'][:19]} UTC  |  Tenant: {report['tenant']}", sub_style))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=14))

    # Summary
    story.append(Paragraph("Executive Summary", h2_style))
    s = report["summary"]
    sev = report["severity_breakdown"]
    summary_data = [
        ["Metric", "Value"],
        ["Total Alerts", str(s["total_alerts"])],
        ["Open Alerts", str(s["open"])],
        ["Resolved Alerts", str(s["resolved"])],
        ["Resolution Rate", f"{s['resolution_rate']}%"],
        ["Critical Severity", str(sev.get("critical", 0))],
        ["High Severity", str(sev.get("high", 0))],
        ["Medium Severity", str(sev.get("medium", 0))],
        ["Low Severity", str(sev.get("low", 0))],
    ]
    t = Table(summary_data, colWidths=[8*cm, 8*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), ACCENT),
        ("TEXTCOLOR",  (0,0), (-1,0), colors.white),
        ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",   (0,0), (-1,-1), 9),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#f8fafc"), colors.white]),
        ("GRID",       (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ("PADDING",    (0,0), (-1,-1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 12))

    # MITRE
    if report["mitre_techniques"]:
        story.append(Paragraph("MITRE ATT&CK Techniques Observed", h2_style))
        mdata = [["Technique ID", "Technique Name"]]
        for tid, tname in report["mitre_techniques"].items():
            mdata.append([tid, tname])
        mt = Table(mdata, colWidths=[5*cm, 11*cm])
        mt.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#7c3aed")),
            ("TEXTCOLOR",  (0,0), (-1,0), colors.white),
            ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",   (0,0), (-1,-1), 9),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#faf5ff"), colors.white]),
            ("GRID",       (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ("PADDING",    (0,0), (-1,-1), 6),
        ]))
        story.append(mt)
        story.append(Spacer(1, 12))

    # Top IPs
    if report["top_source_ips"]:
        story.append(Paragraph("Top Attacker IPs", h2_style))
        idata = [["Source IP", "Alert Count"]]
        for item in report["top_source_ips"][:8]:
            idata.append([item["ip"], str(item["count"])])
        it = Table(idata, colWidths=[10*cm, 6*cm])
        it.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), RED),
            ("TEXTCOLOR",  (0,0), (-1,0), colors.white),
            ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",   (0,0), (-1,-1), 9),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#fff5f5"), colors.white]),
            ("GRID",       (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ("PADDING",    (0,0), (-1,-1), 6),
        ]))
        story.append(it)
        story.append(Spacer(1, 12))

    # Recent alerts
    story.append(Paragraph("Alert Log (Latest 20)", h2_style))
    adata = [["ID", "Type", "Severity", "Source IP", "Status", "Time"]]
    for a in report["alerts"][:20]:
        adata.append([
            str(a.get("id","")),
            (a.get("alert_type","") or "").replace("_"," ").title()[:20],
            (a.get("severity","") or "").upper(),
            a.get("source_ip","") or "",
            (a.get("status","") or "").upper(),
            (a.get("created_at","") or "")[:16],
        ])
    at = Table(adata, colWidths=[1.2*cm, 4*cm, 2.2*cm, 3.8*cm, 2.5*cm, 4*cm])
    sev_colors_map = {"CRITICAL": RED, "HIGH": ORANGE, "MEDIUM": YELLOW, "LOW": GREEN}
    at.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), DARK),
        ("TEXTCOLOR",  (0,0), (-1,0), colors.white),
        ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",   (0,0), (-1,-1), 7.5),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#f8fafc"), colors.white]),
        ("GRID",       (0,0), (-1,-1), 0.4, colors.HexColor("#e2e8f0")),
        ("PADDING",    (0,0), (-1,-1), 5),
    ]))
    story.append(at)

    # Footer
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GRAY))
    story.append(Paragraph(f"Generated by SIEM AI Guardian | Confidential | {report['generated_at'][:10]}", sub_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
