from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.todo import TodoCreate, TodoUpdate, TodoResponse
from app.services.todo_service import TodoService
from app.services.notification_service import NotificationService
from app.realtime.gateway import get_realtime_gateway

router = APIRouter()


@router.get("", response_model=list[TodoResponse])
async def find_by_team(
    team_id: UUID = Query(..., alias="teamId"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all todos for a team"""
    return TodoService.find_all_for_team(db, team_id, UUID(current_user["sub"]))


@router.post("", response_model=TodoResponse, status_code=201)
async def create(
    dto: TodoCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new todo"""
    realtime_gateway = get_realtime_gateway()
    notification_service = NotificationService()
    return TodoService.create(
        db, UUID(current_user["sub"]), dto, realtime_gateway, notification_service
    )


@router.get("/{id}", response_model=TodoResponse)
async def find_one(
    id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single todo"""
    return TodoService.find_one(db, id, UUID(current_user["sub"]))


@router.patch("/{id}", response_model=TodoResponse)
async def update(
    id: UUID,
    dto: TodoUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a todo"""
    realtime_gateway = get_realtime_gateway()
    notification_service = NotificationService()
    return TodoService.update(
        db, id, UUID(current_user["sub"]), dto, realtime_gateway, notification_service
    )


@router.delete("/{id}")
async def remove(
    id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a todo"""
    realtime_gateway = get_realtime_gateway()
    notification_service = NotificationService()
    return TodoService.remove(
        db, id, UUID(current_user["sub"]), realtime_gateway, notification_service
    )

