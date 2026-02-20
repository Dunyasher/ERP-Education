import { createSlice } from '@reduxjs/toolkit';

// Get theme from localStorage or default to 'light'
const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  }
  return 'light';
};

const initialState = {
  theme: getInitialTheme(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      
      // Apply theme to root element
      if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(action.payload);
        localStorage.setItem('theme', action.payload);
      }
    },
    toggleTheme: (state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      state.theme = newTheme;
      
      // Apply theme to root element
      if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(newTheme);
        localStorage.setItem('theme', newTheme);
      }
    },
    setLightMode: (state) => {
      state.theme = 'light';
      
      if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        root.classList.remove('dark');
        root.classList.add('light');
        localStorage.setItem('theme', 'light');
      }
    },
    setDarkMode: (state) => {
      state.theme = 'dark';
      
      if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        root.classList.remove('light');
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      }
    },
  },
});

// Initialize theme on load
if (typeof window !== 'undefined') {
  const initialTheme = getInitialTheme();
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(initialTheme);
}

export const { setTheme, toggleTheme, setLightMode, setDarkMode } = themeSlice.actions;
export default themeSlice.reducer;

