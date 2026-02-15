# Fix: "Cannot connect to server" Error

## ✅ Problem Fixed!

The error was caused by the frontend trying to connect directly to `http://localhost:5000/api` instead of using the Vite proxy.

## What Was Fixed:

1. **API Configuration** (`frontend/src/utils/api.js`):
   - Changed to always use `/api` proxy in development mode
   - This ensures requests go through Vite proxy → backend

2. **Environment File** (`frontend/.env`):
   - Commented out `VITE_API_URL` to force proxy usage
   - Proxy automatically forwards `/api/*` to `http://localhost:5000`

## 🔄 To Apply the Fix:

**You need to restart the frontend server** for changes to take effect:

1. **Stop the current frontend server:**
   - Find the PowerShell window running `npm run dev`
   - Press `Ctrl+C` to stop it

2. **Restart the frontend:**
   ```powershell
   .\start-frontend.ps1
   ```
   
   OR manually:
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Refresh your browser:**
   - Go to http://localhost:5173
   - Press `F5` to refresh
   - The error should be gone!

## ✅ Verification:

After restarting, the frontend will:
- Use `/api` for all API calls (proxied by Vite)
- Vite automatically forwards to `http://localhost:5000`
- No more connection errors!

## 🔍 How It Works:

```
Browser Request: /api/auth/login
    ↓
Vite Proxy (port 5173)
    ↓
Backend Server (port 5000)
    ↓
Response back to browser
```

## 📝 Notes:

- **Development**: Always uses `/api` (Vite proxy)
- **Production**: Can use `VITE_API_URL` environment variable
- **Backend**: Must be running on port 5000
- **Frontend**: Must be running on port 5173

## 🐛 If Error Persists:

1. Check backend is running:
   ```powershell
   .\test-connection.ps1
   ```

2. Verify ports:
   - Backend: http://localhost:5000/api/health
   - Frontend: http://localhost:5173

3. Check browser console (F12) for specific errors

4. Make sure both servers are restarted after changes

