from typing import Any
from app.core.config import settings
from .base import VectorStore


class PineconeVectorStore(VectorStore):
    """
    Managed vector store backed by Pinecone. Requires the `pinecone-client`
    package plus an embedding step (Pinecone does not embed text for you the
    way Chroma's default client does) — wire in an embedding call in
    `_embed` when this adapter is actually selected via VECTOR_STORE=pinecone.
    """

    def __init__(self) -> None:
        from pinecone import Pinecone  # local import: only required when selected

        if not settings.pinecone_api_key:
            raise RuntimeError("PINECONE_API_KEY is not set")

        self._pc = Pinecone(api_key=settings.pinecone_api_key)
        self._index = self._pc.Index(settings.pinecone_index)

    async def _embed(self, text: str) -> list[float]:
        raise NotImplementedError(
            "Wire an embedding model here (e.g. OpenAI text-embedding-3-small) "
            "before using the Pinecone adapter."
        )

    async def upsert(self, collection: str, id: str, text: str, metadata: dict[str, Any]) -> None:
        vector = await self._embed(text)
        self._index.upsert(
            vectors=[{"id": id, "values": vector, "metadata": {**metadata, "text": text}}],
            namespace=collection,
        )

    async def query(self, collection: str, text: str, top_k: int = 5) -> list[dict[str, Any]]:
        vector = await self._embed(text)
        result = self._index.query(
            vector=vector, top_k=top_k, namespace=collection, include_metadata=True
        )
        return [
            {"id": m.id, "text": m.metadata.get("text", ""), "metadata": m.metadata}
            for m in result.matches
        ]
