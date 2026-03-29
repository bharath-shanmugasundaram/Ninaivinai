import time
import torch

def test_system_gpu():
    print("\n=== [1/3] System GPU Check ===")
    cuda_available = torch.cuda.is_available()
    print(f"PyTorch CUDA Available: {cuda_available}")
    if cuda_available:
        print(f"Device Count: {torch.cuda.device_count()}")
        print(f"Current Device Name: {torch.cuda.get_device_name(0)}")
        print(f"CUDA Version: {torch.version.cuda}")
    else:
        print("WARNING: PyTorch cannot detect a CUDA GPU! If you are on the cloud, ensure your instance has a T4/A10G/etc. attached and NVIDIA drivers installed.")

def test_sentence_transformer():
    print("\n=== [2/3] SentenceTransformer GPU Check ===")
    try:
        from sentence_transformers import SentenceTransformer
        print("Loading BAAI/bge-m3 on CUDA...")
        
        start = time.time()
        # This will explicitly crash or fallback if CUDA is completely broken
        model = SentenceTransformer("BAAI/bge-m3", device="cuda")
        print(f"Model loaded in {time.time() - start:.2f}s")
        
        print(f"SentenceTransformer active device: {model.device}")
        if "cuda" in str(model.device):
            print("✅ SUCCESS: SentenceTransformer is officially utilizing the GPU!")
        else:
            print("❌ FAILED: SentenceTransformer is running on CPU!")
    except Exception as e:
        print(f"❌ ERROR: Failed to load SentenceTransformer on GPU: {e}")

def test_whisper():
    print("\n=== [3/3] Faster Whisper GPU Check ===")
    try:
        from faster_whisper import WhisperModel
        print("Loading base.en on CUDA with float16...")
        
        start = time.time()
        model = WhisperModel("base.en", device="cuda", compute_type="float16")
        print(f"Model loaded in {time.time() - start:.2f}s")
        print("✅ SUCCESS: Faster Whisper successfully initialized and allocated VRAM on the GPU!")
    except ValueError as ve:
        if "float16" in str(ve).lower():
            print(f"⚠️ WARNING: Your GPU doesn't support fp16 (or drivers are missing). Try compute_type='int8' instead.\nExact error: {ve}")
        else:
            print(f"❌ ERROR: Failed to load Faster Whisper on GPU: {ve}")
    except Exception as e:
        print(f"❌ ERROR: Failed to load Faster Whisper on GPU: {e}")

if __name__ == "__main__":
    print("\n🔍 GPU INFERENCE VERIFICATION SCRIPT 🔍")
    test_system_gpu()
    test_sentence_transformer()
    test_whisper()
    print("\n=== TESTS FINISHED ===\n")
