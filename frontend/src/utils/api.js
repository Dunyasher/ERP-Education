import axios from 'axios';

// In development, always use the Vite proxy (/api) which forwards to backend
// In production, use the environment variable if set
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment ? '/api' : (import.meta.env.VITE_API_URL || '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors and network errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors (server not running, connection refused, etc.)
    if (!error.response) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || error.message?.includes('ERR_NETWORK')) {
        console.error('Network Error: Backend server is not running or not accessible');
        console.error('Please make sure the backend server is running on http://localhost:5000');
        // Show user-friendly error
        if (error.config && !error.config._skipErrorToast) {
          import('react-hot-toast').then(({ default: toast }) => {
            toast.error('Cannot connect to server. Please make sure the backend server is running.');
          });
        }
      }
    }
    
    // Handle 404 errors specifically
    if (error.response?.status === 404) {
      console.error('404 Error:', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        fullURL: `${error.config?.baseURL}${error.config?.url}`
      });
    }
    
    // Handle auth errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

