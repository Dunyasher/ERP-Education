# Port 5000 Already in Use - Solution

## ✅ Good News!

**Port 5000 is already in use** means **the server is already running!** This is actually good - you don't need to start it again.

## What This Means

- ✅ **Server is running** on port 5000
- ✅ **MongoDB is connected** (as shown in your message)
- ✅ **You can use the application now!**

## Solution Options

### Option 1: Use the Existing Server (Recommended) ✅

**Just use the server that's already running!**

1. Open your browser
2. Go to http://localhost:3000 (frontend)
3. The backend is already running on port 5000
4. Try creating a student or teacher - it should work!

### Option 2: Close Existing Server and Restart

If you want to restart the server:

1. **Find the process using port 5000:**
   ```powershell
   netstat -ano | findstr :5000
   ```
   Note the PID (Process ID) from the output

2. **Close the process:**
   ```powershell
   taskkill /PID <PID> /F
   ```
   Replace `<PID>` with the actual process ID

3. **Start the server again:**
   ```bash
   npm run server
   ```

### Option 3: Use a Different Port

If you want to run multiple servers:

1. **Edit `backend/.env` file:**
   ```
   PORT=5001
   ```

2. **Update `frontend/vite.config.js`:**
   ```javascript
   proxy: {
     '/api': {
       target: 'http://localhost:5001',  // Change to 5001
       changeOrigin: true
     }
   }
   ```

3. **Restart both servers**

## Quick Check

Run this to check if the server is working:
```bash
check-server-status.bat
```

Or test manually:
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/health"
```

## Recommendation

**Just use the existing server!** It's already running and MongoDB is connected. You can start using the application right away.

If you're still getting network errors, the issue might be:
1. Frontend not running (needs to be on port 3000)
2. Browser cache issues (try hard refresh: Ctrl+F5)
3. Authentication token expired (try logging in again)

## Next Steps

1. ✅ **Server is running** - You're good!
2. ✅ **MongoDB is connected** - Database is ready!
3. 🎯 **Try creating data** - It should work now!

Your data entry should work perfectly! 🎉

