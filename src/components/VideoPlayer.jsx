import { forwardRef, useImperativeHandle, useRef } from 'react';
import './VideoPlayer.css';

const VideoPlayer = forwardRef(({ videoSrc }, ref) => {
  const videoRef = useRef(null);

  useImperativeHandle(ref, () => ({
    seekTo: (timestampSeconds) => {
      if (videoRef.current) {
        videoRef.current.currentTime = timestampSeconds;
        videoRef.current.play().catch(e => console.log('Autoplay prevented:', e));
      }
    }
  }));

  return (
    <div className="video-player-wrapper glass-panel">
      <video
        ref={videoRef}
        className="html-video"
        controls
        src={videoSrc || "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
