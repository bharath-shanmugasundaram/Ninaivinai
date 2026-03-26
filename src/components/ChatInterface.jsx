import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, PlayCircle } from 'lucide-react';
import { searchSemanticIndex } from '../services/mockApi';
import './ChatInterface.css';

const ChatInterface = ({ onTimestampFound }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'system',
      content: 'Welcome to Ninaivinai. Describe the moment or concept you remember, and I will find it in the video.',
      timestamp: null
    }
  ]);
  const [input, setInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSearching]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isSearching) return;

    const userQuery = input.trim();
    setInput('');
    
    // Add User Message
    const userMsg = { id: Date.now().toString(), role: 'user', content: userQuery };
    setMessages(prev => [...prev, userMsg]);
    
    setIsSearching(true);

    try {
      // Call Mock Vector DB
      // TODO: Replace with real Endpoint (Content -> Embedding -> DB -> Timestamp)
      const result = await searchSemanticIndex(userQuery);
      
      const systemMsg = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: result.text,
        timestamp: result.timestamp
      };
      
      setMessages(prev => [...prev, systemMsg]);
      
      // Notify parent to jump timeline
      if (result.timestamp !== null && onTimestampFound) {
        onTimestampFound(result.timestamp);
      }
    } catch (error) {
       setMessages(prev => [...prev, {
         id: 'error',
         role: 'system',
         content: 'Sorry, I encountered an error searching the semantic index. Make sure the backend is connected.',
         isError: true
       }]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleJumpToTime = (time) => {
    if (onTimestampFound) {
      onTimestampFound(time);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-bubble ${msg.role === 'user' ? 'user' : 'system'} ${msg.isError ? 'error' : ''}`}>
            <div className="message-content">{msg.content}</div>
            {msg.timestamp !== null && msg.timestamp !== undefined && (
              <button 
                className="timestamp-jump-btn"
                onClick={() => handleJumpToTime(msg.timestamp)}
              >
                <PlayCircle size={14} />
                Jump to {formatTime(msg.timestamp)}
              </button>
            )}
          </div>
        ))}
        {isSearching && (
          <div className="message-bubble system searching">
            <Loader2 className="spinner" size={18} />
            Searching semantic index...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area glass-panel" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. startup funding discussion..."
          className="chat-input"
          disabled={isSearching}
        />
        <button 
          type="submit" 
          className={`send-button ${input.trim() ? 'active' : ''}`}
          disabled={!input.trim() || isSearching}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
