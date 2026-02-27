import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// Prevent multiple simultaneous auth checks
let authCheckInProgress = false;
let lastAuthCheckTime = 0;
const AUTH_CHECK_COOLDOWN = 500; // 500ms cooldown between checks for faster response

// Async thunks
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue, getState }) => {
    // Prevent duplicate simultaneous checks
    const now = Date.now();
    if (authCheckInProgress || (now - lastAuthCheckTime < AUTH_CHECK_COOLDOWN)) {
      // Return current state if check is in progress or too soon
      const state = getState();
      return {
        user: state?.auth?.user || null,
        token: state?.auth?.token || null
      };
    }

    authCheckInProgress = true;
    lastAuthCheckTime = now;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // No token - immediately return, don't wait
        return { user: null, token: null };
      }

      // Use very short timeout to prevent long loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s timeout for fast response

      const response = await api.get('/auth/me', {
        signal: controller.signal,
        _skipErrorLog: true, // Mark as auth check to suppress console errors
      });

      clearTimeout(timeoutId);
      authCheckInProgress = false;
      return {
        user: response.data,
        token: token,
      };
    } catch (error) {
      authCheckInProgress = false;
      
      // Handle ERR_INSUFFICIENT_RESOURCES specifically
      if (error.message?.includes('ERR_INSUFFICIENT_RESOURCES') || 
          error.code === 'ERR_INSUFFICIENT_RESOURCES' ||
          error.message?.includes('Insufficient resources')) {
        // Too many connections - silently return current state
        const state = getState();
        return {
          user: state?.auth?.user || null,
          token: state?.auth?.token || null
        };
      }
      
      // Handle network/connection errors - simplified, no health check to avoid delay
      if (error.name === 'AbortError' || error.code === 'ECONNREFUSED' || !error.response) {
        // Silently handle connection errors - app will still work
        // Return null user - app will still work, user can login
        return { user: null, token: null };
      }

      // Handle 401 (unauthorized) - invalid or expired token
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        return { user: null, token: null };
      }

      return rejectWithValue(error.response?.data?.message || 'Auth check failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // Use API default timeout (20s) for login request
      const response = await api.post('/auth/login', { email, password });

      const { token, user } = response.data;

      localStorage.setItem('token', token);

      toast.success('Login successful!');
      
      // Return user and token - let the component handle navigation
      return { user, token };
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';

      // Check for backend not running
      if (error.message === 'BACKEND_NOT_RUNNING' || error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to backend server. Please:\n1. Open a terminal and run: npm run start:backend\n2. Wait for "Server is ready to accept connections"\n3. Refresh this page and try again';
      } else if (error.code === 'ECONNABORTED' || 
          error.message?.includes('timeout') || 
          error.message?.includes('Timeout') ||
          error.response?.status === 408) {
        errorMessage = 'Login request timed out. This might mean:\n1. Backend is slow to respond (check backend terminal)\n2. MongoDB connection is slow\n3. Try refreshing the page and logging in again';
      } else if (error.message?.includes('Network Error') || !error.response) {
        errorMessage = 'Network error. Please check:\n1. Backend server is running (npm run start:backend)\n2. MongoDB is running\n3. No firewall blocking port 5000';
      } else if (error.response?.status === 401) {
        errorMessage = error.response?.data?.message || 'Invalid email or password';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Please check your input';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
  toast.success('Logged out successfully');
  window.location.href = '/login';
  return null;
});

// Set initial loading based on token presence
// If no token, we can immediately show login page (loading = false)
// If token exists, we need to verify it (loading = true)
// Only check localStorage once at module load time for better performance
let hasToken = false;
if (typeof window !== 'undefined') {
  try {
    hasToken = !!localStorage.getItem('token');
  } catch (e) {
    // localStorage might not be available
    hasToken = false;
  }
}
const initialState = {
  user: null,
  token: hasToken || null,
  loading: false, // Don't set loading initially - let checkAuth handle it
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        // Only set loading if we actually have a token to check
        // If no token, we can render immediately
        if (state.token) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        // Always stop loading, even on error
        state.loading = false;
        // Don't clear user/token on rejection - might be network issue
        // Only clear if it's a 401 (handled in the thunk)
        if (action.payload === 'Auth check failed' || !action.payload) {
          // Network error - keep existing state, just stop loading
          state.error = null;
          // If no token, ensure user is null
          if (!state.token) {
            state.user = null;
          }
        } else {
          state.error = action.payload;
        }
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;

