from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from uuid import UUID
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, verify_password


class UserService:
    @staticmethod
    def create_user(db: Session, dto: UserCreate) -> User:
        """Create a new user"""
        existing = db.query(User).filter(User.email == dto.email.lower()).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already in use",
            )
        
        password_hash = get_password_hash(dto.password)
        user = User(
            email=dto.email.lower(),
            name=dto.name,
            password_hash=password_hash,
        )
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
            return user
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already in use",
            )

    @staticmethod
    def validate_user(db: Session, email: str, password: str) -> User | None:
        """Validate user credentials"""
        user = db.query(User).filter(User.email == email.lower()).first()
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    @staticmethod
    def find_by_email(db: Session, email: str) -> User | None:
        """Find user by email"""
        return db.query(User).filter(User.email == email.lower()).first()

    @staticmethod
    def find_by_id(db: Session, user_id: UUID) -> User:
        """Find user by ID"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user

