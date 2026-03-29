export const extractAudioToMp3 = async (file) => {
  const globalObj = window.lamejs || window;
  const Mp3Encoder = globalObj.Mp3Encoder;
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        
        // Use an AudioContext to decode the video file
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Extract mono channel
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        
        // Initialize MP3 Encoder (Mono, SampleRate, 128kbps)
        const encoder = new Mp3Encoder(1, sampleRate, 128);
        
        const mp3Data = [];
        const sampleBlockSize = 1152;
        let int16Data = new Int16Array(channelData.length);
        
        // Convert Float32 (-1.0 to 1.0) to Int16
        for (let i = 0; i < channelData.length; i++) {
          let s = Math.max(-1, Math.min(1, channelData[i]));
          int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Encode in chunks to avoid blocking the thread too much (or breaking the encoder)
        for (let i = 0; i < int16Data.length; i += sampleBlockSize) {
          const chunk = int16Data.subarray(i, i + sampleBlockSize);
          const mp3buf = encoder.encodeBuffer(chunk);
          if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
          }
        }
        
        const mp3buf = encoder.flush();
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
        }

        const blob = new Blob(mp3Data, { type: 'audio/mp3' });
        
        // Return a File object
        const mp3File = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".mp3", { type: 'audio/mp3' });
        
        resolve(mp3File);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
