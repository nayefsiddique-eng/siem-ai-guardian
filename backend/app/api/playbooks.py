from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.models.alert import Alert
from app.services.playbook_service import (
    generate_playbook,
    approve_playbook,
    reject_playbook,
)

router = APIRouter()

# In-memory playbook store
_playbooks: dict = {}


class RejectRequest(BaseModel):
    reason: str


@router.post("/{alert_id}/generate", summary="Generate AI playbook for an alert")
async def generate(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id)
    )

    alert = result.scalar_one_or_none()

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found."
        )

    playbook = await generate_playbook(alert)

    _playbooks[alert_id] = playbook

    return playbook


@router.get("/{alert_id}", summary="Get playbook for an alert")
async def get_playbook(alert_id: int):

    playbook = _playbooks.get(alert_id)

    if not playbook:
        raise HTTPException(
            status_code=404,
            detail="No playbook generated for this alert yet."
        )

    return playbook


@router.post("/{alert_id}/approve", summary="Approve playbook")
async def approve(alert_id: int):

    playbook = _playbooks.get(alert_id)

    if not playbook:
        raise HTTPException(
            status_code=404,
            detail="No playbook found."
        )

    if playbook["status"] != "pending_approval":
        raise HTTPException(
            status_code=400,
            detail=f"Playbook already {playbook['status']}."
        )

    updated = approve_playbook(
        playbook,
        approved_by="system"
    )

    _playbooks[alert_id] = updated

    return {
        "status": "approved",
        "playbook": updated,
    }


@router.post("/{alert_id}/reject", summary="Reject playbook")
async def reject(
    alert_id: int,
    payload: RejectRequest,
):

    playbook = _playbooks.get(alert_id)

    if not playbook:
        raise HTTPException(
            status_code=404,
            detail="No playbook found."
        )

    updated = reject_playbook(
        playbook,
        rejected_by="system",
        reason=payload.reason,
    )

    _playbooks[alert_id] = updated

    return {
        "status": "rejected",
        "playbook": updated,
    }