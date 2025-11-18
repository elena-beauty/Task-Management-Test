from enum import Enum as PyEnum
from sqlalchemy import Column, String, ForeignKey, Boolean, Enum as SQLEnum, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime
from app.core.database import Base


class NotificationType(PyEnum):
    TODO_CREATED = "todo.created"
    TODO_UPDATED = "todo.updated"
    TODO_DELETED = "todo.deleted"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=True)
    type = Column(SQLEnum(NotificationType, name='notificationtype', native_enum=True), nullable=False)
    message = Column(String, nullable=False)
    read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User")
    team = relationship("Team")

