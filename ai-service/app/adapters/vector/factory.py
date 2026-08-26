from functools import lru_cache
from app.core.config import settings
from .base import VectorStore
from .mock_store import MockVectorStore


@lru_cache
def get_vector_store() -> VectorStore:
    store = settings.vector_store.lower()

    if store == "chroma":
        from .chroma_store import ChromaVectorStore
        return ChromaVectorStore()

    if store == "pinecone":
        from .pinecone_store import PineconeVectorStore
        return PineconeVectorStore()

    # Default: mock — lets the service run with zero configuration.
    return MockVectorStore()
