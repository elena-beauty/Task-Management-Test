from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from uuid import UUID
from app.models.todo import Todo, TodoStatus
from app.models.team import Team, TeamMembership
from app.models.user import User
from app.models.notification import Notification, NotificationType
from app.schemas.todo import TodoCreate, TodoUpdate, TodoResponse
from app.services.team_service import TeamService
from app.services.notification_service import NotificationService
from app.realtime.gateway import RealtimeGateway
import asyncio


class TodoService:
    @staticmethod
    def create(
        db: Session,
        user_id: UUID,
        dto: TodoCreate,
        realtime_gateway: RealtimeGateway,
        notification_service: NotificationService,
    ) -> Todo:
        """Create a new todo"""
        membership = TeamService._ensure_membership(db, dto.team_id, user_id)
        team = membership.team

        assignee = None
        if dto.assignee_id:
            TeamService._ensure_membership(db, dto.team_id, dto.assignee_id)
            assignee = db.query(User).filter(User.id == dto.assignee_id).first()

        todo = Todo(
            title=dto.title,
            description=dto.description,
            status=dto.status or TodoStatus.BACKLOG,
            due_date=dto.due_date,
            team_id=team.id,
            assignee_id=assignee.id if assignee else None,
        )
        db.add(todo)
        db.commit()
        db.refresh(todo)

        # Load relationships including team owner
        db.refresh(todo, ["team", "assignee"])
        if todo.team and todo.team.owner_id:
            # Load team owner if not already loaded
            from sqlalchemy.orm import joinedload
            team_with_owner = (
                db.query(Team)
                .options(joinedload(Team.owner))
                .filter(Team.id == todo.team.id)
                .first()
            )
            if team_with_owner:
                todo.team = team_with_owner

        # Convert to response schema for websocket payload
        todo_response = TodoResponse.model_validate(todo)
        todo_dict = todo_response.model_dump(mode="json")
        
        # Convert UUIDs and dates to strings for JSON serialization
        todo_dict["id"] = str(todo_dict["id"])
        todo_dict["team_id"] = str(todo_dict["team_id"])
        if todo_dict.get("assignee_id"):
            todo_dict["assignee_id"] = str(todo_dict["assignee_id"])
        if todo_dict.get("assignee"):
            todo_dict["assignee"]["id"] = str(todo_dict["assignee"]["id"])
        if todo_dict.get("team"):
            todo_dict["team"]["id"] = str(todo_dict["team"]["id"])
            if todo_dict["team"].get("owner_id"):
                todo_dict["team"]["owner_id"] = str(todo_dict["team"]["owner_id"])
            # Add owner object if available
            if todo.team and todo.team.owner:
                todo_dict["team"]["owner"] = {
                    "id": str(todo.team.owner.id),
                    "email": todo.team.owner.email,
                    "name": todo.team.owner.name,
                }

        # Broadcast realtime event (fire and forget)
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                task = asyncio.create_task(
                    realtime_gateway.broadcast_todo_change(team.id, "todo.created", todo_dict)
                )
                print(f"Created async task to broadcast todo.created for team {team.id}")
            else:
                asyncio.run(
                    realtime_gateway.broadcast_todo_change(team.id, "todo.created", todo_dict)
                )
        except Exception as e:
            print(f"Error creating broadcast task for todo.created: {e}")
            import traceback
            traceback.print_exc()

        # Notify assignee if different from creator
        if todo.assignee_id and todo.assignee_id != user_id:
            notification_service.create_for_users(
                db,
                user_ids=[todo.assignee_id],
                team=team,
                notification_type=NotificationType.TODO_CREATED,
                message=f'You were assigned task "{todo.title}"',
                realtime_gateway=realtime_gateway,
            )

        return TodoService.find_one(db, todo.id, user_id)

    @staticmethod
    def find_all_for_team(db: Session, team_id: UUID, user_id: UUID) -> list[Todo]:
        """Get all todos for a team"""
        TeamService._ensure_membership(db, team_id, user_id)
        return (
            db.query(Todo)
            .options(joinedload(Todo.assignee), joinedload(Todo.team))
            .filter(Todo.team_id == team_id)
            .order_by(Todo.due_date.asc().nullslast(), Todo.created_at.desc())
            .all()
        )

    @staticmethod
    def find_one(db: Session, todo_id: UUID, user_id: UUID) -> Todo:
        """Get a single todo"""
        todo = (
            db.query(Todo)
            .options(joinedload(Todo.assignee), joinedload(Todo.team))
            .filter(Todo.id == todo_id)
            .first()
        )
        if not todo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Todo not found",
            )
        TeamService._ensure_membership(db, todo.team_id, user_id)
        return todo

    @staticmethod
    def update(
        db: Session,
        todo_id: UUID,
        user_id: UUID,
        dto: TodoUpdate,
        realtime_gateway: RealtimeGateway,
        notification_service: NotificationService,
    ) -> Todo:
        """Update a todo"""
        todo = TodoService.find_one(db, todo_id, user_id)
        previous_assignee_id = todo.assignee_id

        if dto.assignee_id is not None:
            TeamService._ensure_membership(db, todo.team_id, dto.assignee_id)
            todo.assignee_id = dto.assignee_id

        if dto.title is not None:
            todo.title = dto.title
        if dto.description is not None:
            todo.description = dto.description
        if dto.status is not None:
            todo.status = dto.status
        if dto.due_date is not None:
            todo.due_date = dto.due_date

        db.commit()
        db.refresh(todo, ["team", "assignee"])
        
        # Load team owner if not already loaded
        if todo.team and todo.team.owner_id:
            from sqlalchemy.orm import joinedload
            team_with_owner = (
                db.query(Team)
                .options(joinedload(Team.owner))
                .filter(Team.id == todo.team.id)
                .first()
            )
            if team_with_owner:
                todo.team = team_with_owner

        # Convert to response schema for websocket payload
        todo_response = TodoResponse.model_validate(todo)
        todo_dict = todo_response.model_dump(mode="json")
        
        # Convert UUIDs and dates to strings for JSON serialization
        todo_dict["id"] = str(todo_dict["id"])
        todo_dict["team_id"] = str(todo_dict["team_id"])
        if todo_dict.get("assignee_id"):
            todo_dict["assignee_id"] = str(todo_dict["assignee_id"])
        if todo_dict.get("assignee"):
            todo_dict["assignee"]["id"] = str(todo_dict["assignee"]["id"])
        if todo_dict.get("team"):
            todo_dict["team"]["id"] = str(todo_dict["team"]["id"])
            if todo_dict["team"].get("owner_id"):
                todo_dict["team"]["owner_id"] = str(todo_dict["team"]["owner_id"])
            # Add owner object if available
            if todo.team and todo.team.owner:
                todo_dict["team"]["owner"] = {
                    "id": str(todo.team.owner.id),
                    "email": todo.team.owner.email,
                    "name": todo.team.owner.name,
                }

        # Broadcast realtime event (fire and forget)
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                task = asyncio.create_task(
                    realtime_gateway.broadcast_todo_change(todo.team_id, "todo.updated", todo_dict)
                )
                print(f"Created async task to broadcast todo.updated for team {todo.team_id}")
            else:
                asyncio.run(
                    realtime_gateway.broadcast_todo_change(todo.team_id, "todo.updated", todo_dict)
                )
        except Exception as e:
            print(f"Error creating broadcast task for todo.updated: {e}")
            import traceback
            traceback.print_exc()

        current_assignee_id = todo.assignee_id

        # Notify current assignee if different from actor
        if current_assignee_id and current_assignee_id != user_id:
            notification_service.create_for_users(
                db,
                user_ids=[current_assignee_id],
                team=todo.team,
                notification_type=NotificationType.TODO_UPDATED,
                message=f'Task "{todo.title}" was updated',
                realtime_gateway=realtime_gateway,
            )

        # Notify new assignee if changed
        if (
            current_assignee_id
            and previous_assignee_id != current_assignee_id
            and current_assignee_id != user_id
        ):
            notification_service.create_for_users(
                db,
                user_ids=[current_assignee_id],
                team=todo.team,
                notification_type=NotificationType.TODO_UPDATED,
                message=f'You were assigned task "{todo.title}"',
                realtime_gateway=realtime_gateway,
            )

        return todo

    @staticmethod
    def remove(
        db: Session,
        todo_id: UUID,
        user_id: UUID,
        realtime_gateway: RealtimeGateway,
        notification_service: NotificationService,
    ) -> dict:
        """Delete a todo"""
        todo = TodoService.find_one(db, todo_id, user_id)
        assignee_id = todo.assignee_id
        team_id = todo.team_id

        db.delete(todo)
        db.commit()

        # Broadcast realtime event (fire and forget)
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                task = asyncio.create_task(
                    realtime_gateway.broadcast_todo_change(
                        team_id, "todo.deleted", {"id": str(todo_id), "team_id": str(team_id)}
                    )
                )
                print(f"Created async task to broadcast todo.deleted for team {team_id}")
            else:
                asyncio.run(
                    realtime_gateway.broadcast_todo_change(
                        team_id, "todo.deleted", {"id": str(todo_id), "team_id": str(team_id)}
                    )
                )
        except Exception as e:
            print(f"Error creating broadcast task for todo.deleted: {e}")
            import traceback
            traceback.print_exc()

        # Notify assignee if different from actor
        if assignee_id and assignee_id != user_id:
            notification_service.create_for_users(
                db,
                user_ids=[assignee_id],
                team=todo.team,
                notification_type=NotificationType.TODO_DELETED,
                message=f'Task "{todo.title}" was deleted',
                realtime_gateway=realtime_gateway,
            )

        return {"deleted": True}

