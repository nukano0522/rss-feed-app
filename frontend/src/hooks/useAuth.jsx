import React, { createContext, useContext, useState } from 'react';
import { login as apiLogin, register } from '../services/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    try {
      const response = await apiLogin(email, password);
      localStorage.setItem('token', response.access_token);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const registerUser = async (email, password) => {
    try {
      const data = await register(email, password);
      return data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    register: registerUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 