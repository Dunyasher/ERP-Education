import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await api.get('/auth/me', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        setUser(response.data);
      } catch (error) {
        // Handle all errors gracefully
        if (error.name === 'AbortError' || error.code === 'ECONNREFUSED' || !error.response) {
          // Backend not running or network error - clear token and continue
          console.warn('Backend server not accessible, clearing auth token');
        }
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      toast.success('Login successful!');
      window.location.href = `/${response.data.user.role}/dashboard`;
      return response.data;
    } catch (error) {
      // Better error messages
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || !error.response) {
        toast.error('Cannot connect to server. Please make sure the backend server is running on port 5000.');
      } else if (error.response?.status === 401) {
        toast.error(error.response?.data?.message || 'Invalid email or password');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'Please check your input');
      } else {
        toast.error(error.response?.data?.message || 'Login failed. Please try again.');
      }
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

