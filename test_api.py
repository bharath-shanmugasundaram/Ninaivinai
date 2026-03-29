import os
import sys
import time
import wave
import json
import requests
import tempfile

# Ensure this matches your ngrok domain exactly
BASE_URL = "https://alessandra-gluteal-rowena.ngrok-free.dev"

# Passing this header allows bypassing the ngrok browser warning page for free tiers
HEADERS = {
    "ngrok-skip-browser-warning": "true" 
}

def create_dummy_wav():
    """Create a 1-second silent WAV file to safely test the transcribe endpoint without relying on real local media."""
    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    with wave.open(tmp.name, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(44100)
        wf.writeframes(b'\x00' * 44100 * 2) 
    return tmp.name

def test_home():
    print("Testing GET / ...")
    try:
        res = requests.get(f"{BASE_URL}/", headers=HEADERS)
        print("Status:", res.status_code)
        print("Response:", res.text)
    except Exception as e:
        print(f"Failed to connect: {e}")
    print("-" * 50)

def test_transcribe(wav_path):
    print("Testing POST /transcribe ...")
    try:
        with open(wav_path, "rb") as f:
            files = {"file": (os.path.basename(wav_path), f, "audio/wav")}
            res = requests.post(f"{BASE_URL}/transcribe", headers=HEADERS, files=files)
        print("Status:", res.status_code)
        if res.status_code == 200:
            print("Response:", res.json())
        else:
            print("Raw Error Output:", res.text)
    except Exception as e:
         print(f"Transcribe request failed: {e}")
    print("-" * 50)

def test_embedding():
    print("Testing POST /embedding ...")
    payload = {"text": "This is a sample sentence to test the embedding API."}
    try:
        res = requests.post(f"{BASE_URL}/embedding", headers=HEADERS, json=payload)
        print("Status:", res.status_code)
        if res.status_code == 200:
            data = res.json()
            embedding = data.get("embedding", [])
            print(f"Success! Embedding generated with float dimensions: {len(embedding)}")
            return embedding
        else:
            print("Raw Error Output:", res.text)
    except Exception as e:
         print(f"Embedding request failed: {e}")
    print("-" * 50)
    return None

def test_add_overlap():
    print("Testing POST /add_overlap ...")
    # Generating dummy segments that will exceed the 512 character limit
    # We include dummy original embeddings to verify they are preserved in the sentences array
    payload = {
        "language": "en",
        "language_probability": 0.99,
        "duration": 15.0,
        "segments": [
            {"start": 0.0, "end": 5.0, "text": "This chunk is quite long. " * 12, "embedding": [0.1, 0.2, 0.3]},
            {"start": 5.0, "end": 10.0, "text": "This is the second long chunk. " * 10, "embedding": [0.4, 0.5, 0.6]},
            {"start": 10.0, "end": 15.0, "text": "Finally this is the third chunk to finish it up. ", "embedding": [0.7, 0.8, 0.9]} 
        ]
    }
    
    try:
        res = requests.post(f"{BASE_URL}/add_overlap", headers=HEADERS, json=payload)
        print("Status:", res.status_code)
        if res.status_code == 200:
            data = res.json()
            segments = data.get("segments", [])
            print(f"Success! Output grouped into {len(segments)} overlapped segments.")
            for i, seg in enumerate(segments):
                print(f"   ↳ Segment {i+1}: Start={seg.get('start')}s | End={seg.get('end')}s")
                parent_emb = seg.get('embedding', [])
                print(f"      - Parent Generated Embedding: {'Exists (length ' + str(len(parent_emb)) + ')' if parent_emb else 'Missing!'}")
                
                sentences = seg.get('sentences', [])
                print(f"      - Preserved sub-chunks: {len(sentences)}")
                if sentences:
                    sub_emb = sentences[0].get('embedding', [])
                    print(f"      - Sub-chunk 1 Original Embedding Length: {len(sub_emb)}")
        else:
            print("Raw Error Output:", res.text)
    except Exception as e:
         print(f"Overlap request failed: {e}")
    print("-" * 50)

def test_qdrant_flow(embedding):
    print("Testing Qdrant Database Integration (Collection -> Add -> Search) ...")
    
    col_name = "api_test_collection"
    
    # 1. Create collection
    print(f"\n[1/3] Creating collection '{col_name}'...")
    # NOTE: FastAPI literal Body(...) implies we just pass the string payload directly
    res_create = requests.post(f"{BASE_URL}/create_collection", headers=HEADERS, json=col_name)
    print("Status:", res_create.status_code, "→", res_create.text)

    # 2. Add embeddings to collection
    print("\n[2/3] Adding points to collection...")
    zero_emb = [0.0] * len(embedding)
    chunk_data = [
        {
            "embedding": embedding,
            "text": "Parent chunk text with multiple sentences. This is the exact match!",
            "start": 0.0,
            "end": 2.5,
            "sentences": [
                {
                    "text": "Parent chunk text with multiple sentences.",
                    "start": 0.0,
                    "end": 1.0,
                    "embedding": zero_emb
                },
                {
                    "text": "This is the exact match!",
                    "start": 1.0,
                    "end": 2.5,
                    "embedding": embedding
                }
            ]
        }
    ]
    payload_add = {"collectionname": col_name, "chunks": chunk_data}
    res_add = requests.post(f"{BASE_URL}/add", headers=HEADERS, json=payload_add)
    print("Status:", res_add.status_code, "→", res_add.text)

    # 3. Search the vector
    print("\n[3/3] Searching the database for similar vectors...")
    payload_search = {
        "collectionname": col_name,
        "embedding": embedding,
        "k": 1
    }
    res_search = requests.post(f"{BASE_URL}/search", headers=HEADERS, json=payload_search)
    print("Status:", res_search.status_code)
    try:
        if res_search.status_code == 200:
            results = res_search.json()
            print(f"Found {len(results)} matches!")
            if results:
                print("Top Exact Match payload:", results[0].get("payload"))
        else:
            print("Raw error:", res_search.text)
    except Exception as e:
        print("Search parsing failed:", e)
    print("-" * 50)


if __name__ == "__main__":
    print("\n=== STARTING API VERIFICATION TESTS ===\n")
    wav_path = create_dummy_wav()
    try:
        test_home()
        test_transcribe(wav_path)
        test_add_overlap()
        
        emb = test_embedding()
        if emb:
            test_qdrant_flow(emb)
        else:
            print("Skipped Qdrant integration tests because /embedding failed.")
            
    finally:
        if os.path.exists(wav_path):
            os.remove(wav_path)
    
    print("\n=== FULL TESTS FINISHED ===")
