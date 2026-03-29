import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrainCircuit, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import './NavigationBar.css';

const NavigationBar = () => {
  const location = useLocation();
  const { isLightMode, toggleTheme } = useTheme();
  const isLanding = location.pathname === '/';

  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">
        <div className="logo-icon-small">
          <BrainCircuit size={20} color="white" />
        </div>
        <span className="logo-text-small">Ninaivinai</span>
      </Link>
      
      <div className="navbar-actions">
        <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Theme">
          {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        
        {isLanding ? (
          <Link to="/dashboard" className="btn-primary">
            Get Started
          </Link>
        ) : (
          <Link to="/dashboard" className="btn-secondary">
            Dashboard
          </Link>
        )}
      </div>
    </header>
  );
};

export default NavigationBar;
