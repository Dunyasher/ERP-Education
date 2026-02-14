# Quick Start Guide - Both Servers

## ✅ Current Status

- ✅ **Backend Server**: Running on port 5000
- ⏳ **Frontend Server**: Starting on port 3000

## How to Start Both Servers

### Easiest Way (Recommended)

**Double-click:** `start-both-servers.bat`

This will start both servers in separate windows.

### Manual Way

**Terminal 1 - Backend:**
```powershell
cd "C:\Users\Dunya Sher\Desktop\college management\backend"
node server.js
```

**Terminal 2 - Frontend:**
```powershell
cd "C:\Users\Dunya Sher\Desktop\college management\frontend"
npm start
```

## What to Look For

### Backend Server (Port 5000)
You should see:
- ✅ `MongoDB Connected successfully`
- 🚀 `Server running on port 5000`
- ✅ `Server is ready to accept connections`

### Frontend Server (Port 3000)
You should see:
- ✅ `VITE v... ready in ... ms`
- ✅ `➜ Local: http://localhost:3000/`
- Browser may open automatically

## Access the Application

Once both servers are running:
1. Open browser: **http://localhost:3000**
2. Login with your credentials
3. Start using the application!

## Important Notes

1. **Keep both terminal windows open** - Closing them stops the servers
2. **Both servers must run** - Backend (5000) and Frontend (3000)
3. **Wait for startup** - Give servers a few seconds to start

## Troubleshooting

**Frontend not starting?**
- Check if dependencies are installed: `cd frontend && npm install`
- Check for error messages in terminal

**Still seeing connection refused?**
- Wait 10-15 seconds for server to fully start
- Try hard refresh: Ctrl+F5
- Check browser console (F12) for errors

## Success!

When both servers are running:
- ✅ Backend: http://localhost:5000/api/health
- ✅ Frontend: http://localhost:3000
- ✅ Ready to use!
