/**
 * API Configuration and Axios Instance
 * Centralized API client with authentication header management
 */
import axios from 'axios';

// Base URL for all API requests
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://evalora-server.onrender.com/api/v1' : 'http://localhost:5000/api/v1');

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to attach JWT token to every request
 * Reads token from the Authorization header we set via setAuthToken()
 */
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle common errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized request (401) - clearing invalid session and redirecting to login');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.clear();
      setAuthToken(null);
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Set the authorization token for all future requests
 * @param {string} token - JWT token
 */
export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export default apiClient;
