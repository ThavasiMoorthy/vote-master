import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/mockBackend';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Do NOT auto-restore token from localStorage on app start — require explicit login each session
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists and restore session (mock verification)
    if (token) {
      try {
        // In a real app, we would verify the JWT here
        const payload = JSON.parse(atob(token));
        if (payload.exp > Date.now()) {
          // Include role if it's present in token payload
          setUser({
            id: payload.id,
            username: payload.username,
            email: payload.email || payload.username, // Fallback to username if email missing
            role: payload.role
          });
        } else {
          logout();
        }
      } catch (e) {
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (username, password) => {
    try {
      // mockBackend expects positional args (username, password)
      const response = await api.auth.login(username, password);
      localStorage.setItem('auth_token', response.token);
      setToken(response.token);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (username, password) => {
    try {
      // mockBackend expects positional args (username, password)
      const response = await api.auth.register(username, password);
      localStorage.setItem('auth_token', response.token);
      setToken(response.token);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    // Ensure admin session is also cleared to prevent role leakage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('admin_auth_token');
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);