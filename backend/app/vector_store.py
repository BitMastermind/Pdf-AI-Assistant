from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import get_settings
from typing import List, Optional, Dict, Tuple
import os

settings = get_settings()

# Ensure vector store directory exists
os.makedirs(settings.chroma_persist_directory, exist_ok=True)

# In-memory storage for vector stores
_vector_stores: Dict[str, FAISS] = {}

# In-memory storage for document chunks (for hybrid search)
_document_chunks: Dict[str, List[str]] = {}

# Cache for embeddings model
_embeddings_model = None


def get_embeddings():
    """Get embeddings - using BGE model for superior retrieval quality"""
    global _embeddings_model
    
    if _embeddings_model is None:
        # BGE (BAAI General Embedding) models are state-of-the-art for retrieval
        # bge-base-en-v1.5 offers excellent quality with reasonable speed
        _embeddings_model = HuggingFaceEmbeddings(
            model_name="BAAI/bge-base-en-v1.5",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={
                'normalize_embeddings': True,
                'batch_size': 32
            }
        )
    
    return _embeddings_model


def chunk_text(text: str, chunk_size: int = None, chunk_overlap: int = None) -> List[str]:
    """
    Split text into chunks optimized for retrieval.
    Uses semantic-aware separators to maintain context.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size or settings.chunk_size,
        chunk_overlap=chunk_overlap or settings.chunk_overlap,
        length_function=len,
        # Ordered by preference - try to split at natural boundaries
        separators=[
            "\n\n\n",      # Major section breaks
            "\n\n",        # Paragraph breaks
            "\n",          # Line breaks
            ". ",          # Sentence endings
            "! ",          # Exclamation sentences
            "? ",          # Question sentences
            "; ",          # Semicolon breaks
            ", ",          # Clause breaks
            " ",           # Word breaks
            ""             # Character breaks (last resort)
        ],
        keep_separator=True  # Keep separators for context
    )
    
    chunks = splitter.split_text(text)
    
    # Post-process: ensure chunks aren't too short (min 100 chars)
    processed_chunks = []
    buffer = ""
    
    for chunk in chunks:
        if len(chunk) < 100 and buffer:
            buffer += " " + chunk
        elif len(chunk) < 100:
            buffer = chunk
        else:
            if buffer:
                processed_chunks.append(buffer)
                buffer = ""
            processed_chunks.append(chunk)
    
    if buffer:
        if processed_chunks:
            processed_chunks[-1] += " " + buffer
        else:
            processed_chunks.append(buffer)
    
    return processed_chunks


def store_document(doc_id: str, text: str, metadata: dict = None) -> int:
    """Store document chunks in vector database with enhanced metadata"""
    chunks = chunk_text(text)
    
    if not chunks:
        return 0
    
    # Store chunks for potential hybrid search
    _document_chunks[doc_id] = chunks
    
    embeddings = get_embeddings()
    
    # Enhanced metadata for each chunk
    metadatas = []
    for i, chunk in enumerate(chunks):
        chunk_meta = {
            "chunk_index": i,
            "doc_id": doc_id,
            "chunk_length": len(chunk),
            "total_chunks": len(chunks),
            **(metadata or {})
        }
        metadatas.append(chunk_meta)
    
    # Create vector store with FAISS
    vector_store = FAISS.from_texts(
        texts=chunks,
        embedding=embeddings,
        metadatas=metadatas
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


def search_similar(doc_id: str, query: str, k: int = None) -> List[str]:
    """Search for similar chunks in the document"""
    vector_store = get_vector_store(doc_id)
    
    if not vector_store:
        return []
    
    k = k or settings.retrieval_k
    results = vector_store.similarity_search(query, k=k)
    return [doc.page_content for doc in results]


def search_similar_with_scores(doc_id: str, query: str, k: int = None) -> List[Tuple[str, float]]:
    """
    Search for similar chunks with relevance scores.
    Returns list of (content, score) tuples, filtered by threshold.
    """
    vector_store = get_vector_store(doc_id)
    
    if not vector_store:
        return []
    
    k = k or settings.retrieval_k
    
    # Get results with scores
    results = vector_store.similarity_search_with_score(query, k=k)
    
    # Filter by score threshold and format
    # Note: FAISS returns distance (lower is better), so we convert to similarity
    filtered_results = []
    for doc, score in results:
        # Convert distance to similarity score (approximate)
        similarity = 1 / (1 + score)
        if similarity >= settings.retrieval_score_threshold:
            filtered_results.append((doc.page_content, similarity))
    
    # Sort by similarity (highest first)
    filtered_results.sort(key=lambda x: x[1], reverse=True)
    
    return filtered_results


def search_mmr(doc_id: str, query: str, k: int = None, diversity: float = 0.3) -> List[str]:
    """
    Search using Maximal Marginal Relevance for diverse results.
    Balances relevance with diversity to avoid redundant chunks.
    """
    vector_store = get_vector_store(doc_id)
    
    if not vector_store:
        return []
    
    k = k or settings.retrieval_k
    
    # MMR retrieval - fetch more candidates, then select diverse subset
    results = vector_store.max_marginal_relevance_search(
        query,
        k=k,
        fetch_k=k * 3,  # Fetch 3x candidates for diversity selection
        lambda_mult=1 - diversity  # 0 = max diversity, 1 = max relevance
    )
    
    return [doc.page_content for doc in results]


def get_document_chunks(doc_id: str) -> List[str]:
    """Get all chunks for a document (for full-text operations)"""
    if doc_id in _document_chunks:
        return _document_chunks[doc_id]
    
    # Try to reconstruct from vector store
    vector_store = get_vector_store(doc_id)
    if vector_store:
        # Get all documents from the store
        docs = vector_store.similarity_search("", k=10000)
        chunks = [doc.page_content for doc in docs]
        _document_chunks[doc_id] = chunks
        return chunks
    
    return []


def delete_document_vectors(doc_id: str):
    """Delete all vectors for a document"""
    # Remove from memory
    if doc_id in _vector_stores:
        del _vector_stores[doc_id]
    
    if doc_id in _document_chunks:
        del _document_chunks[doc_id]
    
    # Remove from disk
    try:
        store_path = os.path.join(settings.chroma_persist_directory, f"{doc_id}.faiss")
        if os.path.exists(store_path):
            import shutil
            shutil.rmtree(store_path, ignore_errors=True)
    except:
        pass
