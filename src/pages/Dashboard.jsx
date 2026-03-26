import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileVideo, ArrowRight } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = function(e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (uploadedFile) => {
    if (uploadedFile.type.startsWith('video/')) {
      setFile(uploadedFile);
      const url = URL.createObjectURL(uploadedFile);
      setVideoUrl(url);
    } else {
      alert('Please upload a valid video file.');
    }
  };

  const handleAnalyze = () => {
    if (videoUrl) {
      // In a real app, this might upload the video to a server first.
      // We pass the local object URL via state for the Workspace to consume.
      navigate('/workspace', { state: { videoSrc: videoUrl, fileName: file.name } });
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Your Workspace</h2>
        <p>Upload a new video to unlock its semantic memory.</p>
      </div>

      <div className="upload-card glass-panel">
        {!file ? (
          <form 
            className="drag-area" 
            onDragEnter={handleDrag} 
            onDragLeave={handleDrag} 
            onDragOver={handleDrag} 
            onDrop={handleDrop}
            onClick={() => inputRef.current.click()}
          >
            <input 
              ref={inputRef}
              type="file" 
              accept="video/*" 
              multiple={false} 
              onChange={handleChange} 
              style={{ display: 'none' }} 
            />
            <div className={`drag-content ${dragActive ? 'active' : ''}`}>
              <UploadCloud size={64} className="upload-icon" />
              <h3>Drag & Drop your video</h3>
              <p>or click to browse from your device</p>
              <span className="upload-format">Supports MP4, WebM</span>
            </div>
          </form>
        ) : (
          <div className="file-preview">
            <div className="file-info">
              <FileVideo size={48} className="file-icon" />
              <div className="file-details">
                <h4>{file.name}</h4>
                <p>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            <div className="preview-actions">
              <button className="btn-secondary" onClick={() => { setFile(null); setVideoUrl(null); }}>
                Change File
              </button>
              <button className="btn-primary analyze-btn" onClick={handleAnalyze}>
                Start Analysis <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="recent-videos">
        <h3>Recent Uploads</h3>
        <div className="empty-state">
          No recent videos found. Upload one to get started.
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
