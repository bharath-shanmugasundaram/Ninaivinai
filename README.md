# 🧠 Ninaivinai

> *"Ninaivinai"* (நினைவினை) — Tamil for **"memory"**

**Search videos by meaning, not by timestamps.**

Ninaivinai is a full-stack **Retrieval-Augmented Generation (RAG)** application that transforms video content into a searchable semantic memory. Upload any video, and find exact moments using natural language queries — powered by AI transcription, vector embeddings, and similarity search.

---

## ✨ Features

- 🎙️ **Automatic Transcription** — GPU-accelerated speech-to-text using Faster Whisper
- 🧩 **Semantic Chunking** — Intelligent 512-token overlapping windows to preserve context across segments
- 🔢 **Dual Embeddings** — 1024-dim vectors generated for both parent chunks and individual sentences (BAAI/bge-m3)
- 🔍 **Precise Sentence-Level Search** — Dot-product similarity drills into sub-chunks for pinpoint timestamp accuracy
- 🎬 **Instant Video Playback** — Search results auto-seek the video player to the exact second
- 🌗 **Dark/Light Theme** — Glassmorphism UI with theme toggle
- 🔒 **Client-Side Audio Extraction** — Video-to-MP3 conversion happens in-browser to save bandwidth

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite)            │
│                                                      │
│  Landing Page → Dashboard → Workspace                │
│       ┌──────────┐    ┌──────────────┐               │
│       │  Video   │    │    Chat      │               │
│       │  Player  │◄───│  Interface   │               │
│       └──────────┘    └──────┬───────┘               │
│                              │ query                  │
└──────────────────────────────┼────────────────────────┘
                               │ HTTP (ngrok)
┌──────────────────────────────┼────────────────────────┐
│                   BACKEND (FastAPI)                    │
│                              │                        │
│  /transcribe ──► Faster Whisper (CUDA)                │
│  /embedding  ──► BAAI/bge-m3 (CUDA)                  │
│  /add_overlap ─► Semantic Chunking + Embedding Gen    │
│  /add         ─► Store in Qdrant (with sentences)     │
│  /search      ─► Qdrant Vector Search                 │
│                  └──► Dot-Product over sub-sentences   │
│                       └──► Return exact timestamp      │
└───────────────────────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │   Qdrant Vector DB  │
                    │   (localhost:6333)   │
                    └─────────────────────┘
```

---

## 📁 Project Structure

```
Ninaivinai/
├── Frontend/Ninaivinai/        # React + Vite frontend
│   ├── src/
│   │   ├── components/         # VideoPlayer, ChatInterface, NavigationBar
│   │   ├── pages/              # LandingPage, Dashboard, Workspace, LoginPage
│   │   ├── services/           # api.js (all backend HTTP calls)
│   │   ├── contexts/           # ThemeContext, AuthContext
│   │   └── utils/              # audioConverter.js (client-side MP3 extraction)
│   └── package.json
│
├── Utilis/                     # Backend server & ML utilities
│   ├── server.py               # FastAPI application (all endpoints)
│   ├── embedding.py            # BAAI/bge-m3 sentence embeddings (CUDA)
│   ├── transcriber.py          # Faster Whisper transcription (CUDA)
│   └── runner.py               # Keep-alive pinger for ngrok tunnel
│
├── vid2text/                   # CLI video-to-text pipeline
│   └── main.py                 # Standalone video processing script
│
├── test_api.py                 # API endpoint integration tests
├── test_gpu.py                 # GPU/CUDA verification script
└── audio/                      # Sample transcription outputs
```

---

## 🔄 How It Works

### Ingestion Pipeline
1. **Upload** — User drops a video file on the Dashboard
2. **Extract** — Browser converts video to MP3 using Web Audio API + lamejs
3. **Transcribe** — MP3 is sent to `/transcribe` → Faster Whisper generates timestamped segments
4. **Chunk** — Segments are grouped into ~512-char windows with 1-chunk overlap via `/add_overlap`
5. **Embed** — Each parent chunk AND each individual sentence gets a 1024-dim embedding
6. **Index** — Chunks are stored in Qdrant vector database via `/create_collection` + `/add`

### Retrieval Pipeline
1. **Query** — User types a natural language query in the Chat Interface
2. **Embed** — Query text is embedded via `/embedding`
3. **Search** — `/search` finds the top-k parent chunks from Qdrant
4. **Refine** — Manual dot-product similarity is computed over all sub-sentences within each chunk
5. **Return** — The highest-scoring individual sentence (with precise `start`/`end` timestamps) is returned
6. **Seek** — Video player auto-jumps to the exact second

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **CUDA-capable GPU** (for transcription & embedding)
- **Qdrant** running on `localhost:6333`
- **ngrok** (for tunneling the backend)

### Backend Setup

```bash
# Install Python dependencies
pip install fastapi uvicorn faster-whisper sentence-transformers qdrant-client requests

# Start Qdrant (Docker)
docker run -p 6333:6333 qdrant/qdrant

# Run the server
cd Utilis
python server.py
```

### Frontend Setup

```bash
cd Frontend/Ninaivinai
npm install
npm run dev
```

### Tunnel (ngrok)

```bash
ngrok http 8000
```
Update the `BASE_URL` in `Frontend/Ninaivinai/src/services/api.js` with your ngrok URL.

---

## 🧪 Testing

```bash
# Test all API endpoints against the remote server
python test_api.py

# Verify GPU/CUDA is being used
python test_gpu.py
```

---

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/transcribe` | Upload audio file → timestamped transcription |
| `POST` | `/embedding` | Text → 1024-dim vector embedding |
| `POST` | `/add_overlap` | Transcription → overlapping chunks with embeddings |
| `POST` | `/create_collection` | Create a new Qdrant vector collection |
| `POST` | `/add` | Store embedded chunks (with sentences) into Qdrant |
| `POST` | `/search` | Semantic search → returns exact sentence match |
| `POST` | `/search_with_filter` | Filtered semantic search |

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 8, React Router, Lucide Icons |
| Backend | FastAPI, Uvicorn, Python |
| Transcription | Faster Whisper (CTranslate2, CUDA) |
| Embeddings | BAAI/bge-m3 via SentenceTransformers (CUDA) |
| Vector DB | Qdrant |
| Tunnel | ngrok |
| Audio | lamejs (client-side MP3 encoding) |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
