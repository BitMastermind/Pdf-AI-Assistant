from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # API Keys
    openai_api_key: str = ""
    google_api_key: str = ""
    
    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""
    
    # AI Provider
    ai_provider: str = "openai"  # "openai" or "gemini"
    
    # ChromaDB
    chroma_persist_directory: str = "./chroma_db"
    
    # App settings
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    chunk_size: int = 1000
    chunk_overlap: int = 200
    
    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings():
    return Settings()

