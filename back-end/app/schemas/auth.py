from pydantic import BaseModel, EmailStr, Field
from app.schemas.user import UserCreate, UserResponse
from uuid import UUID


class Register(UserCreate):
    pass


class Login(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class TokenPayload(BaseModel):
    sub: UUID
    email: str
    name: str


class AuthResponse(BaseModel):
    access_token: str
    user: UserResponse

