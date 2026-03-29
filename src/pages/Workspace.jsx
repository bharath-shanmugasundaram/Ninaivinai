import React, { useRef, useState, useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { Loader2, BrainCircuit, FileText, Database, CheckCircle2, AlertCircle, FileAudio } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import ChatInterface from '../components/ChatInterface';
import { transcribeAudio, addOverlap, createCollection, addChunksToDb } from '../services/api';
import { extractAudioToMp3 } from '../utils/audioConverter';
import '../App.css'; 

const Workspace = () => {
  const location = useLocation();
  const videoPlayerRef = useRef(null);
  
  const [pipelineState, setPipelineState] = useState('idle'); // idle, transcribing, chunking, indexing, ready, error
  const [collectionName, setCollectionName] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // If user navigates here directly without a video, send them to dashboard
  if (!location.state || !location.state.videoSrc) {
    return <Navigate to="/dashboard" replace />;
  }

  const { videoSrc, fileName, file } = location.state;

  useEffect(() => {
    if (file && pipelineState === 'idle') {
      const runPipeline = async () => {
        try {
          // 0. Extract Audio
          setPipelineState('extracting_audio');
          const audioFile = await extractAudioToMp3(file);

          // 1. Transcribe
          setPipelineState('transcribing');
          const transcribeRes = await transcribeAudio(audioFile);
          
          // 2. Add overlap chunks
          setPipelineState('chunking');
          const chunkedRes = await addOverlap(transcribeRes);
          
          // 3. Create Vector DB Collection
          setPipelineState('indexing');
          const safeName = fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() + '_' + Date.now();
          await createCollection(safeName);
          
          // 4. Add to DB
          if (chunkedRes && chunkedRes.segments && chunkedRes.segments.length > 0) {
            await addChunksToDb(safeName, chunkedRes.segments);
          }
          
          setCollectionName(safeName);
          setPipelineState('ready');
        } catch (error) {
          console.error(error);
          setErrorMsg(error.message || "An error occurred during processing");
          setPipelineState('error');
        }
      };
      
      runPipeline();
    } else if (!file && pipelineState === 'idle') {
       // Just in case it's a mock load without a file drop
       setPipelineState('ready');
    }
  }, [file]);

  const handleTimestampSelected = (timestamp) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(timestamp);
    }
  };

  const renderLoadingScreen = () => {
    if (pipelineState === 'error') {
      return (
        <div className="processing-fullscreen glass-panel" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', marginTop: '20px', padding: '60px 20px', textAlign: 'center'
        }}>
          <AlertCircle size={64} color="#ff4c4c" style={{ marginBottom: '20px' }} />
          <h2>Analysis Failed</h2>
          <p style={{ color: '#ff4c4c', marginTop: '10px' }}>{errorMsg}</p>
        </div>
      );
    }

    const steps = [
      { id: 'extracting_audio', label: 'Extracting MP3 Locally', icon: <FileAudio size={24} /> },
      { id: 'transcribing', label: 'Transcribing Audio', icon: <FileText size={24} /> },
      { id: 'chunking', label: 'Semantic Chunking', icon: <BrainCircuit size={24} /> },
      { id: 'indexing', label: 'Building Vector Index', icon: <Database size={24} /> }
    ];

    const currentStepIndex = steps.findIndex(s => s.id === pipelineState);

    const getProgress = () => {
      if (pipelineState === 'extracting_audio') return 15;
      if (pipelineState === 'transcribing') return 35;
      if (pipelineState === 'chunking') return 65;
      if (pipelineState === 'indexing') return 90;
      if (pipelineState === 'ready') return 100;
      return 0;
    };
    const progress = getProgress();

    return (
      <div className="processing-fullscreen glass-panel" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', marginTop: '20px', padding: '60px 20px', textAlign: 'center'
      }}>
        <div style={{ width: '100%', maxWidth: '400px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>Unlocking Memory</h2>
            <span style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-color)', lineHeight: 1 }}>{progress}%</span>
          </div>
          <div style={{ 
            width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', 
            borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              height: '100%', width: `${progress}%`, background: 'var(--accent-gradient)',
              transition: 'width 2s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '10px',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)'
            }}></div>
          </div>
        </div>
        
        <div className="steps-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '400px', textAlign: 'left' }}>
          {steps.map((step, idx) => {
            const isCompleted = currentStepIndex > idx || pipelineState === 'ready';
            const isActive = step.id === pipelineState;
            const isPending = currentStepIndex < idx && pipelineState !== 'ready';
            
            let color = 'var(--text-secondary)';
            if (isActive) color = 'var(--accent-color)';
            if (isCompleted) color = '#10b981'; // green success color

            return (
              <div key={step.id} style={{ 
                display: 'flex', alignItems: 'center', gap: '15px', 
                padding: '15px 20px', borderRadius: '12px',
                background: isActive ? 'rgba(124, 58, 237, 0.1)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isActive ? 'rgba(124, 58, 237, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                transition: 'all 0.3s ease',
                opacity: isPending ? 0.5 : 1
              }}>
                <div style={{ color }}>
                  {isCompleted ? <CheckCircle2 size={24} /> : (isActive ? <Loader2 className="spinner" size={24} /> : step.icon)}
                </div>
                <span style={{ fontSize: '18px', fontWeight: isActive ? '600' : '400', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container" style={{ paddingTop: '80px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Analyzing: <span style={{ color: 'var(--accent-color)' }}>{fileName}</span></h2>
      </div>

      {pipelineState !== 'ready' ? (
        renderLoadingScreen()
      ) : (
        <main className="main-content fade-in">
          <section className="video-section glass-panel">
            <VideoPlayer ref={videoPlayerRef} videoSrc={videoSrc} />
          </section>
          
          <section className="chat-section glass-panel">
            <ChatInterface 
              onTimestampFound={handleTimestampSelected} 
              collectionName={collectionName} 
              isReady={true} 
            />
          </section>
        </main>
      )}
    </div>
  );
};

export default Workspace;
