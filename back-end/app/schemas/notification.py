from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID
from app.models.notification import NotificationType


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    team_id: Optional[UUID]
    type: NotificationType
    message: str
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True

