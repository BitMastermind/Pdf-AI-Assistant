from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import get_settings
from typing import List, Optional, Dict
import os

settings = get_settings()

# Ensure vector store directory exists
os.makedirs(settings.chroma_persist_directory, exist_ok=True)

# In-memory storage for vector stores
_vector_stores: Dict[str, FAISS] = {}

# Cache for embeddings model
_embeddings_model = None


def get_embeddings():
    """Get embeddings - using BGE model for superior retrieval quality"""
    global _embeddings_model
    
    if _embeddings_model is None:
        # BGE (BAAI General Embedding) models are state-of-the-art for retrieval
        # bge-base-en-v1.5 offers excellent quality with reasonable speed
        # For even better quality, use "BAAI/bge-large-en-v1.5" (slower but more accurate)
        _embeddings_model = HuggingFaceEmbeddings(
            model_name="BAAI/bge-base-en-v1.5",
            model_kwargs={'device': 'cpu'},  # Use CPU (change to 'cuda' if you have GPU)
            encode_kwargs={
                'normalize_embeddings': True,
                'batch_size': 32  # Process in batches for efficiency
            }
        )
    
    return _embeddings_model


def chunk_text(text: str, chunk_size: int = None, chunk_overlap: int = None) -> List[str]:
    """Split text into chunks for vector storage"""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size or settings.chunk_size,
        chunk_overlap=chunk_overlap or settings.chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    return splitter.split_text(text)


def store_document(doc_id: str, text: str, metadata: dict = None) -> int:
    """Store document chunks in vector database"""
    chunks = chunk_text(text)
    
    if not chunks:
        return 0
    
    embeddings = get_embeddings()
    
    # Create vector store with FAISS
    vector_store = FAISS.from_texts(
        texts=chunks,
        embedding=embeddings,
        metadatas=[{"chunk_index": i, "doc_id": doc_id, **(metadata or {})} for i in range(len(chunks))]
    )
    
    # Save to disk
    store_path = os.path.join(settings.chroma_persist_directory, f"{doc_id}.faiss")
    vector_store.save_local(store_path)
    
    # Store in memory
    _vector_stores[doc_id] = vector_store
    
    return len(chunks)


def get_vector_store(doc_id: str) -> Optional[FAISS]:
    """Get vector store for a document"""
    # Check memory first
    if doc_id in _vector_stores:
        return _vector_stores[doc_id]
    
    # Try to load from disk
    try:
        store_path = os.path.join(settings.chroma_persist_directory, f"{doc_id}.faiss")
        if os.path.exists(store_path):
            embeddings = get_embeddings()
            vector_store = FAISS.load_local(store_path, embeddings, allow_dangerous_deserialization=True)
            _vector_stores[doc_id] = vector_store
            return vector_store
    except Exception as e:
        print(f"Error loading vector store: {e}")
    
    return None


def search_similar(doc_id: str, query: str, k: int = 5) -> List[str]:
    """Search for similar chunks in the document"""
    vector_store = get_vector_store(doc_id)
    
    if not vector_store:
        return []
    
    results = vector_store.similarity_search(query, k=k)
    return [doc.page_content for doc in results]


def delete_document_vectors(doc_id: str):
    """Delete all vectors for a document"""
    # Remove from memory
    if doc_id in _vector_stores:
        del _vector_stores[doc_id]
    
    # Remove from disk
    try:
        store_path = os.path.join(settings.chroma_persist_directory, f"{doc_id}.faiss")
        if os.path.exists(store_path):
            import shutil
            shutil.rmtree(store_path, ignore_errors=True)
    except:
        pass

