import os
import shutil
import requests
import tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException,Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import threading
import time
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, Filter, FieldCondition, MatchValue, PointStruct
from collections import deque
try:
    from Utils.embedding import sentence_embedding
except (ImportError, ValueError):
    from embedding import sentence_embedding

try:
    from Utils.transcriber import transcribe_to_json
except (ImportError, ValueError):
    from Utils.embedding import sentence_embedding
    from Utils.transcriber import transcribe_to_json
    
client = QdrantClient("http://localhost:6333")

app = FastAPI(title="Transcription API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "running swathii nambama link open pannuraa nii ??"}

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    allowed_extensions = {".mp3", ".wav", ".m4a", ".mp4", ".flac"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported file format: {file_ext}")

    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
        try:
            shutil.copyfileobj(file.file, tmp_file)
            tmp_path = tmp_file.name
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")
        finally:
            file.file.close()

    try:
        result = transcribe_to_json(tmp_path)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.post("/embedding")
async def embedding(json: dict = Body(...)):
    text = json["text"]
    
    json["embedding"] = sentence_embedding(text).tolist()
    return json


@app.post("/add_overlap")
async def add_overlap(chunks: dict = Body(...)):
    new_json = {
        "language": chunks.get("language", ""),
        "language_probability": chunks.get("language_probability", 1.0),
        "duration": chunks.get("duration", 0.0),
        "segments": []
    }
    segments = chunks.get("segments", [])
    if not segments:
        return new_json

    def build_segment(sentences_list):
        combined_text = "".join(s.get("text", "") for s in sentences_list)
        
        for s in sentences_list:
            if "embedding" not in s and "text" in s and s["text"].strip():
                s["embedding"] = sentence_embedding(s["text"]).tolist()

        return {
            "start": sentences_list[0].get("start", 0),
            "end": sentences_list[-1].get("end", 0),
            "text": combined_text,
            "embedding": sentence_embedding(combined_text).tolist(),
            "sentences": sentences_list
        }
        
    current_sentences = []
    
    for chunk in segments:
        current_text_len = sum(len(s.get("text", "")) for s in current_sentences)
        
        if current_text_len > 512 and current_sentences:
            new_json["segments"].append(build_segment(current_sentences))
            current_sentences = [current_sentences[-1], chunk]
        else:
            current_sentences.append(chunk)
            
    if current_sentences:
        new_json["segments"].append(build_segment(current_sentences))

    return new_json
    
    
@app.post("/create_collection")
async def create_collection(name: str = Body(...)):
    client = QdrantClient("http://localhost:6333")
    
    try:
        client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(size=1024, distance=Distance.COSINE)
        )
        return {"status": "collection created"}
    except Exception as e:
        return {"status": "collection already exists"}
    
    
@app.post("/add")
async def add_text(collectionname: str = Body(...),chunks: list = Body(...)):

    try:
        points = []
        for i, chunk in enumerate(chunks):
            points.append(
                PointStruct(
                    id=i,
                    vector=chunk["embedding"],
                    payload={
                        "text": chunk["text"],
                        "start": chunk.get("start", 0),
                        "end": chunk.get("end", 0),
                        "sentences": chunk.get("sentences", [])
                    }
                )
            )
            
        client.upsert(collection_name=collectionname,points=points)
        return {"status": "success"}

    except Exception as e:
        return {"status": "error"}
    
def find_best_sentence_match(query_embedding, payload):
    sentences = payload.get("sentences", [])
    if not sentences:
        p = dict(payload)
        p.pop("sentences", None)
        return p
        
    best_sentence = None
    best_score = -float('inf')
    
    for s in sentences:
        s_emb = s.get("embedding")
        if not s_emb or len(s_emb) != len(query_embedding):
            continue
        try:
            score = sum(a * b for a, b in zip(query_embedding, s_emb))
            if score > best_score:
                best_score = score
                best_sentence = s
        except Exception:
            continue
            
    if best_sentence:
        ret = dict(best_sentence)
        ret.pop("embedding", None)
        return ret
        
    p = dict(payload)
    p.pop("sentences", None)
    return p

@app.post("/search")
async def search(collectionname: str = Body(...),embedding: list = Body(...),k: int = Body(...)):
    try:
        response = requests.post(f"http://localhost:6333/collections/{collectionname}/points/search", json={
            "vector": embedding,
            "limit": k,
            "with_payload": True
        })
        response.raise_for_status()
        results = response.json().get("result", [])
        return [{"id": res["id"], "score": res["score"], "payload": find_best_sentence_match(embedding, res.get("payload", {}))} for res in results]
    except Exception as e:
        return {"status": "error", "detail": str(e)}

@app.post("/search_with_filter")
async def search_with_filter(collectionname: str = Body(...),embedding: list = Body(...),k: int = Body(...),filter: dict = Body(...)):
    try:
        response = requests.post(f"http://localhost:6333/collections/{collectionname}/points/search", json={
            "vector": embedding,
            "limit": k,
            "filter": {
                "must": [
                    {
                        "key": filter["key"],
                        "match": {"value": filter["value"]}
                    }
                ]
            },
            "with_payload": True
        })
        response.raise_for_status()
        results = response.json().get("result", [])
        return [{"id": res["id"], "score": res["score"], "payload": find_best_sentence_match(embedding, res.get("payload", {}))} for res in results]
    except Exception as e:
        return {"status": "error", "detail": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)