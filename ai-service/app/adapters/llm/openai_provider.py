import httpx
from app.core.config import settings
from .base import LLMProvider


class OpenAIProvider(LLMProvider):
    """
    Thin wrapper over the OpenAI chat completions API. Uses httpx directly
    rather than the openai SDK to keep the dependency surface small; swap
    in the official SDK later without touching callers of LLMProvider.
    """

    def __init__(self) -> None:
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is not set")
        self._api_key = settings.openai_api_key
        self._model = settings.openai_model

    async def generate(self, prompt: str, *, system: str | None = None) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self._api_key}"},
                json={"model": self._model, "messages": messages},
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
