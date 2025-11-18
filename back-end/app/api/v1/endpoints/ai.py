from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.schemas.ai import AiSuggestionRequest, AiSuggestionResponse, AiChatRequest, AiChatResponse
from app.services.ai_service import AiService

router = APIRouter()
ai_service = AiService()


@router.post("/suggestions", response_model=AiSuggestionResponse)
async def suggest(
    dto: AiSuggestionRequest,
    current_user: dict = Depends(get_current_user),
):
    """Get AI task suggestion"""
    return await ai_service.suggest_task(dto)


@router.post("/chat", response_model=AiChatResponse)
async def chat(
    dto: AiChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """Chat with AI agent and get a short summary response"""
    return await ai_service.chat(dto)

