import logging
from typing import Any
from app.core.config import settings
from .base import VectorStore

logger = logging.getLogger(__name__)


class ChromaVectorStore(VectorStore):
    """
    Local/self-hosted vector store backed by ChromaDB.

    Chroma handles embedding internally using its default embedding function
    (all-MiniLM-L6-v2 via sentence-transformers) — no external API needed.

    Requires the `chromadb` package — add it when this adapter is selected
    via VECTOR_STORE=chroma:
        pip install chromadb
    """

    def __init__(self) -> None:
        try:
            import chromadb  # local import: only required when selected
        except ImportError:
            raise RuntimeError(
                "chromadb is not installed. Install it with: "
                "pip install chromadb"
            )

        self._client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
        logger.info(
            "ChromaDB vector store initialized (persist_dir=%s)",
            settings.chroma_persist_dir,
        )

    def _collection(self, name: str):
        """Get or create a collection by name."""
        return self._client.get_or_create_collection(name)

    async def upsert(self, collection: str, id: str, text: str, metadata: dict[str, Any]) -> None:
        try:
            col = self._collection(collection)
            col.upsert(ids=[id], documents=[text], metadatas=[metadata])
            logger.debug("ChromaDB upsert id=%s into collection=%s", id, collection)
        except Exception as e:
            logger.error("ChromaDB upsert failed: %s", e)
            raise

    async def query(self, collection: str, text: str, top_k: int = 5) -> list[dict[str, Any]]:
        try:
            col = self._collection(collection)

            # ChromaDB raises if the collection is empty and you try to query
            if col.count() == 0:
                logger.debug("ChromaDB collection=%s is empty, returning []", collection)
                return []

            result = col.query(query_texts=[text], n_results=min(top_k, col.count()))

            docs = result.get("documents", [[]])[0]
            metas = result.get("metadatas", [[]])[0]
            ids = result.get("ids", [[]])[0]

            return [
                {"id": i, "text": d, "metadata": m}
                for i, d, m in zip(ids, docs, metas)
            ]
        except Exception as e:
            logger.error("ChromaDB query failed: %s", e)
            raise
