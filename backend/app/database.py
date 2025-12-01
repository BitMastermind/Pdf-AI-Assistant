from supabase import create_client, Client
from app.config import get_settings
from typing import Optional
import uuid
from datetime import datetime

settings = get_settings()

# Initialize Supabase client
supabase: Optional[Client] = None

def get_supabase() -> Optional[Client]:
    global supabase
    if supabase is None and settings.supabase_url and settings.supabase_key:
        supabase = create_client(settings.supabase_url, settings.supabase_key)
    return supabase


# Document operations
async def save_document(filename: str, file_size: int, page_count: int) -> dict:
    db = get_supabase()
    if db:
        doc = {
            "id": str(uuid.uuid4()),
            "filename": filename,
            "file_size": file_size,
            "page_count": page_count,
            "created_at": datetime.utcnow().isoformat()
        }
        result = db.table("documents").insert(doc).execute()
        return result.data[0] if result.data else doc
    return {
        "id": str(uuid.uuid4()),
        "filename": filename,
        "file_size": file_size,
        "page_count": page_count
    }


async def get_documents():
    db = get_supabase()
    if db:
        result = db.table("documents").select("*").order("created_at", desc=True).execute()
        return result.data
    return []


async def delete_document(doc_id: str):
    db = get_supabase()
    if db:
        db.table("documents").delete().eq("id", doc_id).execute()
        db.table("notes").delete().eq("document_id", doc_id).execute()
        db.table("flashcards").delete().eq("document_id", doc_id).execute()


# Notes operations
async def save_note(document_id: str, content: str, title: str = "Untitled Note") -> dict:
    db = get_supabase()
    note = {
        "id": str(uuid.uuid4()),
        "document_id": document_id,
        "title": title,
        "content": content,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    if db:
        result = db.table("notes").insert(note).execute()
        return result.data[0] if result.data else note
    return note


async def get_notes(document_id: str):
    db = get_supabase()
    if db:
        result = db.table("notes").select("*").eq("document_id", document_id).execute()
        return result.data
    return []


async def update_note(note_id: str, content: str, title: str = None):
    db = get_supabase()
    if db:
        update_data = {"content": content, "updated_at": datetime.utcnow().isoformat()}
        if title:
            update_data["title"] = title
        result = db.table("notes").update(update_data).eq("id", note_id).execute()
        return result.data[0] if result.data else None
    return None


async def delete_note(note_id: str):
    db = get_supabase()
    if db:
        db.table("notes").delete().eq("id", note_id).execute()


# Flashcard operations
async def save_flashcards(document_id: str, flashcards: list) -> list:
    db = get_supabase()
    saved = []
    for card in flashcards:
        flashcard = {
            "id": str(uuid.uuid4()),
            "document_id": document_id,
            "question": card["question"],
            "answer": card["answer"],
            "created_at": datetime.utcnow().isoformat()
        }
        if db:
            result = db.table("flashcards").insert(flashcard).execute()
            saved.append(result.data[0] if result.data else flashcard)
        else:
            saved.append(flashcard)
    return saved


async def get_flashcards(document_id: str):
    db = get_supabase()
    if db:
        result = db.table("flashcards").select("*").eq("document_id", document_id).execute()
        return result.data
    return []


async def delete_flashcard(flashcard_id: str):
    db = get_supabase()
    if db:
        db.table("flashcards").delete().eq("id", flashcard_id).execute()

