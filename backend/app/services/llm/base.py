from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class LLMMessage(BaseModel):
    role: str = Field(..., description="Role: 'system', 'user', or 'assistant'")
    content: str = Field(..., description="Message text content")


class LLMResponse(BaseModel):
    content: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    model: str = ""
    raw_metadata: Dict[str, Any] = Field(default_factory=dict)


class LLMProvider(ABC):
    """Abstract interface for LLM providers (e.g. Gemini, OpenAI, Claude)."""

    @abstractmethod
    async def generate_response(
        self,
        messages: List[LLMMessage],
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> LLMResponse:
        """Generate a response from the model given the conversation history."""
        pass

    @abstractmethod
    async def generate_embeddings(
        self,
        texts: List[str],
    ) -> List[List[float]]:
        """Generate vector embeddings for retrieval."""
        pass
