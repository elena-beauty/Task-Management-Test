from app.schemas.ai import AiChatRequest, AiChatResponse
from app.core.config import settings
import google.generativeai as genai


class AiService:
    async def chat(self, dto: AiChatRequest) -> AiChatResponse:
        genai.configure(api_key=settings.GOOGLE_AI_API_KEY)
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        
        prompt = f"You are an AI agent, please response shortly around 50-200 text with simple normal text.\n\nUser: {dto.message}\n\nAssistant:"
        response = model.generate_content(prompt)
        content = response.text
        
        return AiChatResponse(
            summary=content.strip(),
            error=None
        )

