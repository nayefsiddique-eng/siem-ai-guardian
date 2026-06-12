from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.alert import Alert
from app.models.user import User
from app.services.report_service import generate_report_data, generate_pdf

router = APIRouter()


@router.get("/", summary="Generate JSON incident report")
async def get_report(
    limit: int = Query(default=100, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Alert)
        .order_by(desc(Alert.created_at))
        .limit(limit)
    )

    alerts = [a.to_dict() for a in result.scalars().all()]

    return generate_report_data(alerts)


@router.get("/pdf", summary="Download PDF incident report")
async def get_pdf_report(
    limit: int = Query(default=100, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Alert)
        .order_by(desc(Alert.created_at))
        .limit(limit)
    )

    alerts = [a.to_dict() for a in result.scalars().all()]

    report = generate_report_data(alerts)

    pdf_bytes = generate_pdf(report)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
            f"attachment; filename=siem-report-{report['report_id']}.pdf"
        },
    )



