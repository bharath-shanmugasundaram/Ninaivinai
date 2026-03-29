import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const toggleSignupMode = () => {
    setIsSignup(!isSignup);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
  };

  const handleAuth = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (isSignup && (!firstName || !lastName)) {
      setError('Please enter your full name to create an account.');
      return;
    }

    if (email && password) {
      try {
        if (isSignup) {
          signup(firstName, lastName, email, password);
          // Instead of navigating, switch back to login mode and show success
          setIsSignup(false);
          setEmail('');
          setPassword('');
          setFirstName('');
          setLastName('');
          setSuccess('Account created successfully! Please sign in.');
        } else {
          login(email, password);
          navigate('/dashboard');
        }
      } catch (err) {
        setError(err.message);
      }
    } else {
      setError('Please enter both email and password.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel">
        <div className="login-header">
          <div className="login-logo">
            <BrainCircuit size={32} color="white" />
          </div>
          <h2>{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
          <p>{isSignup ? 'Sign up for Ninaivinai' : 'Login to your Ninaivinai account'}</p>
        </div>

        {error && <div className="login-error">{error}</div>}
        {success && <div className="login-success">{success}</div>}

        <form onSubmit={handleAuth} className="login-form">
          {isSignup && (
            <div className="input-row">
              <div className="input-group">
                <label htmlFor="firstName">First Name</label>
                <input 
                  type="text" 
                  id="firstName" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane" 
                  className="glass-input"
                />
              </div>
              <div className="input-group">
                <label htmlFor="lastName">Last Name</label>
                <input 
                  type="text" 
                  id="lastName" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe" 
                  className="glass-input"
                />
              </div>
            </div>
          )}
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" 
              className="glass-input"
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="glass-input"
            />
          </div>
          <button type="submit" className="login-btn">
            {isSignup ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>
            {isSignup ? "Already have an account?" : "Don't have an account?"}{' '}
            <span className="mock-link" onClick={toggleSignupMode}>
              {isSignup ? 'Sign in' : 'Sign up'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
