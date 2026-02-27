import axios from 'axios';

// Determine the API base URL
// Use Vite proxy in development to avoid CORS issues
let baseURL = '/api';

// Use proxy path in development (Vite will proxy /api to http://localhost:5000)
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  const isDevelopment = hostname === 'localhost' || 
                       hostname === '127.0.0.1' || 
                       hostname === '' ||
                       window.location.port === '3000' ||
                       window.location.port === '5173' ||
                       window.location.port === '5174' ||
                       window.location.port === '5175' ||
                       window.location.port === '5176';
  
  if (isDevelopment) {
    // Use Vite proxy path - this avoids CORS issues
    baseURL = '/api';
  } else {
    // Production: use environment variable or relative path
    baseURL = import.meta.env.VITE_API_URL || '/api';
  }
} else if (import.meta.env.VITE_API_URL) {
  // Server-side or build time: use environment variable if available
  baseURL = import.meta.env.VITE_API_URL;
}

// Log the base URL for debugging (only in development)
if (import.meta.env.MODE === 'development') {
  console.log('🔧 API Configuration:');
  console.log('   Base URL:', baseURL);
  console.log('   Environment:', import.meta.env.MODE || 'development');
  console.log('   Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');
}

// Test backend connection on startup (only in browser, only in development)
// Removed blocking health check - let actual API calls handle connection
// This prevents 3 second delay on startup

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 20000, // 20 second timeout to allow for slower connections and MongoDB queries
  withCredentials: true, // Enable credentials for CORS
  validateStatus: function (status, config) {
    // For /auth/me endpoint, treat 401 as valid (expected when no token)
    // This prevents axios from treating it as an error
    if (config?.url?.includes('/auth/me') && status === 401) {
      return true; // Don't throw error for 401 on auth check
    }
    // Don't throw error for 4xx/5xx status codes
    return status >= 200 && status < 600;
  }
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

// Track error toasts to prevent duplicates
let connectionErrorShown = false;
let lastErrorTime = 0;
const ERROR_COOLDOWN = 10000; // Show error max once per 10 seconds

// Handle auth errors and network errors
api.interceptors.response.use(
  (response) => {
    // Reset error flag on successful response
    if (response.status >= 200 && response.status < 300) {
      connectionErrorShown = false;
    }
    
    // For /auth/me with 401, convert to error silently (expected when no token)
    if (response.config?.url?.includes('/auth/me') && response.status === 401) {
      const error = new Error('Unauthorized');
      error.response = response;
      error.config = { ...response.config, _isSilent: true, _skipErrorLog: true };
      return Promise.reject(error);
    }
    
    return response;
  },
  (error) => {
    // Handle ERR_INSUFFICIENT_RESOURCES - too many connections
    if (error.message?.includes('ERR_INSUFFICIENT_RESOURCES') || 
        error.code === 'ERR_INSUFFICIENT_RESOURCES' ||
        error.message?.includes('Insufficient resources')) {
      // Don't show error toast for this - it's a resource issue, not a server issue
      // Just return the error silently
      return Promise.reject(error);
    }
    
    // Handle network errors (server not running, connection refused, etc.)
    if (!error.response) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || error.message?.includes('ERR_NETWORK') || error.message?.includes('Failed to fetch')) {
        const now = Date.now();
        const shouldShowError = !connectionErrorShown || (now - lastErrorTime) > ERROR_COOLDOWN;
        
        // Only log detailed errors in development
        if (import.meta.env.MODE === 'development') {
          console.error('❌ Network Error: Cannot connect to backend server');
          console.error('📍 Attempted URL:', error.config?.baseURL + error.config?.url);
        }
        
        // Show user-friendly error (only once per cooldown period)
        if (shouldShowError && error.config && !error.config._skipErrorToast) {
          connectionErrorShown = true;
          lastErrorTime = now;
          import('react-hot-toast').then(({ default: toast }) => {
            toast.error('Cannot connect to server. Please make sure the backend server is running on port 5000.', {
              duration: 5000,
              id: 'connection-error' // Use same ID to prevent duplicates
            });
          });
        }
      }
    }
    
    // Handle 404 errors specifically (skip for silent errors)
    if (error.response?.status === 404 && !error.config?._isSilent && !error.config?._skipErrorLog) {
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
      
      // Don't redirect or log errors for /auth/me endpoint - it's expected when no token exists
      const isAuthCheck = error.config?.url?.includes('/auth/me') || error.config?._skipErrorLog || error.config?._isSilent;
      if (isAuthCheck) {
        // Silently handle auth check failures - this is normal when user is not logged in
        // Return error without logging - the catch block in authSlice will handle it gracefully
        const silentError = new Error('Auth check failed - no valid token');
        silentError.response = error.response;
        silentError.config = { ...error.config, _isSilent: true, _skipErrorLog: true };
        silentError.isAxiosError = true;
        return Promise.reject(silentError);
      }
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
