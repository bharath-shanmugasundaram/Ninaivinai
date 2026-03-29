# Ninaivinai

> *"Ninaivinai"* (நினைவினை) — Tamil for **"memory"**

**Search videos by meaning, not by timestamps.**

Ninaivinai is a full-stack **Retrieval-Augmented Generation (RAG)** application that transforms video content into a searchable semantic memory. Upload any video — a meeting, a lecture, a podcast — and instantly find the exact moment you're looking for using natural language. Instead of scrubbing through hours of footage, simply type *"when did they discuss the budget?"* and the video jumps to the precise second.

---

## Features

- **GPU-Accelerated Transcription** — Real-time speech-to-text powered by [Faster Whisper](https://github.com/SYSTRAN/faster-whisper) (CTranslate2 engine) running on CUDA with `float16` precision
- **Overlapping Semantic Chunking** — Raw transcription segments are intelligently merged into ~512-character context windows. Each window overlaps by exactly 1 segment with the previous, ensuring no conversational context is lost at chunk boundaries
- **Dual-Layer Embeddings** — Every 512-char parent chunk gets a 1024-dimensional vector embedding via [BAAI/bge-m3](https://huggingface.co/BAAI/bge-m3). Additionally, each individual sentence within a chunk also receives its own independent embedding, enabling sub-chunk precision during retrieval
- **Two-Stage Search** — Stage 1: Qdrant vector DB retrieves the top-k most similar parent chunks. Stage 2: A manual dot-product similarity loop runs over all sub-sentences within each chunk to surface the single most relevant sentence with its exact timestamp
- **Instant Video Seek** — Search results carry precise `start` and `end` timestamps. The frontend's `VideoPlayer` component auto-seeks to the exact second
- **Dark/Light Theme** — Premium glassmorphism UI with smooth theme transitions
- **Client-Side Audio Extraction** — Video-to-MP3 conversion happens entirely in-browser using Web Audio API + lamejs encoder, saving upload bandwidth
- **CORS Enabled** — Full cross-origin support via FastAPI middleware for seamless frontend-backend communication through ngrok tunnels

---

## System Architecture

```
+---------------------------------------------------------------+
|                     FRONTEND (React + Vite)                   |
|                                                               |
|  LandingPage --> Dashboard --> Workspace                      |
|                   (Drag & Drop)   +----------+--------------+ |
|                                   |  Video   |    Chat      | |
|                                   |  Player  |<- Interface  | |
|                                   +----------+  (query box) | |
|                                                  |           | |
|  audioConverter.js --> MP3 in-browser             |           | |
|  api.js --> All HTTP calls to backend             |           | |
+---------------------------------------------------+-----------+
                                                    | HTTPS
                                              +-----+-----+
                                              |   ngrok   |
                                              +-----+-----+
                                                    | HTTP
+---------------------------------------------------+-----------+
|                   BACKEND (FastAPI + Uvicorn)      |           |
|                                                    |           |
|  POST /transcribe -----> faster_whisper (CUDA)     |           |
|  POST /embedding  -----> BAAI/bge-m3 (CUDA)        |           |
|  POST /add_overlap ----> Chunk + Embed all layers  |           |
|  POST /add ------------> Upsert to Qdrant          |           |
|  POST /search ---------> Qdrant search             |           |
|                          +-> dot-product refinement |           |
|                             +-> exact sentence match|           |
|                                                               |
|  CORS Middleware enabled (allow_origins=["*"])                 |
+---------------------------------------------------------------+
                               |
                    +----------+----------+
                    |   Qdrant Vector DB  |
                    |   localhost:6333    |
                    |   1024-dim cosine   |
                    +---------------------+
```

---

## Project Structure

```
Ninaivinai/
|
+-- Frontend/Ninaivinai/              # React 19 + Vite 8 SPA
|   +-- src/
|   |   +-- components/
|   |   |   +-- VideoPlayer.jsx       # HTML5 video with imperative seekTo() API
|   |   |   +-- ChatInterface.jsx     # Chat UI: embed query -> search DB -> display results
|   |   |   +-- NavigationBar.jsx     # Top nav with theme toggle
|   |   +-- pages/
|   |   |   +-- LandingPage.jsx       # Hero page with product overview
|   |   |   +-- Dashboard.jsx         # Drag-and-drop video upload zone
|   |   |   +-- Workspace.jsx         # Main workspace: runs full ingestion pipeline
|   |   |   +-- LoginPage.jsx         # Auth UI (sign in / sign up)
|   |   +-- services/
|   |   |   +-- api.js                # All backend API calls (transcribe, embed, search, etc.)
|   |   |   +-- mockApi.js            # Mock data for offline development
|   |   +-- contexts/
|   |   |   +-- ThemeContext.jsx       # Dark/Light mode state management
|   |   |   +-- AuthContext.jsx        # Authentication state management
|   |   +-- utils/
|   |   |   +-- audioConverter.js      # In-browser video -> MP3 conversion (Web Audio API + lamejs)
|   |   +-- App.jsx                    # Root component with React Router
|   |   +-- main.jsx                   # Entry point
|   |   +-- index.css                  # Global design tokens and styles
|   +-- package.json
|
+-- Utilis/                            # Backend server & ML models
|   +-- server.py                      # FastAPI app with all API endpoints
|   +-- embedding.py                   # SentenceTransformer model loader (BAAI/bge-m3, CUDA)
|   +-- transcriber.py                 # Faster Whisper model loader (base.en, CUDA, float16)
|   +-- runner.py                      # Keep-alive pinger to prevent ngrok tunnel timeout
|   +-- mp4_to_mp3.py                  # Utility: convert video to audio locally
|
+-- vid2text/                          # Standalone CLI pipeline
|   +-- main.py                        # Extract audio -> transcribe -> save JSON/TXT
|
+-- test_api.py                        # Full integration test suite for all endpoints
+-- test_gpu.py                        # CUDA/GPU verification script
+-- audio/                             # Sample transcription outputs
|   +-- vi.mp4                         # Sample video file
|   +-- vi_transcription.json          # Sample JSON transcription output
|   +-- vi_transcription.txt           # Sample human-readable transcription
|
+-- README.md
```

---

## Detailed Workflow

### Phase 1: Ingestion Pipeline (What happens when you upload a video)

The `Workspace.jsx` component orchestrates the entire pipeline automatically:

#### Step 1 — Client-Side Audio Extraction
`audioConverter.js` uses the browser's native `AudioContext` to decode the video file, extracts the mono audio channel, converts Float32 samples to Int16, and encodes them into MP3 using the lamejs encoder — all without sending the heavy video file over the network.

#### Step 2 — Transcription (`POST /transcribe`)
The extracted MP3 is uploaded to the backend. `transcriber.py` loads **Faster Whisper** (`base.en` model) on CUDA with `float16` precision and generates timestamped segments:

```json
{
  "language": "en",
  "language_probability": 1,
  "duration": 59.88,
  "segments": [
    { "start": 0.48, "end": 6.24, "text": "Long, long ago, when the company..." },
    { "start": 6.24, "end": 13.44, "text": "I used to ask my teammates..." },
    { "start": 13.44, "end": 18.96, "text": "for personal productivity?..." }
  ]
}
```

#### Step 3 — Semantic Chunking (`POST /add_overlap`)
Raw segments are too small for meaningful semantic search. The `/add_overlap` endpoint merges consecutive segments into larger ~512-character windows. When a window exceeds 512 characters, it is finalized and a new window begins — **overlapping by exactly 1 segment** with the previous window to preserve conversational continuity.

During this step, `embedding.py` computes two layers of embeddings:
- **Parent embedding** (1024-dim) — for the entire concatenated 512-char text
- **Sentence embeddings** (1024-dim each) — for every individual sub-segment within the window

```json
{
  "language": "en",
  "duration": 59.88,
  "segments": [
    {
      "start": 0.48,
      "end": 38.80,
      "text": "Long, long ago...The company gives you a lot of stuff.",
      "embedding": [0.0234, -0.0891, "...1024 floats..."],
      "sentences": [
        {
          "start": 0.48, "end": 6.24,
          "text": "Long, long ago...",
          "embedding": [0.0412, -0.0123, "...1024 floats..."]
        },
        {
          "start": 6.24, "end": 13.44,
          "text": "I used to ask my teammates...",
          "embedding": [0.0567, -0.0234, "...1024 floats..."]
        }
      ]
    },
    {
      "start": 33.12,
      "end": 58.16,
      "text": "Until then?...So tell me.",
      "embedding": [0.0189, -0.0456, "...1024 floats..."],
      "sentences": [
        {
          "start": 33.12, "end": 38.80,
          "text": "Until then?...",
          "embedding": [0.0345, -0.0567, "...1024 floats..."]
        }
      ]
    }
  ]
}
```

> **Note:** The sentence starting at `33.12s` exists in **both** chunks — this is the overlap ensuring no context is lost.

#### Step 4 — Vector Indexing (`POST /create_collection` + `POST /add`)
A unique Qdrant collection is created per video (named from the filename + timestamp). Each 512-char segment is stored as a point in the vector space, with the parent embedding as the vector and the full payload (text, timestamps, and the entire `sentences` array with their individual embeddings) stored as metadata.

---

### Phase 2: Retrieval Pipeline (What happens when you search)

#### Step 1 — Query Embedding (`POST /embedding`)
The `ChatInterface` component takes the user's natural language query and sends it to `/embedding`, which returns a 1024-dim vector representation of the query text.

#### Step 2 — Coarse Search (`POST /search` -> Qdrant)
The query vector is sent to Qdrant via the REST API (`localhost:6333`). Qdrant performs a cosine similarity search across all parent chunk vectors and returns the top-k matches (default k=3).

#### Step 3 — Fine-Grained Refinement (Dot-Product over Sub-Sentences)
This is where Ninaivinai's precision comes from. For each Qdrant result, the `find_best_sentence_match()` function in `server.py` iterates over every sentence stored in the payload and computes a **manual dot-product similarity** between the query embedding and each sentence embedding:

```python
score = sum(a * b for a, b in zip(query_embedding, sentence_embedding))
```

The sentence with the highest score is selected, and only its `text`, `start`, and `end` are returned — stripping out all embedding arrays to keep the response lightweight.

#### Step 4 — Video Seek
The `ChatInterface` receives the response and calls `onTimestampFound(topMatch.start)`, which triggers `VideoPlayer.seekTo(timestamp)` — the video immediately jumps to the precise second.

**Final Search Response:**
```json
[
  {
    "id": 0,
    "score": 0.9124,
    "payload": {
      "text": "for personal productivity? When everybody got a phone...",
      "start": 13.44,
      "end": 18.96
    }
  }
]
```

---

## Getting Started

### Prerequisites

| Requirement | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | Backend runtime |
| Node.js | 18+ | Frontend build tooling |
| NVIDIA GPU | CUDA 11.x+ | Accelerated inference |
| Docker | Any | Running Qdrant |
| ngrok | Any | Tunneling backend to frontend |

### 1. Start Qdrant Vector Database

```bash
docker run -d -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

Verify it's running: `http://localhost:6333/dashboard`

### 2. Install Python Dependencies

```bash
pip install fastapi uvicorn faster-whisper sentence-transformers qdrant-client requests moviepy
```

### 3. Start the Backend Server

```bash
cd Utilis
python server.py
# Server starts on http://0.0.0.0:8000
```

On first run, the models will be downloaded automatically:
- `BAAI/bge-m3` (~2.2GB) — embedding model
- `base.en` (~140MB) — Whisper transcription model

### 4. Expose Backend via ngrok

```bash
ngrok http 8000
```

Copy the generated HTTPS URL (e.g., `https://xxxx.ngrok-free.dev`) and update it in:
- `Frontend/Ninaivinai/src/services/api.js` -> `BASE_URL`
- `vid2text/main.py` -> `API_ENDPOINT_TRANS` and `API_ENDPOINT_EMB`
- `Utilis/runner.py` -> ping URL

### 5. Start the Frontend

```bash
cd Frontend/Ninaivinai
npm install
npm run dev
# Opens on http://localhost:5173
```

### 6. Keep Tunnel Alive (Optional)

```bash
python Utilis/runner.py
# Pings the ngrok URL every 5 minutes to prevent idle timeout
```

---

## Testing

### API Integration Tests

```bash
python test_api.py
```

Tests all 6 endpoints sequentially:
1. `GET /` — Health check
2. `POST /transcribe` — Sends a generated silent WAV file
3. `POST /add_overlap` — Sends mock segments with dummy embeddings, verifies overlap grouping and parent embedding generation
4. `POST /embedding` — Sends sample text, verifies 1024-dim output
5. `POST /create_collection` + `POST /add` — Creates a test collection and inserts a chunk with 2 sub-sentences (one with matching embedding, one with zeros)
6. `POST /search` — Searches with the matching embedding and verifies the dot-product refinement returns the exact sub-sentence (`"This is the exact match!"`)

### GPU Verification

```bash
python test_gpu.py
```

Runs 3 checks:
1. PyTorch CUDA detection (device name, CUDA version)
2. SentenceTransformer initialization on CUDA
3. Faster Whisper initialization on CUDA with float16

---

## API Reference

### `GET /`
Health check endpoint.

**Response:** `{"status": "running..."}`

---

### `POST /transcribe`
Upload an audio file for transcription.

**Content-Type:** `multipart/form-data`  
**Body:** `file` — audio file (.mp3, .wav, .m4a, .mp4, .flac)

**Response:**
```json
{
  "language": "en",
  "language_probability": 1,
  "duration": 59.88,
  "segments": [
    { "start": 0.48, "end": 6.24, "text": "..." }
  ]
}
```

---

### `POST /embedding`
Generate a 1024-dimensional embedding for input text.

**Content-Type:** `application/json`  
**Body:** `{"text": "your query here"}`

**Response:**
```json
{
  "text": "your query here",
  "embedding": [0.0234, -0.0891, "...1024 floats..."]
}
```

---

### `POST /add_overlap`
Process raw transcription into overlapping semantic chunks with dual-layer embeddings.

**Content-Type:** `application/json`  
**Body:** Full transcription JSON from `/transcribe`

**Response:** Chunked transcription with parent + sentence embeddings (see Workflow section above)

---

### `POST /create_collection`
Create a new Qdrant vector collection (1024-dim, cosine distance).

**Content-Type:** `application/json`  
**Body:** `"collection_name"` (string)

**Response:** `{"status": "collection created"}` or `{"status": "collection already exists"}`

---

### `POST /add`
Insert embedded chunks into a Qdrant collection. Stores the full sentences array in the payload for sub-chunk retrieval.

**Content-Type:** `application/json`  
**Body:**
```json
{
  "collectionname": "my_video_collection",
  "chunks": [
    {
      "embedding": [0.02, -0.08, "...1024 floats..."],
      "text": "...",
      "start": 0.0,
      "end": 10.0,
      "sentences": ["..."]
    }
  ]
}
```

**Response:** `{"status": "success"}`

---

### `POST /search`
Semantic search with automatic sentence-level refinement.

**Content-Type:** `application/json`  
**Body:**
```json
{
  "collectionname": "my_video_collection",
  "embedding": [0.02, -0.08, "...1024 floats..."],
  "k": 3
}
```

**Response:**
```json
[
  {
    "id": 0,
    "score": 0.9124,
    "payload": {
      "text": "Exact matching sentence text",
      "start": 13.44,
      "end": 18.96
    }
  }
]
```

> **Note:** The `payload` contains the best-matching **individual sentence** (not the full 512-char chunk), with embedding arrays stripped for lightweight responses.

---

### `POST /search_with_filter`
Same as `/search` but with Qdrant payload filtering.

**Body** (additional field):
```json
{
  "filter": { "key": "language", "value": "en" }
}
```

---

## Tech Stack

| Layer | Technology | Details |
|-------|------------|---------|
| Frontend | React 19 + Vite 8 | SPA with React Router v7, Lucide icons |
| Backend | FastAPI + Uvicorn | Async Python web server with CORS middleware |
| Transcription | Faster Whisper | CTranslate2 engine, `base.en` model, CUDA float16 |
| Embeddings | BAAI/bge-m3 | 1024-dim multilingual embeddings via SentenceTransformers |
| Vector DB | Qdrant | Cosine similarity, REST API on port 6333 |
| Tunnel | ngrok | HTTPS tunnel for remote GPU access |
| Audio Encoding | lamejs | Client-side MP3 encoding via Web Audio API |

---

## Credits

- **Frontend Development** — *[Frontend Developer Name]*
- **Backend & ML Pipeline** — Bharath Shanmugasundaram

---

## License

This project is open source and available under the [MIT License](LICENSE).
