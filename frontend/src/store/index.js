import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';
import { apiSlice } from './api/apiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Type definitions for TypeScript-like usage (JSDoc comments for IDE support)
// @typedef {ReturnType<typeof store.getState>} RootState
// @typedef {typeof store.dispatch} AppDispatch

