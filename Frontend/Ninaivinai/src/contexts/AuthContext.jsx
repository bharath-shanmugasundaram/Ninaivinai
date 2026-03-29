import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  // Mock database of registered users
  const [registeredUsers, setRegisteredUsers] = useState([]);

  const login = (email, password) => {
    const existingUser = registeredUsers.find(u => u.email === email);
    
    if (!existingUser) {
      throw new Error('Account does not exist. Please sign up first.');
    }
    if (existingUser.password !== password) {
      throw new Error('Incorrect password.');
    }
    
    // Pass the full user object including name to the session
    setUser(existingUser);
  };

  const signup = (firstName, lastName, email, password) => {
    const existingUser = registeredUsers.find(u => u.email === email);
    
    if (existingUser) {
      throw new Error('An account with this email already exists and is registered.');
    }
    
    const newUser = { firstName, lastName, email, password };
    
    // Register the new user
    setRegisteredUsers([...registeredUsers, newUser]);
    // Note: Do not automatically set user session here so they are forced to log in
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
