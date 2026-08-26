from abc import ABC, abstractmethod


class LLMProvider(ABC):
    """
    Every LLM-backed feature (resume parsing, mentor chat, interview
    questions, roadmap generation) talks to this interface, never to a
    provider SDK directly — that's what makes the provider swappable.
    """

    @abstractmethod
    async def generate(self, prompt: str, *, system: str | None = None) -> str:
        """Return a single completion for the given prompt."""
        raise NotImplementedError
