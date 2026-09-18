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
                "maxOutputTokens": 4096,
            },
        }

        # Gemini supports systemInstruction as a top-level field
        if system:
            body["systemInstruction"] = {
                "parts": [{"text": system}]
            }

        import asyncio
        models_to_try = [self._model]
        if "3.1-flash-lite" not in self._model:
            models_to_try.append("gemini-3.1-flash-lite")

        last_err = None
        for current_model in models_to_try:
            url = f"{self.BASE_URL}/{current_model}:generateContent?key={self._api_key}"
            for attempt in range(2):
                try:
                    async with httpx.AsyncClient(timeout=90) as client:
                        resp = await client.post(url, json=body)
                        if resp.status_code in (503, 429):
                            logger.warning("Gemini %s returned %d on attempt %d", current_model, resp.status_code, attempt + 1)
                            await asyncio.sleep(1)
                            continue
                        resp.raise_for_status()
                        data = resp.json()

                        candidates = data.get("candidates", [])
                        if not candidates:
                            logger.error("Gemini returned no candidates: %s", data)
                            raise RuntimeError("Gemini returned no candidates")

                        content = candidates[0]["content"]["parts"][0]["text"]
                        logger.debug("Gemini response received from %s (%d chars)", current_model, len(content))
                        return content

                except (httpx.TimeoutException, httpx.NetworkError) as e:
                    last_err = e
                    logger.warning("Network error for %s on attempt %d: %s", current_model, attempt + 1, e)
                    await asyncio.sleep(1)
                except httpx.HTTPStatusError as e:
                    last_err = e
                    if e.response.status_code not in (503, 429):
                        logger.error("Gemini %s API error %s: %s", current_model, e.response.status_code, e.response.text[:300])
                        raise RuntimeError(f"Gemini API returned {e.response.status_code}") from e
                except Exception as e:
                    last_err = e
                    logger.error("Gemini unexpected error: %s", e)
                    raise

        raise RuntimeError(f"Gemini API failed across models {models_to_try}: {last_err}")
