from abc import ABC, abstractmethod
from typing import Any


class VectorStore(ABC):
    """
    Backs the Career Memory Engine (SRS MEN-02/MEN-03). Every AI feature that
    reads or writes Career Memory talks to this interface, never to Chroma or
    Pinecone directly — that's what makes the vector store swappable.
    """

    @abstractmethod
    async def upsert(self, collection: str, id: str, text: str, metadata: dict[str, Any]) -> None:
        """Embed `text` and store it under `id` in `collection`."""
        raise NotImplementedError

    @abstractmethod
    async def query(self, collection: str, text: str, top_k: int = 5) -> list[dict[str, Any]]:
        """Return the top_k most similar stored items to `text`."""
        raise NotImplementedError
