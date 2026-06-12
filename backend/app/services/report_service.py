from datetime import datetime, timezone
import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)


def generate_report_data(alerts: list, tenant_name="SIEM AI Guardian") -> dict:
    now = datetime.now(timezone.utc)

    severity_counts = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
    }

    type_counts = {}
    mitre_techniques = {}

    for a in alerts:
        sev = a.get("severity", "low")
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

        atype = a.get("alert_type", "unknown")
        type_counts[atype] = type_counts.get(atype, 0) + 1

        if a.get("mitre_technique_id") and a.get("mitre_technique_name"):
            mitre_techniques[a["mitre_technique_id"]] = a["mitre_technique_name"]

    resolved = sum(1 for a in alerts if a.get("status") == "resolved")
    open_count = sum(1 for a in alerts if a.get("status") == "open")

    return {
        "report_id": f"RPT-{now.strftime('%Y%m%d-%H%M%S')}",
        "generated_at": now.isoformat(),
        "tenant": tenant_name,
        "summary": {
            "total_alerts": len(alerts),
            "open": open_count,
            "resolved": resolved,
        },
        "severity_breakdown": severity_counts,
        "attack_types": type_counts,
        "mitre_techniques": mitre_techniques,
        "alerts": alerts[:50],
    }


def generate_pdf(report: dict) -> bytes:

    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "title",
        fontSize=20,
        textColor=colors.HexColor("#0ea5e9"),
        fontName="Helvetica-Bold",
        alignment=TA_LEFT,
    )

    story = []

    story.append(Paragraph("SIEM AI Guardian", title_style))
    story.append(Spacer(1, 12))

    summary = report["summary"]

    data = [
        ["Metric", "Value"],
        ["Total Alerts", str(summary["total_alerts"])],
        ["Open Alerts", str(summary["open"])],
        ["Resolved Alerts", str(summary["resolved"])],
    ]

    table = Table(data)

    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0ea5e9")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )

    story.append(table)

    story.append(Spacer(1, 20))

    story.append(
        Paragraph(
            f"Generated: {report['generated_at']}",
            styles["BodyText"],
        )
    )

    story.append(HRFlowable())

    doc.build(story)

    buffer.seek(0)

    return buffer.read()



