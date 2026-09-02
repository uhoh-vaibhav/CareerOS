import logging
from typing import Any
import httpx
from app.core.config import settings
from .base import VectorStore

logger = logging.getLogger(__name__)


class PineconeVectorStore(VectorStore):
    """
    Managed vector store backed by Pinecone.

    Unlike Chroma, Pinecone doesn't embed text internally — we call an
    external embedding API (OpenAI text-embedding-3-small by default)
    before upserting/querying.

    Requires:
        pip install pinecone-client

    Config env vars:
        PINECONE_API_KEY       — your Pinecone API key
        PINECONE_INDEX         — index name (default: careeros-career-memory)
        OPENAI_API_KEY         — needed for the embedding step
        OPENAI_EMBEDDING_MODEL — default: text-embedding-3-small
    """

    def __init__(self) -> None:
        try:
            from pinecone import Pinecone  # local import: only required when selected
        except ImportError:
            raise RuntimeError(
                "pinecone-client is not installed. Install it with: "
                "pip install pinecone-client"
            )

        if not settings.pinecone_api_key:
            raise RuntimeError("PINECONE_API_KEY is not set")

        self._pc = Pinecone(api_key=settings.pinecone_api_key)
        self._index = self._pc.Index(settings.pinecone_index)

        # Embedding config — uses OpenAI's embedding API
        if not settings.openai_api_key:
            raise RuntimeError(
                "OPENAI_API_KEY is required for Pinecone (used to generate "
                "embeddings via OpenAI text-embedding API)"
            )
        self._embedding_model = settings.openai_embedding_model
        self._embedding_dimensions = settings.openai_embedding_dimensions
        self._openai_api_key = settings.openai_api_key

        logger.info(
            "Pinecone vector store initialized (index=%s, embedding=%s)",
            settings.pinecone_index,
            self._embedding_model,
        )

    async def _embed(self, text: str) -> list[float]:
        """
        Generate an embedding vector for the given text using OpenAI's
        embedding API. Returns a list of floats.
        """
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/embeddings",
                    headers={"Authorization": f"Bearer {self._openai_api_key}"},
                    json={
                        "model": self._embedding_model,
                        "input": text,
                        "dimensions": self._embedding_dimensions,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                embedding = data["data"][0]["embedding"]
                logger.debug("Embedding generated (%d dimensions)", len(embedding))
                return embedding

        except httpx.HTTPStatusError as e:
            logger.error("OpenAI Embedding API error %s: %s", e.response.status_code, e.response.text[:300])
            raise RuntimeError(f"OpenAI Embedding API returned {e.response.status_code}") from e
        except httpx.TimeoutException:
            logger.error("OpenAI Embedding API timed out")
            raise RuntimeError("OpenAI Embedding API timed out")
        except Exception as e:
            logger.error("Embedding generation failed: %s", e)
            raise

    async def upsert(self, collection: str, id: str, text: str, metadata: dict[str, Any]) -> None:
        try:
            vector = await self._embed(text)
            self._index.upsert(
                vectors=[{
                    "id": id,
                    "values": vector,
                    "metadata": {**metadata, "text": text},
                }],
                namespace=collection,
            )
            logger.debug("Pinecone upsert id=%s into namespace=%s", id, collection)
        except Exception as e:
            logger.error("Pinecone upsert failed: %s", e)
            raise

    async def query(self, collection: str, text: str, top_k: int = 5) -> list[dict[str, Any]]:
        try:
            vector = await self._embed(text)
            result = self._index.query(
                vector=vector,
                top_k=top_k,
                namespace=collection,
                include_metadata=True,
            )

            matches = result.get("matches", [])
            return [
                {
                    "id": m["id"],
                    "text": m.get("metadata", {}).get("text", ""),
                    "metadata": m.get("metadata", {}),
                }
                for m in matches
            ]
        except Exception as e:
            logger.error("Pinecone query failed: %s", e)
            raise
