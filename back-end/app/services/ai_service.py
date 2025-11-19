from app.schemas.ai import AiChatRequest, AiChatResponse, AiSuggestionRequest, AiSuggestionResponse
from app.core.config import settings
from app.models.todo import TodoStatus
import logging

logger = logging.getLogger(__name__)

# Try to import google.generativeai, but handle if it's not available
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("google.generativeai not available. AI features will use fallback heuristics.")


class AiService:
    async def suggest_task(self, dto: AiSuggestionRequest) -> AiSuggestionResponse:
        """Get AI task suggestion or use heuristic fallback"""
        # Try to use Google AI if available and API key is set
        if GENAI_AVAILABLE and settings.GOOGLE_AI_API_KEY:
            try:
                genai.configure(api_key=settings.GOOGLE_AI_API_KEY)
                model = genai.GenerativeModel(settings.GEMINI_MODEL)
                
                context = f"Team context: {dto.team_context}\n\n" if dto.team_context else ""
                prompt = (
                    f"{context}User wants to create a task with the following description: {dto.prompt}\n\n"
                    f"Please suggest:\n"
                    f"1. A concise task title (5-10 words)\n"
                    f"2. A detailed description\n"
                    f"3. Recommended status (backlog, in_progress, done, or blocked)\n"
                    f"4. Brief reasoning for your suggestions"
                )
                
                response = model.generate_content(prompt)
                content = response.text
                
                # Parse the AI response (simplified - in production you'd want more robust parsing)
                lines = content.strip().split('\n')
                title_suggestion = lines[0].strip() if lines else dto.prompt[:50]
                description_suggestion = '\n'.join(lines[1:]) if len(lines) > 1 else dto.prompt
                
                # Default to backlog if we can't determine status from response
                recommended_status = TodoStatus.BACKLOG
                if 'in_progress' in content.lower() or 'in progress' in content.lower():
                    recommended_status = TodoStatus.IN_PROGRESS
                elif 'done' in content.lower() or 'completed' in content.lower():
                    recommended_status = TodoStatus.DONE
                elif 'blocked' in content.lower():
                    recommended_status = TodoStatus.BLOCKED
                
                return AiSuggestionResponse(
                    title_suggestion=title_suggestion[:200],
                    description_suggestion=description_suggestion[:1000],
                    recommended_status=recommended_status,
                    confidence=0.8,
                    reasoning=content[:500] if len(content) > 500 else content
                )
            except Exception as e:
                logger.warning(f"AI service error: {e}. Using fallback.")
                # Fall through to fallback
        
        # Fallback: Use simple heuristics
        return self._heuristic_fallback(dto)
    
    def _heuristic_fallback(self, dto: AiSuggestionRequest) -> AiSuggestionResponse:
        """Generate suggestions using simple heuristics when AI is unavailable"""
        prompt_lower = dto.prompt.lower()
        
        # Determine status based on keywords
        if any(keyword in prompt_lower for keyword in ['urgent', 'asap', 'immediately', 'critical']):
            recommended_status = TodoStatus.IN_PROGRESS
            confidence = 0.7
        elif any(keyword in prompt_lower for keyword in ['done', 'completed', 'finished']):
            recommended_status = TodoStatus.DONE
            confidence = 0.6
        elif any(keyword in prompt_lower for keyword in ['blocked', 'stuck', 'cannot', "can't", 'waiting']):
            recommended_status = TodoStatus.BLOCKED
            confidence = 0.7
        else:
            recommended_status = TodoStatus.BACKLOG
            confidence = 0.6
        
        # Generate title (first sentence or first 50 chars)
        title_suggestion = dto.prompt.split('.')[0].strip()[:50]
        if not title_suggestion:
            title_suggestion = dto.prompt[:50]
        
        # Generate description
        description_suggestion = dto.prompt
        if dto.team_context:
            description_suggestion = f"[{dto.team_context}] {description_suggestion}"
        
        reasoning = f"Heuristic analysis based on prompt keywords. Recommended status: {recommended_status.value}."
        
        return AiSuggestionResponse(
            title_suggestion=title_suggestion,
            description_suggestion=description_suggestion,
            recommended_status=recommended_status,
            confidence=confidence,
            reasoning=reasoning
        )
    
    async def chat(self, dto: AiChatRequest) -> AiChatResponse:
        """Chat with AI agent or use fallback"""
        # Try to use Google AI if available and API key is set
        if GENAI_AVAILABLE and settings.GOOGLE_AI_API_KEY:
            try:
                genai.configure(api_key=settings.GOOGLE_AI_API_KEY)
                model = genai.GenerativeModel(settings.GEMINI_MODEL)
                
                prompt = f"You are an AI agent, please response shortly around 50-200 text with simple normal text.\n\nUser: {dto.message}\n\nAssistant:"
                response = model.generate_content(prompt)
                content = response.text
                
                return AiChatResponse(
                    summary=content.strip(),
                    error=None
                )
            except Exception as e:
                logger.warning(f"AI service error: {e}. Using fallback.")
                return AiChatResponse(
                    summary="I apologize, but I'm currently unable to process your request. Please try again later or check if the AI service is properly configured.",
                    error=str(e)
                )
        
        # Fallback response
        return AiChatResponse(
            summary="AI service is not available. Please configure the GOOGLE_AI_API_KEY to enable AI features.",
            error="AI service not configured"
        )

