# 🔧 Fix Login Failed Error

## Problem
You're seeing "Login failed" when trying to log in with `admin@college.com`.

## Root Cause
The **backend server is not running**, so the frontend cannot connect to the API.

## ✅ Solution Steps

### Step 1: Verify MongoDB is Running

```powershell
Get-Service MongoDB
```

Should show: **Status: Running**

If not running:
```powershell
net start MongoDB
```
(Requires Administrator privileges)

### Step 2: Start the Backend Server

**Open a terminal/command prompt** and run:

```bash
npm run server
```

**OR** directly:

```bash
node backend/server.js
```

**You should see:**
```
✅ MongoDB Connected successfully
🚀 Server running on port 5000
📡 Access at: http://localhost:5000
🏥 Health check: http://localhost:5000/api/health
```

### Step 3: Verify Server is Running

**Test in browser:** `http://localhost:5000/api/health`

**OR in PowerShell:**
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/health
```

**Expected response:**
```json
{
  "status": "OK",
  "message": "Education ERP API is running"
}
```

### Step 4: Start the Frontend (in a NEW terminal)

```bash
npm run client
```

**OR:**

```bash
cd frontend
npm start
```

The frontend will start on `http://localhost:3000` or `http://localhost:5173`

### Step 5: Login

1. Go to: `http://localhost:3000/login` (or the port shown)
2. Use credentials:
   - **Email:** `admin@college.com`
   - **Password:** `admin123`

## 🔍 Troubleshooting

### Server Won't Start

1. **Check if port 5000 is in use:**
   ```powershell
   netstat -ano | findstr :5000
   ```
   If something is using it, stop that process or change PORT in `backend/.env`

2. **Check MongoDB connection:**
   - Ensure MongoDB service is running
   - Wait 2-3 seconds after starting MongoDB before starting server
   - Server will auto-retry MongoDB connection if it fails

3. **Check .env file exists:**
   ```powershell
   Test-Path backend\.env
   ```
   Should return `True`

4. **Reinstall dependencies:**
   ```bash
   npm install
   ```

### Login Still Fails After Server Starts

1. **Verify admin user exists:**
   ```bash
   npm run create-admin
   ```
   OR:
   ```bash
   node backend/scripts/createAdmin.js
   ```

2. **Check server logs** in the terminal where you ran `npm run server`
   - Look for any error messages
   - Check if MongoDB connection succeeded

3. **Test login API directly:**
   ```powershell
   $body = @{
       email = "admin@college.com"
       password = "admin123"
   } | ConvertTo-Json

   Invoke-RestMethod -Uri http://localhost:5000/api/auth/login -Method POST -Body $body -ContentType "application/json"
   ```

### Frontend Can't Connect to Backend

1. **Check Vite proxy configuration** in `frontend/vite.config.js`
   - Should proxy `/api` to `http://localhost:5000`

2. **Verify both servers are running:**
   - Backend: `http://localhost:5000`
   - Frontend: `http://localhost:3000` or `http://localhost:5173`

3. **Check browser console** (F12) for network errors

## 📋 Quick Checklist

- [ ] MongoDB service is running
- [ ] Backend server is running (`npm run server`)
- [ ] Server shows "✅ MongoDB Connected successfully"
- [ ] Server shows "🚀 Server running on port 5000"
- [ ] Health check works: `http://localhost:5000/api/health`
- [ ] Frontend is running (`npm run client`)
- [ ] Admin user exists (run `npm run create-admin` if needed)
- [ ] Using correct credentials: `admin@college.com` / `admin123`

## 🎯 Expected Flow

1. **Terminal 1:** `npm run server` → Backend running on port 5000
2. **Terminal 2:** `npm run client` → Frontend running on port 3000/5173
3. **Browser:** Go to `http://localhost:3000/login`
4. **Login:** `admin@college.com` / `admin123`
5. **Success:** Redirected to admin dashboard

---

**Important:** Keep both terminal windows open while using the application!

