import json
import os
import sys
from faster_whisper import WhisperModel


model = WhisperModel("base.en", device="cuda", compute_type="float16")

def transcribe_to_json(audio_path: str) -> dict:
   
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    print(f"Transcribing: {audio_path} ...")
    
    segments, info = model.transcribe(audio_path, beam_size=5)
    print(segments)
    output_segments = []
    for segment in segments:
        output_segments.append({
            "start": round(segment.start, 2),
            "end": round(segment.end, 2),
            "text": segment.text.strip()
        })

    result = {
        "language": info.language,
        "language_probability": info.language_probability,
        "duration": round(info.duration, 2),
        "segments": output_segments
    }

    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcriber.py <path_to_audio_file>")
        sys.exit(1)

    audio_file = sys.argv[1]
    try:
        data = transcribe_to_json(audio_file)
        
        print(json.dumps(data, indent=2, ensure_ascii=False))
        
        output_json = os.path.splitext(audio_file)[0] + ".json"
        with open(output_json, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"\nSaved results to: {output_json}")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
