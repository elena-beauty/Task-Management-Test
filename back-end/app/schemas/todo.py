from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from uuid import UUID
from app.models.todo import TodoStatus
from app.schemas.user import UserResponse
from app.schemas.team import TeamResponse


class TodoCreate(BaseModel):
    title: str = Field(..., min_length=2)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[TodoStatus] = TodoStatus.BACKLOG
    team_id: UUID
    assignee_id: Optional[UUID] = None


class TodoUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[TodoStatus] = None
    assignee_id: Optional[UUID] = None


class TodoResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    due_date: Optional[datetime]
    status: TodoStatus
    team_id: UUID
    assignee_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    team: Optional[TeamResponse] = None
    assignee: Optional[UserResponse] = None

    class Config:
        from_attributes = True

