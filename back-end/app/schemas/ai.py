from pydantic import BaseModel, Field
from typing import Optional
from app.models.todo import TodoStatus


class AiSuggestionRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    team_context: Optional[str] = None


class AiSuggestionResponse(BaseModel):
    title_suggestion: str
    description_suggestion: str
    recommended_status: TodoStatus
    confidence: float = Field(..., ge=0, le=1)
    reasoning: str


class AiChatRequest(BaseModel):
    message: str = Field(..., min_length=1)


class AiChatResponse(BaseModel):
    summary: str
    error: Optional[str] = None

