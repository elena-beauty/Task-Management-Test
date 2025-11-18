from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.team import (
    TeamCreate,
    TeamResponse,
    AddTeamMember,
    InviteTeamMember,
    TeamMembershipResponse,
)
from app.services.team_service import TeamService

router = APIRouter()


@router.get("", response_model=list[dict])
async def get_my_teams(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all teams for current user"""
    return TeamService.get_teams_for_user(db, UUID(current_user["sub"]))


@router.post("", response_model=TeamResponse, status_code=201)
async def create_team(
    dto: TeamCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new team"""
    return TeamService.create_team(db, UUID(current_user["sub"]), dto)


@router.get("/{team_id}/members", response_model=list[TeamMembershipResponse])
async def get_members(
    team_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all members of a team"""
    return TeamService.get_members(db, team_id, UUID(current_user["sub"]))


@router.post("/{team_id}/members", response_model=TeamMembershipResponse)
async def add_member(
    team_id: UUID,
    dto: AddTeamMember,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a member to a team"""
    return TeamService.add_member(db, team_id, UUID(current_user["sub"]), dto)


@router.post("/{team_id}/invite", response_model=TeamMembershipResponse)
async def invite_member(
    team_id: UUID,
    dto: InviteTeamMember,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Invite a member to a team"""
    return TeamService.invite_member(db, team_id, UUID(current_user["sub"]), dto)

