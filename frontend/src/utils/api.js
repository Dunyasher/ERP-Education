import axios from 'axios';

// Determine the API base URL
// Always use full URL in development to ensure direct connection
let baseURL = 'http://localhost:5000/api';

// Force use of full URL in development mode
if (typeof window !== 'undefined') {
  // Always use localhost:5000 in development
  const hostname = window.location.hostname;
  const isDevelopment = hostname === 'localhost' || 
                       hostname === '127.0.0.1' || 
                       hostname === '' ||
                       window.location.port === '3000' ||
                       window.location.port === '5173';
  
  if (isDevelopment) {
    baseURL = 'http://localhost:5000/api';
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
if (typeof window !== 'undefined' && baseURL.includes('localhost:5000')) {
  // Test connection after a short delay
  setTimeout(async () => {
    try {
      const testUrl = baseURL.replace('/api', '') + '/api/health';
      const testResponse = await fetch(testUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });
      if (testResponse.ok) {
        const data = await testResponse.json();
        console.log('✅ Backend connection test: SUCCESS', data);
      } else {
        console.warn('⚠️ Backend connection test: Failed with status', testResponse.status);
      }
    } catch (error) {
      console.error('❌ Backend connection test: FAILED');
      console.error('   Error:', error.message);
      console.error('   URL tested:', baseURL.replace('/api', '') + '/api/health');
      console.error('   💡 Make sure backend is running on http://localhost:5000');
    }
  }, 2000);
}

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
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
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || error.message?.includes('ERR_NETWORK') || error.message?.includes('Failed to fetch')) {
        console.error('❌ Network Error: Cannot connect to backend server');
        console.error('📍 Attempted URL:', error.config?.baseURL + error.config?.url);
        console.error('💡 Please ensure:');
        console.error('   1. Backend server is running on http://localhost:5000');
        console.error('   2. No firewall is blocking the connection');
        console.error('   3. CORS is properly configured');
        
        // Show user-friendly error
        if (error.config && !error.config._skipErrorToast) {
          import('react-hot-toast').then(({ default: toast }) => {
            toast.error('Cannot connect to server. Please make sure the backend server is running on port 5000.', {
              duration: 5000
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

