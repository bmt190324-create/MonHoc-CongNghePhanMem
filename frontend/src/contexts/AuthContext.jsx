import React, { createContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Load initial state from localStorage
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  // Sync state to localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    }
  }, [user]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await axiosClient.post('/auth/login', {
        ten_dang_nhap: username,
        mat_khau: password,
      });
      
      const { accessToken, user: userData } = response;
      localStorage.setItem('accessToken', accessToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
        await axiosClient.post('/auth/logout');
    } catch (e) {
        console.error("Logout error", e);
    } finally {
        setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
