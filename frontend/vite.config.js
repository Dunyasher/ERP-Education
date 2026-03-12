import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit'],
    force: true, // Force re-optimization
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL?.replace('/api', '') || process.env.BACKEND_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('❌ Proxy error:', err.message);
            console.error('❌ Backend server connection failed');
            console.error('❌ Please start the backend and configure VITE_API_URL or BACKEND_URL');
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Log only in development for cleaner output
            const isDev = process.env.NODE_ENV !== 'production';
            if (isDev) {
              const target = process.env.VITE_API_URL?.replace('/api', '') || process.env.BACKEND_URL || 'http://localhost:5000';
              console.log(`🔄 ${req.method} ${req.url} -> ${target}${req.url}`);
            }
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            // Log successful responses in development
            const isDev = process.env.NODE_ENV !== 'production';
            if (isDev && proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
              console.log(`✅ ${req.method} ${req.url} - ${proxyRes.statusCode}`);
            }
          });
        }
      }
    }
  }
});
