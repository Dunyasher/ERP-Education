import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// Async thunks
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { user: null, token: null };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await api.get('/auth/me', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return {
        user: response.data,
        token: token,
      };
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ECONNREFUSED' || !error.response) {
        console.warn('⚠️ Backend server not accessible during auth check');
        return { user: null, token: null };
      }

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
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);

      toast.success('Login successful!');
      window.location.href = `/${user.role}/dashboard`;

      return { user, token };
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';

      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || !error.response) {
        errorMessage = 'Cannot connect to server. Please make sure the backend server is running on port 5000.';
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

const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  loading: true,
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
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
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

