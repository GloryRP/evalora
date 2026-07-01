/**
 * API Configuration and Axios Instance
 * Centralized API client with authentication header management
 */
import axios from 'axios';

// Base URL for all API requests
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

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
      // Token expired or invalid - could trigger logout here
      console.error('Unauthorized request - token may be invalid');
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
