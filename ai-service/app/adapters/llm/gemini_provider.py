import logging
import httpx
from app.core.config import settings
from .base import LLMProvider

logger = logging.getLogger(__name__)


class GeminiProvider(LLMProvider):
    """
    Production Google Gemini adapter using the REST generateContent API.

    Uses the proper systemInstruction field so the model treats it as a
    system-level directive rather than part of the user prompt.
    """

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

    def __init__(self) -> None:
        if not settings.gemini_api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Set it in .env or as an "
                "environment variable, or switch to LLM_PROVIDER=mock."
            )
        self._api_key = settings.gemini_api_key
        self._model = settings.gemini_model
        logger.info("Gemini LLM provider initialized (model=%s)", self._model)

    async def generate(self, prompt: str, *, system: str | None = None) -> str:
        url = f"{self.BASE_URL}/{self._model}:generateContent?key={self._api_key}"

        # Build request body with proper systemInstruction support
        body: dict = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 2048,
            },
        }

        # Gemini supports systemInstruction as a top-level field
        if system:
            body["systemInstruction"] = {
                "parts": [{"text": system}]
            }

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(url, json=body)
                resp.raise_for_status()
                data = resp.json()

                # Extract text from the response
                candidates = data.get("candidates", [])
                if not candidates:
                    logger.error("Gemini returned no candidates: %s", data)
                    raise RuntimeError("Gemini returned no candidates")

                content = candidates[0]["content"]["parts"][0]["text"]
                logger.debug("Gemini response received (%d chars)", len(content))
                return content

        except httpx.HTTPStatusError as e:
            logger.error("Gemini API error %s: %s", e.response.status_code, e.response.text[:300])
            raise RuntimeError(f"Gemini API returned {e.response.status_code}") from e
        except httpx.TimeoutException:
            logger.error("Gemini API request timed out")
            raise RuntimeError("Gemini API request timed out after 60s")
        except Exception as e:
            logger.error("Gemini unexpected error: %s", e)
            raise
