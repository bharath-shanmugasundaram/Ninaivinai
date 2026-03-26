import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrainCircuit, UserRound, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './NavigationBar.css';

const NavigationBar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
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
        
        {user ? (
          <div className="user-profile-menu">
            {!isLanding && (
              <Link to="/" className="btn-secondary" style={{ marginRight: '16px' }}>
                Home
              </Link>
            )}
            <div className="avatar-wrapper" onClick={() => setShowDropdown(!showDropdown)}>
              <div className="user-avatar" title={`Logged in as ${user.email}`}>
                <UserRound size={20} />
              </div>
              
              {showDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <span className="dropdown-name">{user.firstName} {user.lastName}</span>
                    <span className="dropdown-email">{user.email}</span>
                  </div>
                  <button className="dropdown-item logout" onClick={logout}>
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : isLanding ? (
          <Link to="/login" className="btn-primary">
            Login
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
