from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os
from pathlib import Path


class Settings(BaseSettings):
    # API Keys
    openai_api_key: str = ""
    google_api_key: str = ""
    
    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""
    
    # AI Provider
    ai_provider: str = "openai"  # "openai" or "gemini"
    
    # Model Configuration
    openai_model: str = "gpt-4o-mini"  # Upgraded from gpt-3.5-turbo
    gemini_model: str = "gemini-2.0-flash"  # Use the working model
    
    # Temperature settings per task (lower = more factual, higher = more creative)
    temperature_chat: float = 0.15  # Factual Q&A needs precision
    temperature_summary: float = 0.25  # Balanced for coherent summaries
    temperature_keywords: float = 0.1  # Very precise extraction
    temperature_flashcards: float = 0.4  # Slightly creative for engaging cards
    
    # Retrieval settings
    retrieval_k: int = 8  # Number of chunks to retrieve (increased from 5)
    retrieval_score_threshold: float = 0.3  # Minimum similarity score
    
    # ChromaDB / Vector Store
    chroma_persist_directory: str = "./chroma_db"
    
    # Chunking settings (optimized for better retrieval)
    chunk_size: int = 800  # Reduced from 1000 for more precise chunks
    chunk_overlap: int = 150  # Adjusted overlap
    
    # App settings
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    max_context_length: int = 12000  # Max chars to send to LLM
    
    # Caching
    enable_cache: bool = True
    cache_ttl_seconds: int = 3600  # 1 hour
    
    model_config = SettingsConfigDict(
        env_file=Path(__file__).parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )


@lru_cache()
def get_settings():
    return Settings()
