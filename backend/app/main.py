from fastapi import FastAPI, File, UploadFile, HTTPException, Path, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
import uuid
from typing import Dict
import traceback
import json

from app.config import get_settings
from app.models import (
    DocumentResponse, QuestionRequest, ChatRequest, SummaryRequest,
    KeywordsRequest, FlashcardsRequest, NoteCreate, NoteUpdate,
    NoteResponse, FlashcardResponse, AnswerResponse, SummaryResponse,
    KeywordsResponse, FlashcardsGenerateResponse
)
from app.pdf_processor import extract_text_from_pdf, get_pdf_info
from app.vector_store import store_document, delete_document_vectors
from app.ai_service import (
    ask_question, generate_summary, extract_keywords,
    generate_flashcards, chat_with_document, chat_with_document_stream
)
from app.database import (
    save_document, get_documents, delete_document,
    save_note, get_notes, update_note, delete_note,
    save_flashcards, get_flashcards, delete_flashcard
)

settings = get_settings()

app = FastAPI(
    title="PDF AI Assistant API",
    description="AI-powered PDF analysis with Q&A, summarization, and more",
    version="1.0.0"
)

# CORS middleware - must be added before other middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Global exception handlers to ensure CORS headers are always sent
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Credentials": "true",
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled exception: {exc}")
    print(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Credentials": "true",
        }
    )

# In-memory storage for document text (for demo purposes)
document_texts: Dict[str, str] = {}


@app.get("/")
async def root():
    return {"message": "PDF AI Assistant API", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Document endpoints
@app.post("/api/documents/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload a PDF document for processing"""
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    content = await file.read()
    
    if len(content) > settings.max_file_size:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    try:
        # Extract text from PDF
        text, page_count = extract_text_from_pdf(content)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
        # Save document to database
        doc = await save_document(file.filename, len(content), page_count)
        doc_id = doc["id"]
        
        # Store text in memory
        document_texts[doc_id] = text
        
        # Store in vector database
        chunk_count = store_document(doc_id, text, {"filename": file.filename})
        
        return DocumentResponse(
            id=doc_id,
            filename=file.filename,
            file_size=len(content),
            page_count=page_count,
            chunk_count=chunk_count
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")


@app.get("/api/documents")
async def list_documents():
    """List all uploaded documents"""
    try:
        documents = await get_documents()
        return documents
    except Exception as e:
        print(f"Error fetching documents: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {str(e)}")


@app.delete("/api/documents/{doc_id}")
async def remove_document(doc_id: str = Path(...)):
    """Delete a document and all related data"""
    try:
        # Remove from memory
        if doc_id in document_texts:
            del document_texts[doc_id]
        
        # Remove vectors
        delete_document_vectors(doc_id)
        
        # Remove from database
        await delete_document(doc_id)
        
        return {"message": "Document deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# AI endpoints
@app.post("/api/documents/{doc_id}/ask", response_model=AnswerResponse)
async def ask_document_question(doc_id: str, request: QuestionRequest):
    """Ask a question about the document"""
    try:
        answer = await ask_question(doc_id, request.question)
        return AnswerResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/documents/{doc_id}/chat", response_model=AnswerResponse)
async def chat_about_document(doc_id: str, request: ChatRequest):
    """Have a conversation about the document"""
    try:
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        answer = await chat_with_document(doc_id, messages)
        return AnswerResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/documents/{doc_id}/chat/stream")
async def chat_about_document_stream(doc_id: str, request: ChatRequest):
    """Stream a conversation response about the document using Server-Sent Events"""
    messages = [{"role": m.role, "content": m.content} for m in request.messages]
    
    async def generate():
        try:
            async for chunk in chat_with_document_stream(doc_id, messages):
                # Format as SSE
                data = json.dumps({"chunk": chunk})
                yield f"data: {data}\n\n"
            # Send completion signal
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            error_data = json.dumps({"error": str(e)})
            yield f"data: {error_data}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Credentials": "true",
        }
    )


@app.post("/api/documents/{doc_id}/summary", response_model=SummaryResponse)
async def get_document_summary(doc_id: str, request: SummaryRequest = None):
    """Generate a summary of the document"""
    # Get document text from memory or vector store
    text = document_texts.get(doc_id)
    if not text:
        # Try to get from vector store
        from app.vector_store import get_vector_store
        vector_store = get_vector_store(doc_id)
        if vector_store:
            # Get all chunks and combine
            docs = vector_store.similarity_search("", k=1000)  # Get all chunks
            text = "\n\n".join([doc.page_content for doc in docs])
        else:
            raise HTTPException(status_code=404, detail="Document not found. Please re-upload the document.")
    
    try:
        max_length = request.max_length if request else 500
        summary = await generate_summary(text, max_length)
        return SummaryResponse(summary=summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")


@app.post("/api/documents/{doc_id}/keywords", response_model=KeywordsResponse)
async def get_document_keywords(doc_id: str, request: KeywordsRequest = None):
    """Extract keywords from the document"""
    # Get document text from memory or vector store
    text = document_texts.get(doc_id)
    if not text:
        # Try to get from vector store
        from app.vector_store import get_vector_store
        vector_store = get_vector_store(doc_id)
        if vector_store:
            # Get all chunks and combine
            docs = vector_store.similarity_search("", k=1000)  # Get all chunks
            text = "\n\n".join([doc.page_content for doc in docs])
        else:
            raise HTTPException(status_code=404, detail="Document not found. Please re-upload the document.")
    
    try:
        num_keywords = request.num_keywords if request else 15
        keywords = await extract_keywords(text, num_keywords)
        return KeywordsResponse(keywords=keywords)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting keywords: {str(e)}")


@app.post("/api/documents/{doc_id}/flashcards/generate", response_model=FlashcardsGenerateResponse)
async def generate_document_flashcards(doc_id: str, request: FlashcardsRequest = None):
    """Generate flashcards from the document"""
    # Get document text from memory or vector store
    text = document_texts.get(doc_id)
    if not text:
        # Try to get from vector store
        from app.vector_store import get_vector_store
        vector_store = get_vector_store(doc_id)
        if vector_store:
            # Get all chunks and combine
            docs = vector_store.similarity_search("", k=1000)  # Get all chunks
            text = "\n\n".join([doc.page_content for doc in docs])
        else:
            raise HTTPException(status_code=404, detail="Document not found. Please re-upload the document.")
    
    try:
        num_cards = request.num_cards if request else 10
        flashcards = await generate_flashcards(text, num_cards)
        
        # Save flashcards to database
        saved = await save_flashcards(doc_id, flashcards)
        
        return FlashcardsGenerateResponse(flashcards=saved)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating flashcards: {str(e)}")


# Notes endpoints
@app.get("/api/documents/{doc_id}/notes")
async def get_document_notes(doc_id: str):
    """Get all notes for a document"""
    return await get_notes(doc_id)


@app.post("/api/documents/{doc_id}/notes", response_model=NoteResponse)
async def create_note(doc_id: str, note: NoteCreate):
    """Create a new note for the document"""
    try:
        saved = await save_note(doc_id, note.content, note.title)
        return NoteResponse(**saved)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/notes/{note_id}", response_model=NoteResponse)
async def update_document_note(note_id: str, note: NoteUpdate):
    """Update an existing note"""
    try:
        updated = await update_note(note_id, note.content, note.title)
        if not updated:
            raise HTTPException(status_code=404, detail="Note not found")
        return NoteResponse(**updated)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/notes/{note_id}")
async def delete_document_note(note_id: str):
    """Delete a note"""
    try:
        await delete_note(note_id)
        return {"message": "Note deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Flashcards endpoints
@app.get("/api/documents/{doc_id}/flashcards")
async def get_document_flashcards(doc_id: str):
    """Get all flashcards for a document"""
    return await get_flashcards(doc_id)


@app.delete("/api/flashcards/{flashcard_id}")
async def delete_document_flashcard(flashcard_id: str):
    """Delete a flashcard"""
    try:
        await delete_flashcard(flashcard_id)
        return {"message": "Flashcard deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Download endpoints
@app.get("/api/documents/{doc_id}/download/summary")
async def download_summary(doc_id: str):
    """Download the document summary as a text file"""
    # Get document text from memory or vector store
    text = document_texts.get(doc_id)
    if not text:
        # Try to get from vector store
        from app.vector_store import get_vector_store
        vector_store = get_vector_store(doc_id)
        if vector_store:
            # Get all chunks and combine
            docs = vector_store.similarity_search("", k=1000)  # Get all chunks
            text = "\n\n".join([doc.page_content for doc in docs])
        else:
            raise HTTPException(status_code=404, detail="Document not found. Please re-upload the document.")
    
    try:
        summary = await generate_summary(text)
        return JSONResponse(
            content={"summary": summary, "format": "text"},
            headers={
                "Content-Disposition": f'attachment; filename="summary_{doc_id}.txt"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

