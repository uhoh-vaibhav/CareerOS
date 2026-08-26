from .base import LLMProvider


class MockLLMProvider(LLMProvider):
    """Deterministic stand-in so the service runs end-to-end with no API key."""

    async def generate(self, prompt: str, *, system: str | None = None) -> str:
        preview = prompt.strip().replace("\n", " ")[:120]
        return f"[mock-llm response] Echo of prompt: {preview}"
