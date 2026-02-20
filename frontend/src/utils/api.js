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

// Log the base URL for debugging
console.log('🔧 API Configuration:');
console.log('   Base URL:', baseURL);
console.log('   Environment:', import.meta.env.MODE || 'development');
console.log('   Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');

// Test backend connection on startup (only in browser, only in development)
if (typeof window !== 'undefined' && baseURL === '/api') {
  // Test connection after a short delay to allow backend to be ready
  setTimeout(async () => {
    try {
      const startTime = performance.now();
      const testResponse = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      if (testResponse.ok) {
        const data = await testResponse.json();
        console.log(`✅ Backend Connection: SUCCESS (${responseTime}ms)`);
        console.log('   Status:', data.status);
        console.log('   Message:', data.message);
      } else {
        console.warn(`⚠️ Backend Connection: Failed with status ${testResponse.status}`);
      }
    } catch (error) {
      console.error('❌ Backend Connection: FAILED');
      console.error('   Error:', error.message);
      console.error('   💡 Make sure backend is running on http://localhost:5000');
      console.error('   💡 The frontend will retry automatically when backend is ready');
    }
  }, 3000); // Increased delay to allow backend to fully start
}

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 second timeout
  withCredentials: true, // Enable credentials for CORS
  validateStatus: function (status) {
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
    return response;
  },
  (error) => {
    // Handle network errors (server not running, connection refused, etc.)
    if (!error.response) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || error.message?.includes('ERR_NETWORK') || error.message?.includes('Failed to fetch')) {
        const now = Date.now();
        const shouldShowError = !connectionErrorShown || (now - lastErrorTime) > ERROR_COOLDOWN;
        
        console.error('❌ Network Error: Cannot connect to backend server');
        console.error('📍 Attempted URL:', error.config?.baseURL + error.config?.url);
        console.error('💡 Please ensure:');
        console.error('   1. Backend server is running on http://localhost:5000');
        console.error('   2. No firewall is blocking the connection');
        console.error('   3. CORS is properly configured');
        
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

