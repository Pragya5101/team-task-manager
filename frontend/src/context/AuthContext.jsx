import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchAPI } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const userData = await fetchAPI('/api/auth/me');
        setUser(userData);
      } catch (error) {
        console.error('Authentication check failed:', error);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetchAPI('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      localStorage.setItem('token', res.token);
      setUser(res.user);
      return res.user;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (name, email, password, role) => {
    try {
      const res = await fetchAPI('/api/auth/signup', {
        method: 'POST',
        body: { name, email, password, role }
      });
      localStorage.setItem('token', res.token);
      setUser(res.user);
      return res.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
