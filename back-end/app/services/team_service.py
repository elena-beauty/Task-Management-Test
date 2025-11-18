from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from uuid import UUID
from app.models.team import Team, TeamMembership, TeamRole
from app.models.user import User
from app.schemas.team import TeamCreate, AddTeamMember, InviteTeamMember
from app.services.user_service import UserService


class TeamService:
    @staticmethod
    def create_team(db: Session, owner_id: UUID, dto: TeamCreate) -> Team:
        """Create a new team"""
        owner = UserService.find_by_id(db, owner_id)
        team = Team(
            name=dto.name,
            description=dto.description,
            owner_id=owner.id,
        )
        db.add(team)
        db.commit()
        db.refresh(team)

        # Create owner membership
        membership = TeamMembership(
            team_id=team.id,
            user_id=owner.id,
            role=TeamRole.OWNER,
        )
        db.add(membership)
        db.commit()
        db.refresh(team)
        return team

    @staticmethod
    def find_team_by_id(db: Session, team_id: UUID, user_id: UUID) -> Team:
        """Find team by ID with access check"""
        TeamService._ensure_membership(db, team_id, user_id)
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found",
            )
        return team

    @staticmethod
    def get_teams_for_user(db: Session, user_id: UUID) -> list[dict]:
        """Get all teams for a user"""
        from sqlalchemy.orm import joinedload
        memberships = (
            db.query(TeamMembership)
            .options(joinedload(TeamMembership.team).joinedload(Team.owner))
            .filter(TeamMembership.user_id == user_id)
            .order_by(TeamMembership.created_at)
            .all()
        )
        result = []
        for membership in memberships:
            team_dict = {
                "id": membership.team.id,
                "name": membership.team.name,
                "description": membership.team.description,
                "owner_id": membership.team.owner_id,
                "created_at": membership.team.created_at,
                "updated_at": membership.team.updated_at,
                "role": membership.role,
            }
            result.append(team_dict)
        return result

    @staticmethod
    def add_member(
        db: Session, team_id: UUID, actor_id: UUID, dto: AddTeamMember
    ) -> dict:
        """Add a member to a team"""
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found",
            )

        actor = (
            db.query(TeamMembership)
            .filter(
                TeamMembership.team_id == team_id,
                TeamMembership.user_id == actor_id,
            )
            .first()
        )
        if not actor or actor.role != TeamRole.OWNER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only team owners can add members",
            )

        user = UserService.find_by_email(db, dto.email)
        if not user:
            # Auto-create user with default password
            from app.schemas.user import UserCreate
            user = UserService.create_user(
                db,
                UserCreate(
                    name=dto.name or dto.email,
                    email=dto.email,
                    password="Passw0rd!",
                ),
            )

        from sqlalchemy.orm import joinedload
        existing = (
            db.query(TeamMembership)
            .options(joinedload(TeamMembership.user))
            .filter(
                TeamMembership.team_id == team_id,
                TeamMembership.user_id == user.id,
            )
            .first()
        )
        if existing:
            return {
                "id": existing.id,
                "team_id": existing.team_id,
                "user_id": existing.user_id,
                "user_name": existing.user.name,
                "role": existing.role,
                "created_at": existing.created_at,
            }

        membership = TeamMembership(
            team_id=team_id,
            user_id=user.id,
            role=dto.role or TeamRole.MEMBER,
        )
        db.add(membership)
        db.commit()
        db.refresh(membership)
        # Reload with user relationship
        membership = (
            db.query(TeamMembership)
            .options(joinedload(TeamMembership.user))
            .filter(TeamMembership.id == membership.id)
            .first()
        )
        return {
            "id": membership.id,
            "team_id": membership.team_id,
            "user_id": membership.user_id,
            "user_name": membership.user.name,
            "role": membership.role,
            "created_at": membership.created_at,
        }

    @staticmethod
    def invite_member(
        db: Session, team_id: UUID, actor_id: UUID, dto: InviteTeamMember
    ) -> dict:
        """Invite a member to a team"""
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found",
            )

        actor = (
            db.query(TeamMembership)
            .filter(
                TeamMembership.team_id == team_id,
                TeamMembership.user_id == actor_id,
            )
            .first()
        )
        if not actor or actor.role != TeamRole.OWNER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only team owners can invite members",
            )

        user = UserService.find_by_email(db, dto.email)
        if not user:
            # Create user with default password
            from app.schemas.user import UserCreate
            user = UserService.create_user(
                db,
                UserCreate(
                    name=dto.name,
                    email=dto.email,
                    password="Passw0rd!",
                ),
            )

        from sqlalchemy.orm import joinedload
        existing = (
            db.query(TeamMembership)
            .options(joinedload(TeamMembership.user))
            .filter(
                TeamMembership.team_id == team_id,
                TeamMembership.user_id == user.id,
            )
            .first()
        )
        if existing:
            return {
                "id": existing.id,
                "team_id": existing.team_id,
                "user_id": existing.user_id,
                "user_name": existing.user.name,
                "role": existing.role,
                "created_at": existing.created_at,
            }

        membership = TeamMembership(
            team_id=team_id,
            user_id=user.id,
            role=dto.role or TeamRole.MEMBER,
        )
        db.add(membership)
        db.commit()
        db.refresh(membership)
        # Reload with user relationship
        membership = (
            db.query(TeamMembership)
            .options(joinedload(TeamMembership.user))
            .filter(TeamMembership.id == membership.id)
            .first()
        )
        return {
            "id": membership.id,
            "team_id": membership.team_id,
            "user_id": membership.user_id,
            "user_name": membership.user.name,
            "role": membership.role,
            "created_at": membership.created_at,
        }

    @staticmethod
    def get_members(db: Session, team_id: UUID, user_id: UUID) -> list[dict]:
        """Get all members of a team"""
        TeamService._ensure_membership(db, team_id, user_id)
        from sqlalchemy.orm import joinedload
        memberships = (
            db.query(TeamMembership)
            .options(joinedload(TeamMembership.user))
            .filter(TeamMembership.team_id == team_id)
            .order_by(TeamMembership.created_at)
            .all()
        )
        result = []
        for membership in memberships:
            result.append({
                "id": membership.id,
                "team_id": membership.team_id,
                "user_id": membership.user_id,
                "user_name": membership.user.name,
                "role": membership.role,
                "created_at": membership.created_at,
            })
        return result

    @staticmethod
    def _ensure_membership(db: Session, team_id: UUID, user_id: UUID) -> TeamMembership:
        """Ensure user is a member of the team"""
        membership = (
            db.query(TeamMembership)
            .filter(
                TeamMembership.team_id == team_id,
                TeamMembership.user_id == user_id,
            )
            .first()
        )
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this team",
            )
        return membership

