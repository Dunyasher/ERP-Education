# Quick Start - Backend Server

## Network Error Solution

If you see a "Network Error", it means the backend server is not running.

## Quick Fix

### Option 1: Double-click the startup script
1. Find `start-backend-server.bat` in the project root
2. Double-click it
3. Keep the terminal window open

### Option 2: Use Command Line
1. Open PowerShell or Command Prompt
2. Navigate to the project:
   ```powershell
   cd "C:\Users\Dunya Sher\Desktop\college management"
   ```
3. Start the server:
   ```powershell
   npm run server
   ```

### Option 3: Use npm script
```powershell
npm run start:backend
```

## What to Look For

When the server starts successfully, you should see:
- ✅ `MongoDB Connected successfully`
- 🚀 `Server running on port 5000`
- 📡 `Access at: http://localhost:5000`

## Important Notes

1. **Keep the terminal open** - Closing it will stop the server
2. **Check MongoDB** - Make sure MongoDB is running:
   ```powershell
   net start MongoDB
   ```
   (Run PowerShell as Administrator if needed)

3. **Both servers needed**:
   - Backend: Port 5000 (for API)
   - Frontend: Port 3000 (for UI)

## Test the Server

Open in browser: http://localhost:5000/api/health

You should see: `{"status":"OK","message":"Education ERP API is running"}`

## Troubleshooting

### Port 5000 already in use
- Find and close the process using port 5000
- Or change the port in `backend/.env`

### MongoDB connection error
- Make sure MongoDB service is running
- Check `backend/.env` for correct MongoDB URI

### Still getting network error?
1. Check if backend server is running (look for the terminal window)
2. Check browser console (F12) for detailed error
3. Verify the server URL in `frontend/vite.config.js`

