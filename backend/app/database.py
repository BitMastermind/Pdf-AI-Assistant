from supabase import create_client, Client
from app.config import get_settings
from typing import Optional
import uuid
from datetime import datetime

settings = get_settings()

# Initialize Supabase client
supabase: Optional[Client] = None
_supabase_error: Optional[str] = None

def get_supabase() -> Optional[Client]:
    global supabase, _supabase_error
    if supabase is not None:
        return supabase
    
    if not settings.supabase_url or not settings.supabase_key:
        return None
    
    try:
        # Try to create Supabase client
        supabase = create_client(settings.supabase_url, settings.supabase_key)
        _supabase_error = None
        return supabase
    except Exception as e:
        # If connection fails (e.g., SSL error, invalid credentials), return None
        # This allows the app to work without Supabase
        print(f"Warning: Could not connect to Supabase: {e}")
        print("Continuing without database persistence. Data will be stored in memory only.")
        _supabase_error = str(e)
        supabase = None
        return None


# Document operations
async def save_document(filename: str, file_size: int, page_count: int) -> dict:
    doc = {
        "id": str(uuid.uuid4()),
        "filename": filename,
        "file_size": file_size,
        "page_count": page_count
    }
    
    db = get_supabase()
    if db:
        try:
            doc["created_at"] = datetime.utcnow().isoformat()
            result = db.table("documents").insert(doc).execute()
            return result.data[0] if result.data else doc
        except Exception as e:
            print(f"Error saving document to Supabase: {e}")
            print("Saving document in memory only.")
            # Return the document without database persistence
            return doc
    
    # No Supabase configured, return document for in-memory storage
    return doc


async def get_documents():
    db = get_supabase()
    if db:
        try:
            result = db.table("documents").select("*").order("created_at", desc=True).execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error querying Supabase: {e}")
            # Return empty list on database errors
            return []
    return []


async def delete_document(doc_id: str):
    db = get_supabase()
    if db:
        try:
            db.table("documents").delete().eq("id", doc_id).execute()
            db.table("notes").delete().eq("document_id", doc_id).execute()
            db.table("flashcards").delete().eq("document_id", doc_id).execute()
        except Exception as e:
            print(f"Error deleting document from Supabase: {e}")
            # Continue even if database deletion fails


# Notes operations
async def save_note(document_id: str, content: str, title: str = "Untitled Note") -> dict:
    note = {
        "id": str(uuid.uuid4()),
        "document_id": document_id,
        "title": title,
        "content": content
    }
    
    db = get_supabase()
    if db:
        try:
            note["created_at"] = datetime.utcnow().isoformat()
            note["updated_at"] = datetime.utcnow().isoformat()
            result = db.table("notes").insert(note).execute()
            return result.data[0] if result.data else note
        except Exception as e:
            print(f"Error saving note to Supabase: {e}")
            return note
    
    return note


async def get_notes(document_id: str):
    db = get_supabase()
    if db:
        try:
            result = db.table("notes").select("*").eq("document_id", document_id).execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching notes from Supabase: {e}")
            return []
    return []


async def update_note(note_id: str, content: str, title: str = None):
    db = get_supabase()
    if db:
        try:
            update_data = {"content": content, "updated_at": datetime.utcnow().isoformat()}
            if title:
                update_data["title"] = title
            result = db.table("notes").update(update_data).eq("id", note_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error updating note in Supabase: {e}")
            return None
    return None


async def delete_note(note_id: str):
    db = get_supabase()
    if db:
        try:
            db.table("notes").delete().eq("id", note_id).execute()
        except Exception as e:
            print(f"Error deleting note from Supabase: {e}")


# Flashcard operations
async def save_flashcards(document_id: str, flashcards: list) -> list:
    db = get_supabase()
    saved = []
    for card in flashcards:
        flashcard = {
            "id": str(uuid.uuid4()),
            "document_id": document_id,
            "question": card["question"],
            "answer": card["answer"]
        }
        if db:
            try:
                flashcard["created_at"] = datetime.utcnow().isoformat()
                result = db.table("flashcards").insert(flashcard).execute()
                saved.append(result.data[0] if result.data else flashcard)
            except Exception as e:
                print(f"Error saving flashcard to Supabase: {e}")
                saved.append(flashcard)
        else:
            saved.append(flashcard)
    return saved


async def get_flashcards(document_id: str):
    db = get_supabase()
    if db:
        try:
            result = db.table("flashcards").select("*").eq("document_id", document_id).execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching flashcards from Supabase: {e}")
            return []
    return []


async def delete_flashcard(flashcard_id: str):
    db = get_supabase()
    if db:
        try:
            db.table("flashcards").delete().eq("id", flashcard_id).execute()
        except Exception as e:
            print(f"Error deleting flashcard from Supabase: {e}")

