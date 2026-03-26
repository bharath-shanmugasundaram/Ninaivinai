import React, { useRef } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import ChatInterface from '../components/ChatInterface';
import '../App.css'; 

const Workspace = () => {
  const location = useLocation();
  const videoPlayerRef = useRef(null);

  // If user navigates here directly without a video, send them to dashboard
  if (!location.state || !location.state.videoSrc) {
    return <Navigate to="/dashboard" replace />;
  }

  const { videoSrc, fileName } = location.state;

  const handleTimestampSelected = (timestamp) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(timestamp);
    }
  };

  return (
    <div className="app-container" style={{ paddingTop: '80px' }}>
      {/* We add paddingTop because NavigationBar has position: absolute */}
      
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Analyzing: <span style={{ color: 'var(--accent-color)' }}>{fileName}</span></h2>
      </div>

      <main className="main-content">
        <section className="video-section glass-panel">
          <VideoPlayer ref={videoPlayerRef} videoSrc={videoSrc} />
        </section>
        
        <section className="chat-section glass-panel">
          <ChatInterface onTimestampFound={handleTimestampSelected} />
        </section>
      </main>
    </div>
  );
};

export default Workspace;
