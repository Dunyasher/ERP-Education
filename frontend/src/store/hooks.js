import { useDispatch, useSelector } from 'react-redux';
import { useMemo } from 'react';
import { toggleTheme, setLightMode, setDarkMode, setTheme } from './slices/themeSlice';

// Typed hooks for TypeScript-like safety in JavaScript
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Custom hooks for common selectors
export const useAuth = () => {
  const auth = useAppSelector((state) => state.auth);
  return useMemo(() => ({
    user: auth.user,
    token: auth.token,
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: !!auth.user && !!auth.token,
  }), [auth.user, auth.token, auth.loading, auth.error]);
};

export const useTheme = () => {
  const theme = useAppSelector((state) => state.theme.theme);
  const dispatch = useAppDispatch();
  
  return useMemo(() => ({
    theme,
    toggleTheme: () => dispatch(toggleTheme()),
    setLightMode: () => dispatch(setLightMode()),
    setDarkMode: () => dispatch(setDarkMode()),
    setTheme: (newTheme) => dispatch(setTheme(newTheme)),
  }), [theme, dispatch]);
};

