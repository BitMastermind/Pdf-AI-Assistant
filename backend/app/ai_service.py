from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from app.config import get_settings
from app.vector_store import get_vector_store, search_similar
from typing import List, Dict
import json
import re

settings = get_settings()


def get_llm():
    """Get LLM based on configured AI provider"""
    if settings.ai_provider == "gemini" and settings.google_api_key:
        return ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",  # Working model!
            google_api_key=settings.google_api_key,
            temperature=0.3
        )
    else:
        return ChatOpenAI(
            model="gpt-3.5-turbo",
            openai_api_key=settings.openai_api_key,
            temperature=0.3
        )


async def ask_question(doc_id: str, question: str) -> str:
    """Answer a question about the document using RAG"""
    vector_store = get_vector_store(doc_id)
    
    if not vector_store:
        return "Document not found. Please upload a document first."
    
    llm = get_llm()
    
    qa_prompt = PromptTemplate(
        template="""Use the following context to answer the question. If you cannot find the answer in the context, say "I couldn't find relevant information in the document."

Context:
{context}

Question: {question}

Answer:""",
        input_variables=["context", "question"]
    )
    
    retriever = vector_store.as_retriever(search_kwargs={"k": 5})
    
    # Use LCEL (LangChain Expression Language)
    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)
    
    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | qa_prompt
        | llm
        | StrOutputParser()
    )
    
    result = await chain.ainvoke(question)
    return result


async def generate_summary(text: str, max_length: int = 500) -> str:
    """Generate a summary of the document"""
    llm = get_llm()
    
    if len(text) > 15000:
        text = text[:15000] + "..."
    
    prompt = PromptTemplate(
        template="""Please provide a comprehensive summary of the following document. 
The summary should:
- Capture the main ideas and key points
- Be well-structured and easy to read
- Be approximately {max_length} words

Document:
{text}

Summary:""",
        input_variables=["text", "max_length"]
    )
    
    chain = prompt | llm | StrOutputParser()
    result = await chain.ainvoke({"text": text, "max_length": max_length})
    return result


async def extract_keywords(text: str, num_keywords: int = 15) -> List[str]:
    """Extract key terms and concepts from the document"""
    llm = get_llm()
    
    if len(text) > 10000:
        text = text[:10000] + "..."
    
    prompt = PromptTemplate(
        template="""Extract the {num_keywords} most important keywords and key phrases from the following document.
Return them as a JSON array of strings, like: ["keyword1", "keyword2", ...]
Focus on:
- Main topics and themes
- Important concepts
- Technical terms
- Key entities (people, places, organizations)

Document:
{text}

Keywords (JSON array only):""",
        input_variables=["text", "num_keywords"]
    )
    
    chain = prompt | llm | StrOutputParser()
    result = await chain.ainvoke({"text": text, "num_keywords": num_keywords})
    
    try:
        match = re.search(r'\[.*?\]', result, re.DOTALL)
        if match:
            keywords = json.loads(match.group())
            return keywords[:num_keywords]
    except:
        pass
    
    keywords = re.split(r'[,\n\u2022\-\d\.]+', result)
    keywords = [k.strip().strip('"\'') for k in keywords if k.strip()]
    return keywords[:num_keywords]


async def generate_flashcards(text: str, num_cards: int = 10) -> List[Dict[str, str]]:
    """Generate flashcards from the document"""
    llm = get_llm()
    
    if len(text) > 12000:
        text = text[:12000] + "..."
    
    prompt = PromptTemplate(
        template="""Create {num_cards} educational flashcards based on the following document.
Each flashcard should have a clear question and a concise answer.
Focus on key concepts, definitions, and important facts.

Return the flashcards as a JSON array with objects containing "question" and "answer" fields:
[
    {{"question": "What is...?", "answer": "It is..."}},
    ...
]

Document:
{text}

Flashcards (JSON array only):""",
        input_variables=["text", "num_cards"]
    )
    
    chain = prompt | llm | StrOutputParser()
    result = await chain.ainvoke({"text": text, "num_cards": num_cards})
    
    try:
        match = re.search(r'\[.*\]', result, re.DOTALL)
        if match:
            flashcards = json.loads(match.group())
            return flashcards[:num_cards]
    except Exception as e:
        print(f"Error parsing flashcards: {e}")
    
    return []


async def chat_with_document(doc_id: str, messages: List[Dict[str, str]]) -> str:
    """Have a conversation about the document"""
    last_message = messages[-1]["content"] if messages else ""
    
    context_chunks = search_similar(doc_id, last_message, k=5)
    context = "\n\n".join(context_chunks)
    
    llm = get_llm()
    
    history = ""
    for msg in messages[:-1]:
        role = "User" if msg["role"] == "user" else "Assistant"
        history += f"{role}: {msg['content']}\n"
    
    prompt = PromptTemplate(
        template="""You are a helpful assistant answering questions about a document.
Use the following context from the document to answer the user's question.
If the answer isn't in the context, say so but try to be helpful.

Document Context:
{context}

Conversation History:
{history}

User: {question}
Assistant:""",
        input_variables=["context", "history", "question"]
    )
    
    chain = prompt | llm | StrOutputParser()
    result = await chain.ainvoke({
        "context": context,
        "history": history,
        "question": last_message
    })
    return result

