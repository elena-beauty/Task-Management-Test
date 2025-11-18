from app.schemas.ai import AiSuggestionRequest, AiSuggestionResponse, AiChatRequest, AiChatResponse
from app.models.todo import TodoStatus
from app.core.config import settings
import json
import os


class AiService:
    def __init__(self):
        self.client = None
        self.model_name = settings.OPENAI_MODEL
        self.is_configured = False
        self._init_openai()
    
    def _init_openai(self):
        """Initialize OpenAI with lazy loading"""
        # Check both settings and environment variable
        api_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
        
        if not api_key:
            print("Warning: OPENAI_API_KEY not found in settings or environment variables")
            self.is_configured = False
            return
        
        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=api_key)
            self.is_configured = True
            print(f"OpenAI initialized successfully with model: {self.model_name}")
        except ImportError:
            print("Warning: openai package not installed. Install it with: pip install openai")
            self.is_configured = False
        except Exception as e:
            print(f"Warning: Failed to initialize OpenAI: {e}")
            self.is_configured = False
    
    def _ensure_configured(self):
        """Ensure OpenAI is configured, try to initialize if not"""
        if not self.is_configured:
            self._init_openai()
        return self.is_configured and self.client is not None

    async def suggest_task(self, dto: AiSuggestionRequest) -> AiSuggestionResponse:
        """Generate AI task suggestion"""
        if not self._ensure_configured():
            return self._build_rules_based_suggestion(dto)

        try:
            system_prompt = (
                "You are an assistant that helps teams manage tasks. "
                "Given a natural language task description and optional team context, "
                "you respond ONLY with a single JSON object matching this structure:\n"
                "{\n"
                '  "titleSuggestion": string; // concise task title (max ~80 chars)\n'
                '  "descriptionSuggestion": string; // multi-line markdown with concrete steps\n'
                '  "recommendedStatus": "backlog" | "in_progress" | "done" | "blocked";\n'
                '  "confidence": number; // between 0 and 1\n'
                '  "reasoning": string; // short explanation of why you chose this status\n'
                "}\n"
                "Do not include any extra keys or text outside the JSON object."
            )
            
            user_prompt = "\n".join(
                [
                    f'Task description: "{dto.prompt}"',
                    f'Team context: "{dto.team_context}"' if dto.team_context else "Team context: (none provided)",
                ]
            )
            
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
            )
            
            content = response.choices[0].message.content
            
            if not content:
                raise ValueError("Empty response from AI provider")

            parsed = json.loads(content)

            if not all(
                key in parsed
                for key in [
                    "titleSuggestion",
                    "descriptionSuggestion",
                    "recommendedStatus",
                    "confidence",
                    "reasoning",
                ]
            ):
                raise ValueError("Invalid AI response shape")

            confidence = max(0, min(1, float(parsed["confidence"])))

            return AiSuggestionResponse(
                title_suggestion=parsed["titleSuggestion"][:80],
                description_suggestion=parsed["descriptionSuggestion"],
                recommended_status=TodoStatus(parsed["recommendedStatus"]),
                confidence=confidence,
                reasoning=parsed["reasoning"],
            )
        except Exception as e:
            # Log error and fall back
            print(f"Error while generating AI suggestion: {e}")
            return self._build_rules_based_suggestion(dto)

    def _build_rules_based_suggestion(
        self, dto: AiSuggestionRequest
    ) -> AiSuggestionResponse:
        """Build a rules-based suggestion as fallback"""
        prompt_lower = dto.prompt.lower()
        has_deadline = any(
            word in prompt_lower
            for word in ["today", "tomorrow", "week", "deadline"]
        )
        is_blocked = any(
            word in prompt_lower
            for word in ["blocked", "stuck", "cannot", "can't"]
        )

        recommended_status = TodoStatus.BACKLOG
        if is_blocked:
            recommended_status = TodoStatus.BLOCKED
        elif "research" in prompt_lower or "start" in prompt_lower:
            recommended_status = TodoStatus.IN_PROGRESS

        description_lines = [
            "Key steps:",
            f"• Coordinate with {dto.team_context}" if dto.team_context else None,
            "• Break the work into 2–5 concrete subtasks",
            "• Prioritize unblockers before the due date" if has_deadline else None,
            "• Identify blockers and who can help resolve them" if is_blocked else None,
        ]
        description_lines = [line for line in description_lines if line]

        confidence = 0.8 if (is_blocked or has_deadline) else 0.5

        return AiSuggestionResponse(
            title_suggestion=dto.prompt[:80],
            description_suggestion="\n".join(description_lines),
            recommended_status=recommended_status,
            confidence=confidence,
            reasoning=(
                "Fell back to a local heuristic because the AI provider response was invalid."
                if self.is_configured
                else "Generated via local heuristic because OpenAI is not configured."
            ),
        )

    async def chat(self, dto: AiChatRequest) -> AiChatResponse:
        """Chat with AI agent and get a short summary response"""
        # Try to ensure OpenAI is configured before proceeding
        if not self._ensure_configured():
            api_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
            error_msg = "OpenAI not configured"
            if not api_key:
                error_detail = "OPENAI_API_KEY not found in environment variables or settings"
            else:
                error_detail = f"Failed to initialize OpenAI. API key found but initialization failed."
            print(f"Chat error: {error_detail}")
            return AiChatResponse(
                summary=f"AI chat is not available. {error_detail}",
                error=error_msg
            )

        try:
            system_prompt = (
                "You are a helpful AI assistant for a team task management system. "
                "When users chat with you, provide concise, actionable responses. "
                "Keep your responses brief and focused - aim for 2-3 sentences maximum. "
                "Be helpful, professional, and provide practical advice related to task management, "
                "team collaboration, and productivity."
            )
            
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": dto.message}
                ],
                max_tokens=150,  # Limit response length for short summaries
                temperature=0.7,
            )
            
            content = response.choices[0].message.content
            
            if not content:
                raise ValueError("Empty response from AI provider")

            return AiChatResponse(
                summary=content.strip(),
                error=None
            )
        except ValueError as e:
            # Log error and return error response
            print(f"Error while generating AI chat response: {e}")
            return AiChatResponse(
                summary="Sorry, I encountered an error processing your message. Please try again.",
                error=str(e)
            )
        except Exception as e:
            # Log error and return error response
            error_msg = str(e)
            print(f"Error while generating AI chat response: {error_msg}")
            # Provide more helpful error messages for common issues
            if "API_KEY" in error_msg or "api key" in error_msg.lower() or "Invalid" in error_msg:
                return AiChatResponse(
                    summary="AI chat is not available. Please check your OPENAI_API_KEY configuration.",
                    error="Invalid API key"
                )
            return AiChatResponse(
                summary="Sorry, I encountered an error processing your message. Please try again.",
                error=error_msg
            )

