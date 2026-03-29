import React from 'react';
import { Link } from 'react-router-dom';
import { Search, UploadCloud, CheckCircle2, Video } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-wrapper">
      <div className="landing-content">
        <div className="landing-text-section">
          <div className="badge">New Era of Video Memory</div>
          <h1 className="hero-title">
            Search videos by meaning, <br/>
            <span className="hero-highlight">not by timestamps.</span>
          </h1>
          <p className="hero-subtitle">
            Human memory is associative. Stop scrubbing through hours of meetings. Upload a video and find the exact moment based on concepts and context.
          </p>
          
          <ul className="benefits-list">
            <li><CheckCircle2 size={18} className="list-icon" /> No manual transcription required</li>
            <li><CheckCircle2 size={18} className="list-icon" /> Understands concepts, not just keywords</li>
            <li><CheckCircle2 size={18} className="list-icon" /> 100% private and local processing</li>
          </ul>

          <div className="hero-actions">
            <Link to="/dashboard" className="action-btn primary-action">
              Start Exploring
            </Link>
          </div>
        </div>

        <div className="landing-visual-section">
          <div className="visual-card-grid">
            <div className="visual-card upload-card-float">
              <UploadCloud size={24} className="card-icon" />
              <h4>1. Upload</h4>
              <p>Drop your meeting recording here</p>
            </div>
            <div className="visual-card process-card-float">
              <Video size={24} className="card-icon" />
              <h4>2. Index</h4>
              <p>We build a semantic vector map</p>
            </div>
            <div className="visual-card search-card-float">
              <Search size={24} className="card-icon" />
              <h4>3. Retrieve</h4>
              <p>"When did we discuss the Q3 budget?"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
