from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.auth import Register, Login, AuthResponse, TokenPayload
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(dto: Register, db: Session = Depends(get_db)):
    """Register a new user"""
    return AuthService.register(db, dto)


@router.post("/login", response_model=AuthResponse)
async def login(dto: Login, db: Session = Depends(get_db)):
    """Login user"""
    return AuthService.login(db, dto)


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    return {"user": current_user}

