from enum import Enum as PyEnum
from sqlalchemy import Column, String, ForeignKey, Enum as SQLEnum, DateTime as SQLDateTime, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime, Text
from app.core.database import Base


class TodoStatus(PyEnum):
    BACKLOG = "backlog"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    BLOCKED = "blocked"


class Todo(Base):
    __tablename__ = "todos"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(SQLDateTime, nullable=True)
    status = Column(SQLEnum(TodoStatus, name='todostatus', native_enum=True), default=TodoStatus.BACKLOG, nullable=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    team = relationship("Team", back_populates="todos")
    assignee = relationship("User", back_populates="assigned_todos", foreign_keys=[assignee_id])

