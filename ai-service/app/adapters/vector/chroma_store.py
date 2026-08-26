from typing import Any
from app.core.config import settings
from .base import VectorStore


class ChromaVectorStore(VectorStore):
    """
    Local/self-hosted vector store backed by chromadb. Requires the
    `chromadb` package (not in requirements.txt by default — add it when
    this adapter is actually selected via VECTOR_STORE=chroma, since it
    pulls in a heavier dependency chain than the mock/API-based adapters).
    """

    def __init__(self) -> None:
        import chromadb  # local import: only required when this adapter is selected

        self._client = chromadb.PersistentClient(path=settings.chroma_persist_dir)

    def _collection(self, name: str):
        return self._client.get_or_create_collection(name)

    async def upsert(self, collection: str, id: str, text: str, metadata: dict[str, Any]) -> None:
        col = self._collection(collection)
        col.upsert(ids=[id], documents=[text], metadatas=[metadata])

    async def query(self, collection: str, text: str, top_k: int = 5) -> list[dict[str, Any]]:
        col = self._collection(collection)
        result = col.query(query_texts=[text], n_results=top_k)
        docs = result.get("documents", [[]])[0]
        metas = result.get("metadatas", [[]])[0]
        ids = result.get("ids", [[]])[0]
        return [
            {"id": i, "text": d, "metadata": m}
            for i, d, m in zip(ids, docs, metas)
        ]
