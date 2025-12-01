from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_size: int
    page_count: int
    chunk_count: int = 0
    created_at: Optional[str] = None


class QuestionRequest(BaseModel):
    question: str


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


class SummaryRequest(BaseModel):
    max_length: Optional[int] = 500


class KeywordsRequest(BaseModel):
    num_keywords: Optional[int] = 15


class FlashcardsRequest(BaseModel):
    num_cards: Optional[int] = 10


class NoteCreate(BaseModel):
    title: str = "Untitled Note"
    content: str


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: str


class NoteResponse(BaseModel):
    id: str
    document_id: str
    title: str
    content: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class FlashcardResponse(BaseModel):
    id: str
    document_id: str
    question: str
    answer: str
    created_at: Optional[str] = None


class AnswerResponse(BaseModel):
    answer: str


class SummaryResponse(BaseModel):
    summary: str


class KeywordsResponse(BaseModel):
    keywords: List[str]


class FlashcardsGenerateResponse(BaseModel):
    flashcards: List[dict]

