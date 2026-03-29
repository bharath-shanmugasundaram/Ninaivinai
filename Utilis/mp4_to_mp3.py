import sys
import os

try:
    from moviepy.editor import AudioFileClip
except ImportError:
    print("Error: The 'moviepy' library is not installed.")
    print("Please install it by running: pip install moviepy")
    sys.exit(1)

def convert_mp4_to_mp3(mp4_file, mp3_file):
    if not os.path.exists(mp4_file):
        print(f"Error: The input file '{mp4_file}' does not exist.")
        return

    print(f"Converting '{mp4_file}' to '{mp3_file}'...")
    try:
        # Load the MP4 file
        audioclip = AudioFileClip(mp4_file)
        
        # Write it to the output file as MP3
        # We set logger=None to avoid excessive output in the terminal if you prefer a clean look
        audioclip.write_audiofile(mp3_file, logger=None)
        
        # Close the clip to free up system resources
        audioclip.close()
        
        print(f"Success! Audio saved as '{mp3_file}'")
    except Exception as e:
        print(f"\nAn error occurred during conversion:\n{e}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python mp4_to_mp3.py <input.mp4> <output.mp3>")
        print("Example: python mp4_to_mp3.py video.mp4 audio.mp3")
    else:
        input_video = sys.argv[1]
        output_audio = sys.argv[2]
        
        if not input_video.lower().endswith(".mp4"):
            print("Warning: Input file does not have an .mp4 extension.")
        if not output_audio.lower().endswith(".mp3"):
            print("Warning: Output file does not have an .mp3 extension.")
            
        convert_mp4_to_mp3(input_video, output_audio)
