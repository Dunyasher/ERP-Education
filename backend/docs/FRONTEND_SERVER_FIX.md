# Frontend Server - Connection Refused Fix

## Problem
You're seeing "ERR_CONNECTION_REFUSED" or "localhost refused to connect" when trying to access the application.

## Cause
The **frontend server is not running**. You need both servers:
- ✅ Backend: Port 5000 (already running)
- ❌ Frontend: Port 3000 (not running)

## Solution

### Quick Fix - Start Frontend Server

**Option 1: Use the batch file (Easiest)**
```bash
start-both-servers.bat
```
This starts both backend and frontend servers.

**Option 2: Manual Start**
1. Open a new PowerShell/terminal window
2. Navigate to frontend:
   ```powershell
   cd "C:\Users\Dunya Sher\Desktop\college management\frontend"
   ```
3. Start the frontend:
   ```powershell
   npm start
   ```

**Option 3: Use npm script**
```bash
npm run client
```

### What You Should See

When frontend starts successfully:
- ✅ `VITE v... ready in ... ms`
- ✅ `➜ Local: http://localhost:3000/`
- ✅ Browser should open automatically

### Important Notes

1. **Both servers must run:**
   - Backend: Port 5000 (for API)
   - Frontend: Port 3000 (for UI)

2. **Keep both terminal windows open:**
   - Don't close the terminal windows
   - Closing them stops the servers

3. **Access the application:**
   - Open browser: http://localhost:3000
   - The frontend will connect to backend automatically

### Troubleshooting

**Frontend dependencies missing:**
```bash
cd frontend
npm install
```

**Port 3000 already in use:**
- Close the application using port 3000
- Or change port in `frontend/vite.config.js`

**Still seeing connection refused:**
1. Wait a few seconds for server to start
2. Check terminal for error messages
3. Try hard refresh: Ctrl+F5
4. Clear browser cache

## Success!

Once both servers are running:
- ✅ Backend: http://localhost:5000/api/health
- ✅ Frontend: http://localhost:3000
- ✅ You can now use the application!

