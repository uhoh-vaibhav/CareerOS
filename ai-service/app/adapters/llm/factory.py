from functools import lru_cache
from app.core.config import settings
from .base import LLMProvider
from .mock_provider import MockLLMProvider


@lru_cache
def get_llm_provider() -> LLMProvider:
    provider = settings.llm_provider.lower()

    if provider == "openai":
        from .openai_provider import OpenAIProvider
        return OpenAIProvider()

    if provider == "gemini":
        from .gemini_provider import GeminiProvider
        return GeminiProvider()

    # Default: mock — lets the service run with zero configuration.
    return MockLLMProvider()
