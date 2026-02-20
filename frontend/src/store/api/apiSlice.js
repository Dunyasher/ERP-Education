import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Determine the API base URL
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isDevelopment = 
      hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname === '' ||
      window.location.port === '3000' ||
      window.location.port === '5173';
    
    if (isDevelopment) {
      return 'http://localhost:5000/api';
    }
    return import.meta.env.VITE_API_URL || '/api';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

const baseQuery = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token || localStorage.getItem('token');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    // Token expired or invalid - logout user
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  
  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Students',
    'Teachers',
    'Courses',
    'Classes',
    'Fees',
    'Invoices',
    'Attendance',
    'Expenses',
    'Reports',
    'Dashboard',
    'Categories',
    'Notifications',
  ],
  endpoints: (builder) => ({}),
});

