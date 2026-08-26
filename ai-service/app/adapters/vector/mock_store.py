from typing import Any
from .base import VectorStore


class MockVectorStore(VectorStore):
    """
    In-memory store with naive keyword-overlap "similarity" so the mentor
    pipeline runs end-to-end with zero configuration. Not for production —
    swap to Chroma or Pinecone via VECTOR_STORE env var.
    """

    def __init__(self) -> None:
        self._data: dict[str, list[dict[str, Any]]] = {}

    async def upsert(self, collection: str, id: str, text: str, metadata: dict[str, Any]) -> None:
        bucket = self._data.setdefault(collection, [])
        bucket = [item for item in bucket if item["id"] != id]
        bucket.append({"id": id, "text": text, "metadata": metadata})
        self._data[collection] = bucket

    async def query(self, collection: str, text: str, top_k: int = 5) -> list[dict[str, Any]]:
        bucket = self._data.get(collection, [])
        query_terms = set(text.lower().split())

        def score(item: dict[str, Any]) -> int:
            item_terms = set(item["text"].lower().split())
            return len(query_terms & item_terms)

        ranked = sorted(bucket, key=score, reverse=True)
        return ranked[:top_k]
