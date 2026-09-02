from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central config. LLM_PROVIDER and VECTOR_STORE are the two swap points
    called out as open issues in the SRS (Appendix 7.3) — change one env var
    and the adapter factories below pick a different implementation, no code
    changes required elsewhere.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    port: int = 8000

    # "openai" | "gemini" | "mock" (mock needs no API key, used for local dev)
    llm_provider: str = "mock"
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-1.5-flash"

    # Embedding model used by the Pinecone adapter (Pinecone doesn't embed
    # text itself — we call OpenAI's embedding API before upserting/querying).
    # Ignored when VECTOR_STORE != "pinecone".
    embedding_provider: str = "openai"
    openai_embedding_model: str = "text-embedding-3-small"
    openai_embedding_dimensions: int = 1536

    # "chroma" | "pinecone" | "mock"
    vector_store: str = "mock"
    chroma_persist_dir: str = "./.chroma"
    pinecone_api_key: str | None = None
    pinecone_index: str = "careeros-career-memory"

    backend_service_url: str = "http://localhost:4000"


settings = Settings()
