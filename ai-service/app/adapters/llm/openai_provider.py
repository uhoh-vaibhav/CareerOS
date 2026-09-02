import logging
import httpx
from app.core.config import settings
from .base import LLMProvider

logger = logging.getLogger(__name__)


class OpenAIProvider(LLMProvider):
    """
    Production OpenAI adapter using the Chat Completions API.

    Uses httpx directly rather than the openai SDK to keep the dependency
    surface small; swap in the official SDK later without touching callers.
    """

    API_URL = "https://api.openai.com/v1/chat/completions"

    def __init__(self) -> None:
        if not settings.openai_api_key:
            raise RuntimeError(
                "OPENAI_API_KEY is not set. Set it in .env or as an "
                "environment variable, or switch to LLM_PROVIDER=mock."
            )
        self._api_key = settings.openai_api_key
        self._model = settings.openai_model
        logger.info("OpenAI LLM provider initialized (model=%s)", self._model)

    async def generate(self, prompt: str, *, system: str | None = None) -> str:
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    self.API_URL,
                    headers={"Authorization": f"Bearer {self._api_key}"},
                    json={
                        "model": self._model,
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 2048,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                logger.debug("OpenAI response received (%d chars)", len(content))
                return content

        except httpx.HTTPStatusError as e:
            logger.error("OpenAI API error %s: %s", e.response.status_code, e.response.text[:300])
            raise RuntimeError(f"OpenAI API returned {e.response.status_code}") from e
        except httpx.TimeoutException:
            logger.error("OpenAI API request timed out")
            raise RuntimeError("OpenAI API request timed out after 60s")
        except Exception as e:
            logger.error("OpenAI unexpected error: %s", e)
            raise
