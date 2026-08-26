import httpx
from app.core.config import settings
from .base import LLMProvider


class GeminiProvider(LLMProvider):
    """Thin wrapper over the Gemini generateContent REST API."""

    def __init__(self) -> None:
        if not settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        self._api_key = settings.gemini_api_key
        self._model = settings.gemini_model

    async def generate(self, prompt: str, *, system: str | None = None) -> str:
        full_prompt = f"{system}\n\n{prompt}" if system else prompt
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self._model}:generateContent?key={self._api_key}"
        )

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                url,
                json={"contents": [{"parts": [{"text": full_prompt}]}]},
            )
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
