from sqlalchemy.orm import Session
from datetime import timedelta
from app.services.user_service import UserService
from app.schemas.auth import Register, Login, AuthResponse, TokenPayload
from app.schemas.user import UserResponse
from app.core.security import create_access_token
from app.core.config import settings


class AuthService:
    @staticmethod
    def register(db: Session, dto: Register) -> AuthResponse:
        """Register a new user"""
        user = UserService.create_user(db, dto)
        return AuthService._build_auth_response(user)

    @staticmethod
    def login(db: Session, dto: Login) -> AuthResponse:
        """Login user"""
        user = UserService.validate_user(db, dto.email, dto.password)
        if not user:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )
        return AuthService._build_auth_response(user)

    @staticmethod
    def _build_auth_response(user) -> AuthResponse:
        """Build authentication response with JWT token"""
        payload = TokenPayload(
            sub=user.id,
            email=user.email,
            name=user.name,
        )
        access_token = create_access_token(
            payload.model_dump(),
            expires_delta=timedelta(hours=settings.JWT_EXPIRATION_HOURS),
        )
        return AuthResponse(
            access_token=access_token,
            user=UserResponse.model_validate(user),
        )

