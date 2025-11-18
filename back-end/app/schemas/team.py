from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
from uuid import UUID
from app.models.team import TeamRole


class TeamCreate(BaseModel):
    name: str = Field(..., min_length=2)
    description: Optional[str] = None


class TeamResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    owner_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AddTeamMember(BaseModel):
    email: EmailStr
    name: Optional[str] = Field(None, min_length=2)
    role: Optional[TeamRole] = TeamRole.MEMBER


class InviteTeamMember(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    role: Optional[TeamRole] = TeamRole.MEMBER


class TeamMembershipResponse(BaseModel):
    id: UUID
    team_id: UUID
    user_id: UUID
    user_name: str
    role: TeamRole
    created_at: datetime

    class Config:
        from_attributes = True

