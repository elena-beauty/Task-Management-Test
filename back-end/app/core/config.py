from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    # Database
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "team_tasks"
    
    # JWT
    JWT_SECRET: str = "super-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # Google AI Studio (Gemini)
    GOOGLE_AI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "models/gemini-2.0-flash"
    
    # Server
    PORT: int = 5000
    DEBUG: bool = True
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()

