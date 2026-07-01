/**
 * AuthContext - Manages authentication state across the app
 * Stores JWT token and user info in React state (memory-based, not localStorage)
 * Provides login, logout, and authentication checking functions
 */
import { createContext, useContext, useState, useEffect } from 'react';
import apiClient, { setAuthToken } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Initialize auth state on app load
   * Try to restore session from sessionStorage (survives page refresh within same tab)
   */
  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setAuthToken(storedToken);
    }
    setLoading(false);
  }, []);

  /**
   * login - Authenticates user and stores token + user info
   * @param {string} username - USN or Employee ID
   * @param {string} password - User's password
   * @returns {Promise} - Resolves with user data or rejects with error
   */
  const login = async (username, password) => {
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      const { token: newToken, user: userData } = response.data;

      // Store in state
      setToken(newToken);
      setUser(userData);

      // Set token for future API requests
      setAuthToken(newToken);

      // Store in sessionStorage to survive page refresh
      sessionStorage.setItem('token', newToken);
      sessionStorage.setItem('user', JSON.stringify(userData));

      return userData;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed. Please try again.';
    }
  };

  /**
   * logout - Clears authentication state
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  };

  /**
   * isAuthenticated - Check if user is logged in
   */
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  /**
   * hasRole - Check if user has a specific role
   * @param {string|string[]} roles - Role(s) to check
   */
  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth - Custom hook to access auth context
 * Use this in any component that needs authentication functionality
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
