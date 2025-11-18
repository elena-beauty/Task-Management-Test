from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.notification import NotificationResponse
from app.services.notification_service import NotificationService
from uuid import UUID

router = APIRouter()


@router.get("", response_model=list[NotificationResponse])
async def list_notifications(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List notifications for current user"""
    return NotificationService.list_for_user(db, UUID(current_user["sub"]))

