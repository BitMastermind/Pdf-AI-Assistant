from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from app.config import get_settings
from app.vector_store import get_vector_store, search_similar, search_mmr, search_similar_with_scores
from typing import List, Dict, AsyncGenerator, Optional
import json
import re
import hashlib
from datetime import datetime, timedelta

settings = get_settings()

# ============================================================================
# Response Cache for Performance
# ============================================================================
_response_cache: Dict[str, Dict] = {}


def _get_cache_key(prefix: str, *args) -> str:
    """Generate a cache key from arguments"""
    content = f"{prefix}:" + ":".join(str(arg) for arg in args)
    return hashlib.md5(content.encode()).hexdigest()


def _get_cached_response(cache_key: str) -> Optional[str]:
    """Get cached response if valid"""
    if not settings.enable_cache:
        return None
    
    if cache_key in _response_cache:
        cached = _response_cache[cache_key]
        if datetime.now() < cached["expires"]:
            return cached["response"]
        else:
            del _response_cache[cache_key]
    return None


def _cache_response(cache_key: str, response: str):
    """Cache a response"""
    if settings.enable_cache:
        _response_cache[cache_key] = {
            "response": response,
            "expires": datetime.now() + timedelta(seconds=settings.cache_ttl_seconds)
        }


def clear_cache():
    """Clear all cached responses"""
    global _response_cache
    _response_cache = {}


# ============================================================================
# LLM Configuration
# ============================================================================
def get_llm(task: str = "chat", streaming: bool = False):
    """
    Get LLM with task-specific configuration.
    
    Tasks: "chat", "summary", "keywords", "flashcards"
    """
    # Task-specific temperatures
    temp_map = {
        "chat": settings.temperature_chat,
        "summary": settings.temperature_summary,
        "keywords": settings.temperature_keywords,
        "flashcards": settings.temperature_flashcards,
    }
    temperature = temp_map.get(task, 0.2)
    
    if settings.ai_provider == "gemini" and settings.google_api_key:
        return ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.google_api_key,
            temperature=temperature,
            max_output_tokens=2048,
            streaming=streaming
        )
    else:
        return ChatOpenAI(
            model=settings.openai_model,
            openai_api_key=settings.openai_api_key,
            temperature=temperature,
            max_tokens=2048,
            streaming=streaming
        )


# ============================================================================
# Enhanced Prompts
# ============================================================================
CHAT_PROMPT = PromptTemplate(
    template="""You are a precise and helpful document assistant. Your task is to answer questions using ONLY the provided document context.

INSTRUCTIONS:
1. Answer based ONLY on the context provided below
2. If the answer is clearly in the context, provide it with specific details
3. If you can partially answer, explain what you found and what information is missing
4. If the answer is NOT in the context, say: "I couldn't find this information in the document."
5. When helpful, quote relevant passages using quotation marks
6. Be concise but thorough - aim for clear, actionable answers
7. Use bullet points or numbered lists for complex answers

DOCUMENT CONTEXT:
{context}

CONVERSATION HISTORY:
{history}

USER QUESTION: {question}

ANSWER:""",
    input_variables=["context", "history", "question"]
)

SUMMARY_PROMPT = PromptTemplate(
    template="""Create a comprehensive, well-structured summary of the following document.

REQUIREMENTS:
- Target length: approximately {max_length} words
- Capture ALL main ideas and key points
- Use clear, professional language
- Organize information logically

FORMAT YOUR RESPONSE AS:

## Overview
[2-3 sentences capturing the document's main purpose and scope]

## Key Points
- [Main point 1 with brief explanation]
- [Main point 2 with brief explanation]
- [Continue for all important points]

## Important Details
[Any critical specifics, data, conclusions, or recommendations]

## Summary
[Brief concluding statement]

DOCUMENT:
{text}

STRUCTURED SUMMARY:""",
    input_variables=["text", "max_length"]
)

KEYWORDS_PROMPT = PromptTemplate(
    template="""Analyze the following document and extract the {num_keywords} most important keywords and key phrases.

EXTRACTION CRITERIA:
1. Main topics and themes (highest priority)
2. Technical terms and domain-specific vocabulary
3. Key concepts and definitions
4. Important entities (people, organizations, places)
5. Significant actions or processes

REQUIREMENTS:
- Return ONLY a JSON array of strings
- Order by importance (most important first)
- Include both single words and multi-word phrases
- Avoid generic words unless crucial to the document

DOCUMENT:
{text}

KEYWORDS (JSON array only, no explanation):""",
    input_variables=["text", "num_keywords"]
)

FLASHCARDS_PROMPT = PromptTemplate(
    template="""Create {num_cards} high-quality educational flashcards from the following document.

FLASHCARD REQUIREMENTS:
1. Questions should test understanding, not just recall
2. Answers should be concise but complete (1-3 sentences)
3. Cover the most important concepts and facts
4. Vary question types: definitions, explanations, comparisons, applications
5. Progress from basic to more complex concepts

QUESTION TYPES TO INCLUDE:
- "What is...?" (definitions)
- "How does...?" (processes)
- "Why is...?" (reasoning)
- "What are the main...?" (lists/components)
- "Compare..." (relationships)

Return as a JSON array with "question" and "answer" fields:
[
    {{"question": "Clear, specific question?", "answer": "Concise, accurate answer."}},
    ...
]

DOCUMENT:
{text}

FLASHCARDS (JSON array only):""",
    input_variables=["text", "num_cards"]
)


# ============================================================================
# AI Functions
# ============================================================================
async def ask_question(doc_id: str, question: str) -> str:
    """Answer a question about the document using enhanced RAG"""
    vector_store = get_vector_store(doc_id)
    
    if not vector_store:
        return "Document not found. Please upload a document first."
    
    # Check cache
    cache_key = _get_cache_key("ask", doc_id, question)
    cached = _get_cached_response(cache_key)
    if cached:
        return cached
    
    llm = get_llm(task="chat")
    
    # Use MMR for diverse, relevant results
    retriever = vector_store.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": settings.retrieval_k,
            "fetch_k": settings.retrieval_k * 3,
            "lambda_mult": 0.7  # Balance relevance and diversity
        }
    )
    
    def format_docs(docs):
        return "\n\n---\n\n".join(doc.page_content for doc in docs)
    
    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | PromptTemplate(
            template="""Use the following context to answer the question precisely. If the answer isn't in the context, say so.

Context:
{context}

Question: {question}

Answer:""",
            input_variables=["context", "question"]
        )
        | llm
        | StrOutputParser()
    )
    
    result = await chain.ainvoke(question)
    _cache_response(cache_key, result)
    return result


async def generate_summary(text: str, max_length: int = 500) -> str:
    """Generate an enhanced structured summary of the document"""
    # Check cache
    cache_key = _get_cache_key("summary", text[:500], max_length)
    cached = _get_cached_response(cache_key)
    if cached:
        return cached
    
    llm = get_llm(task="summary")
    
    # Truncate if needed but keep more context
    if len(text) > settings.max_context_length:
        text = text[:settings.max_context_length] + "\n\n[Document truncated for processing...]"
    
    chain = SUMMARY_PROMPT | llm | StrOutputParser()
    result = await chain.ainvoke({"text": text, "max_length": max_length})
    
    _cache_response(cache_key, result)
    return result


async def extract_keywords(text: str, num_keywords: int = 15) -> List[str]:
    """Extract key terms and concepts with improved accuracy"""
    # Check cache
    cache_key = _get_cache_key("keywords", text[:500], num_keywords)
    cached = _get_cached_response(cache_key)
    if cached:
        return json.loads(cached)
    
    llm = get_llm(task="keywords")
    
    # Use more text for better keyword extraction
    if len(text) > settings.max_context_length:
        text = text[:settings.max_context_length]
    
    chain = KEYWORDS_PROMPT | llm | StrOutputParser()
    result = await chain.ainvoke({"text": text, "num_keywords": num_keywords})
    
    # Robust JSON parsing
    keywords = []
    try:
        # Try to find JSON array in response
        match = re.search(r'\[[\s\S]*?\]', result)
        if match:
            keywords = json.loads(match.group())
    except json.JSONDecodeError:
        pass
    
    # Fallback parsing if JSON fails
    if not keywords:
        # Try to extract from various formats
        lines = result.replace('[', '').replace(']', '').replace('"', '').split('\n')
        for line in lines:
            # Clean up the line
            cleaned = re.sub(r'^[\d\.\-\*\•]+\s*', '', line.strip())
            cleaned = cleaned.strip(',').strip()
            if cleaned and len(cleaned) > 2:
                keywords.append(cleaned)
    
    keywords = keywords[:num_keywords]
    _cache_response(cache_key, json.dumps(keywords))
    return keywords


async def generate_flashcards(text: str, num_cards: int = 10) -> List[Dict[str, str]]:
    """Generate high-quality educational flashcards"""
    # Check cache
    cache_key = _get_cache_key("flashcards", text[:500], num_cards)
    cached = _get_cached_response(cache_key)
    if cached:
        return json.loads(cached)
    
    llm = get_llm(task="flashcards")
    
    if len(text) > settings.max_context_length:
        text = text[:settings.max_context_length]
    
    chain = FLASHCARDS_PROMPT | llm | StrOutputParser()
    result = await chain.ainvoke({"text": text, "num_cards": num_cards})
    
    flashcards = []
    try:
        # Find JSON array in response
        match = re.search(r'\[[\s\S]*\]', result)
        if match:
            flashcards = json.loads(match.group())
            # Validate structure
            flashcards = [
                fc for fc in flashcards 
                if isinstance(fc, dict) and "question" in fc and "answer" in fc
            ]
    except (json.JSONDecodeError, Exception) as e:
        print(f"Error parsing flashcards: {e}")
    
    flashcards = flashcards[:num_cards]
    _cache_response(cache_key, json.dumps(flashcards))
    return flashcards


async def chat_with_document(doc_id: str, messages: List[Dict[str, str]]) -> str:
    """Have a conversation about the document with enhanced context retrieval"""
    last_message = messages[-1]["content"] if messages else ""
    
    # Use MMR search for diverse, relevant context
    context_chunks = search_mmr(doc_id, last_message, k=settings.retrieval_k, diversity=0.3)
    context = "\n\n---\n\n".join(context_chunks)
    
    llm = get_llm(task="chat")
    
    # Format conversation history
    history = ""
    for msg in messages[:-1][-6:]:  # Keep last 6 messages for context
        role = "User" if msg["role"] == "user" else "Assistant"
        history += f"{role}: {msg['content']}\n"
    
    if not history:
        history = "[No previous conversation]"
    
    chain = CHAT_PROMPT | llm | StrOutputParser()
    result = await chain.ainvoke({
        "context": context,
        "history": history,
        "question": last_message
    })
    return result


async def chat_with_document_stream(doc_id: str, messages: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
    """Stream a conversation response with enhanced retrieval"""
    last_message = messages[-1]["content"] if messages else ""
    
    # Use MMR search for diverse, relevant context
    context_chunks = search_mmr(doc_id, last_message, k=settings.retrieval_k, diversity=0.3)
    context = "\n\n---\n\n".join(context_chunks)
    
    llm = get_llm(task="chat", streaming=True)
    
    # Format conversation history
    history = ""
    for msg in messages[:-1][-6:]:  # Keep last 6 messages for context
        role = "User" if msg["role"] == "user" else "Assistant"
        history += f"{role}: {msg['content']}\n"
    
    if not history:
        history = "[No previous conversation]"
    
    chain = CHAT_PROMPT | llm | StrOutputParser()
    
    async for chunk in chain.astream({
        "context": context,
        "history": history,
        "question": last_message
    }):
        yield chunk


# ============================================================================
# Follow-up Questions Generator
# ============================================================================
FOLLOWUP_PROMPT = PromptTemplate(
    template="""Based on the conversation below, suggest 3 relevant follow-up questions the user might want to ask about the document.

The questions should:
1. Be directly related to the topic discussed
2. Help deepen understanding or explore related aspects
3. Be concise (under 10 words each)
4. Be diverse - cover different angles

PREVIOUS QUESTION: {question}
ASSISTANT'S ANSWER: {answer}

Return ONLY a JSON array with exactly 3 questions, no explanation:
["Question 1?", "Question 2?", "Question 3?"]""",
    input_variables=["question", "answer"]
)


async def generate_followup_questions(question: str, answer: str) -> List[str]:
    """Generate suggested follow-up questions based on the conversation"""
    llm = get_llm(task="chat")
    
    chain = FOLLOWUP_PROMPT | llm | StrOutputParser()
    
    try:
        result = await chain.ainvoke({
            "question": question,
            "answer": answer[:1000]  # Limit answer length
        })
        
        # Parse JSON array
        match = re.search(r'\[[\s\S]*?\]', result)
        if match:
            questions = json.loads(match.group())
            return questions[:3]
    except Exception as e:
        print(f"Error generating follow-up questions: {e}")
    
    return []
