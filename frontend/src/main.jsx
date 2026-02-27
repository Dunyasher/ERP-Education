import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { store } from './store';
import './index.css';
import { Toaster } from 'react-hot-toast';

// Create a QueryClient instance with optimized settings for performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch when window regains focus - faster UX
      refetchOnMount: false, // Use cached data on mount - only refetch if stale
      refetchOnReconnect: true, // Refetch when network reconnects
      retry: 1, // Retry once on failure
      retryDelay: 500, // Faster retry delay
      staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 minutes (reduced from 5)
      gcTime: 5 * 60 * 1000, // 5 minutes - cache garbage collection time (reduced from 10)
    },
    mutations: {
      retry: 0, // Don't retry mutations
    },
  },
});

// Check if root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found! Make sure index.html has <div id="root"></div>');
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found. Please check index.html</div>';
} else {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 EDUCATION ERP FRONTEND');
    console.log('='.repeat(60));
    console.log('✅ React application starting...');
    console.log('📦 React Query configured');
    console.log('🔄 Redux store initialized');
    console.log('🌐 Router configured');
    console.log('='.repeat(60) + '\n');
    
    // Ensure root element is still in the DOM before rendering
    if (!document.body.contains(rootElement)) {
      console.error('❌ Root element was removed from DOM');
    } else {
      const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <Provider store={store}>
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <App />
                <Toaster 
                  position="top-right" 
                  toastOptions={{
                    className: 'dark:bg-gray-800 dark:text-white',
                    duration: 4000,
                  }}
                />
              </BrowserRouter>
            </Provider>
          </QueryClientProvider>
        </ErrorBoundary>
      </React.StrictMode>
      );
      console.log('✅ React application rendered successfully\n');
    }
  } catch (error) {
    console.error('❌ Error rendering React app:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red;">
        <h1>Error Loading Application</h1>
        <p>${error.message}</p>
        <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error.stack}</pre>
      </div>
    `;
  }
}

