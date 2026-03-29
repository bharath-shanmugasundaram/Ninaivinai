import os
import sys
import json
import requests
import tempfile
from moviepy import VideoFileClip

API_ENDPOINT_TRANS = "https://alessandra-gluteal-rowena.ngrok-free.dev/transcribe" 
API_ENDPOINT_EMB = "https://alessandra-gluteal-rowena.ngrok-free.dev/embedding"
API_KEY      = "ngrok-free-dev"                  


def extract_audio(video_path: str, output_path: str) -> str:
    print(f"[1/3] Extracting audio from: {video_path}")
    clip = VideoFileClip(video_path)
    clip.audio.write_audiofile(output_path, logger=None)
    clip.close()
    print(f"      Audio saved to: {output_path}")
    return output_path


def transcribe_audio(audio_path: str) -> dict:
    print(f"[2/3] Sending audio to transcription API...")
    headers = {
        "Authorization": f"Bearer {API_KEY}",
    }
    with open(audio_path, "rb") as f:
        files = {"file": (os.path.basename(audio_path), f, "audio/wav")}
        response = requests.post(API_ENDPOINT_TRANS, headers=headers, files=files)

    response.raise_for_status()
    return response.json()


def display_timestamps(transcription: dict):
    print(f"\n[3/3] Transcription Result:\n{'─'*50}")

    segments = transcription.get("segments", [])

    if not segments:
        print(json.dumps(transcription, indent=2))
        return

    for seg in segments:
        start = seg.get("start", 0)
        end   = seg.get("end", 0)
        text  = seg.get("text", "").strip()
        print(f"[{start:.2f}s → {end:.2f}s]  {text}")

    print('─'*50)


def save_json(transcription: dict, video_path: str):
    out_path = os.path.splitext(video_path)[0] + "_transcription.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(transcription, f, indent=2, ensure_ascii=False)
    print(f"JSON saved to: {out_path}")


def save_txt(transcription: dict, video_path: str):
    out_path = os.path.splitext(video_path)[0] + "_transcription.txt"
    segments = transcription.get("segments", [])

    with open(out_path, "w", encoding="utf-8") as f:
        if not segments:
            f.write(json.dumps(transcription, indent=2))
        else:
            for seg in segments:
                start = seg.get("start", 0)
                end   = seg.get("end", 0)
                text  = seg.get("text", "").strip()
                f.write(f"[{start:.2f}s → {end:.2f}s]  {text}\n")

    print(f"TXT saved to: {out_path}")

def get_embedding(text: str) -> dict:
    headers = {
        "Authorization": f"Bearer {API_KEY}",
    }
    payload = {"text": text}
    # We must send it as `json=` so the Content-Type is application/json
    response = requests.post(API_ENDPOINT_EMB, headers=headers, json=payload)

    response.raise_for_status()
    return response.json()


def process_video(video_path: str):
    if not os.path.exists(video_path):
        print(f"Error: file not found → {video_path}")
        sys.exit(1)

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        audio_path = tmp.name

    try:
        extract_audio(video_path, audio_path)
        transcription = transcribe_audio(audio_path)
        print(json.dumps(transcription))
        display_timestamps(transcription)
        save_json(transcription, video_path)
        save_txt(transcription, video_path)
        
            
    finally:
        os.remove(audio_path)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)

    process_video(sys.argv[1])
