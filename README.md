# 📚 PDF AI Assistant

A powerful AI-powered PDF analysis tool that lets you upload documents and interact with them using natural language. Built with Next.js, FastAPI, LangChain, and FAISS.

![PDF AI Assistant](https://img.shields.io/badge/AI-Powered-violet?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green?style=for-the-badge)
![LangChain](https://img.shields.io/badge/LangChain-0.1-blue?style=for-the-badge)

## ✨ Features

- **📤 PDF Upload** - Upload PDF documents up to 10MB
- **💬 Chat with Documents** - Ask questions and get AI-powered answers using RAG
- **📝 Smart Summaries** - Generate concise summaries of any length
- **🏷️ Keyword Extraction** - Automatically extract key topics and concepts
- **🎴 Flashcard Generation** - Create study flashcards from document content
- **📓 Notes** - Take and save notes for each document
- **⬇️ Download** - Export summaries as text files

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Zustand** - State management

### Backend
- **FastAPI** - High-performance Python API
- **LangChain** - LLM orchestration framework
- **FAISS** - Vector database for RAG
- **PyPDF2** - PDF text extraction
- **Sentence Transformers** - Free local embeddings

### AI Providers
- **Google Gemini** - LLM for chat, summaries, and generation

### Database
- **Supabase** - PostgreSQL database for persistent storage

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- Google Gemini API key
- Supabase account (optional, for persistence)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/pdf-ai-assistant.git
cd pdf-ai-assistant
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp env.example .env
```

Edit `backend/.env` with your configuration:

```env
# Google Gemini API Key
GOOGLE_API_KEY=your_gemini_api_key_here

# Supabase Configuration (optional)
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# AI Provider
AI_PROVIDER=gemini

# ChromaDB path
CHROMA_PERSIST_DIRECTORY=./chroma_db
```

Start the backend:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Database Setup (Optional)

If using Supabase for persistence:

1. Create a new Supabase project
2. Go to SQL Editor
3. Run the schema from `database/supabase_schema.sql`
4. Copy your project URL and anon key to `backend/.env`

## 📁 Project Structure

```
pdf-ai-assistant/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   ├── config.py        # Configuration settings
│   │   ├── models.py        # Pydantic models
│   │   ├── pdf_processor.py # PDF text extraction
│   │   ├── vector_store.py  # FAISS operations
│   │   ├── ai_service.py    # LangChain AI services
│   │   └── database.py      # Supabase operations
│   ├── requirements.txt
│   └── env.example
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── FileUpload.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── SummaryPanel.tsx
│   │   ├── KeywordsPanel.tsx
│   │   ├── FlashcardsPanel.tsx
│   │   └── NotesPanel.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── store.ts
│   └── package.json
├── database/
│   └── supabase_schema.sql
└── README.md
```

## 🔌 API Endpoints

### Documents
- `POST /api/documents/upload` - Upload a PDF
- `GET /api/documents` - List all documents
- `DELETE /api/documents/{doc_id}` - Delete a document

### AI Features
- `POST /api/documents/{doc_id}/ask` - Ask a question
- `POST /api/documents/{doc_id}/chat` - Chat with document
- `POST /api/documents/{doc_id}/summary` - Generate summary
- `POST /api/documents/{doc_id}/keywords` - Extract keywords
- `POST /api/documents/{doc_id}/flashcards/generate` - Create flashcards

### Notes
- `GET /api/documents/{doc_id}/notes` - Get notes
- `POST /api/documents/{doc_id}/notes` - Create note
- `PUT /api/notes/{note_id}` - Update note
- `DELETE /api/notes/{note_id}` - Delete note

### Flashcards
- `GET /api/documents/{doc_id}/flashcards` - Get flashcards
- `DELETE /api/flashcards/{flashcard_id}` - Delete flashcard

## 🎨 UI Features

- **Dark Theme** - Beautiful midnight blue color scheme
- **Glass Morphism** - Modern frosted glass effects
- **Smooth Animations** - Framer Motion transitions
- **Responsive Design** - Works on all screen sizes
- **Interactive Flashcards** - Flip cards to reveal answers

## 🔧 Configuration Options

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_API_KEY` | Google Gemini API key | - |
| `AI_PROVIDER` | AI provider to use | `gemini` |
| `SUPABASE_URL` | Supabase project URL | - |
| `SUPABASE_KEY` | Supabase anon key | - |
| `CHROMA_PERSIST_DIRECTORY` | Vector DB storage path | `./chroma_db` |

### Frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- [LangChain](https://www.langchain.com/) for LLM orchestration
- [FAISS](https://github.com/facebookresearch/faiss) for vector search
- [Next.js](https://nextjs.org/) for the amazing framework
- [FastAPI](https://fastapi.tiangolo.com/) for the high-performance API

---

Built with ❤️ using AI
