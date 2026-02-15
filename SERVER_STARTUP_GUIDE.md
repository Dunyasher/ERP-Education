# 🚀 Server Startup Guide - Fix Connection Refused Error

## Problem: ERR_CONNECTION_REFUSED

This error occurs when the backend server is not running or not accessible on port 5000.

## ✅ Solution Steps

### 1. **Ensure MongoDB is Running**

**Windows:**
```powershell
# Check MongoDB status
Get-Service MongoDB

# If not running, start it (requires admin):
net start MongoDB
```

**Or use Services:**
- Press `Win + R`, type `services.msc`
- Find "MongoDB Server (MongoDB)"
- Right-click → Start

### 2. **Verify .env File Exists**

Check that `backend/.env` file exists with:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/education-erp
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

### 3. **Start the Server**

**Option A: Using npm script (Recommended)**
```bash
npm run server
```

**Option B: Using the startup script**
```bash
start-server.bat
```

**Option C: Direct Node command**
```bash
cd backend
node server.js
```

### 4. **Verify Server is Running**

You should see:
```
✅ MongoDB Connected successfully
🚀 Server running on port 5000
📡 Access at: http://localhost:5000
🏥 Health check: http://localhost:5000/api/health
```

### 5. **Test the Server**

Open in browser: `http://localhost:5000/api/health`

Or use PowerShell:
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Education ERP API is running"
}
```

## 🔧 Troubleshooting

### Server Won't Start

1. **Check if port 5000 is already in use:**
   ```powershell
   netstat -ano | findstr :5000
   ```
   If something is using it, either:
   - Stop that process
   - Change PORT in `backend/.env` to a different port (e.g., 5001)

2. **Check MongoDB Connection:**
   - Ensure MongoDB service is running
   - Wait a few seconds after starting MongoDB before starting the server
   - The server will automatically retry MongoDB connection if it fails initially

3. **Check Node.js Installation:**
   ```bash
   node --version
   npm --version
   ```

4. **Reinstall Dependencies:**
   ```bash
   npm install
   ```

### Server Starts But Can't Connect

1. **Check Firewall:**
   - Windows Firewall might be blocking port 5000
   - Add exception for Node.js or port 5000

2. **Check Server Binding:**
   - Server should listen on `0.0.0.0` (all interfaces)
   - Verify in `backend/server.js` line 66

3. **Try Different Browser:**
   - Clear browser cache
   - Try incognito/private mode
   - Try different browser

## 📝 Quick Start Checklist

- [ ] MongoDB service is running
- [ ] `backend/.env` file exists and is configured
- [ ] Dependencies installed (`npm install`)
- [ ] Server started (`npm run server`)
- [ ] Server shows "✅ MongoDB Connected successfully"
- [ ] Server shows "🚀 Server running on port 5000"
- [ ] Health check works: `http://localhost:5000/api/health`

## 🎯 After Server is Running

1. **Start Frontend** (in a new terminal):
   ```bash
   npm run client
   ```

2. **Access Application:**
   - Frontend: `http://localhost:3000` or `http://localhost:5173`
   - Backend API: `http://localhost:5000/api`

3. **Login Credentials:**
   - Email: `admin@college.com`
   - Password: `admin123`

## 💡 Pro Tips

- Keep the server terminal open to see logs and errors
- Use `Ctrl+C` to stop the server
- If MongoDB connection fails, the server will retry automatically every 5 seconds
- Check server logs for detailed error messages

---

**Need Help?** Check the server console output for specific error messages!

