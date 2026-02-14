# Network Error - Quick Fix Guide

## Problem
You're seeing a "Network Error" when trying to create a teacher or perform other actions.

## Solution

### Step 1: Start the Backend Server

The backend server must be running for the frontend to work. Follow these steps:

#### Option A: Using the Batch File (Easiest)
1. Double-click `start-backend-server.bat` in the project root
2. Keep the terminal window open
3. Wait for the message: `🚀 Server running on port 5000`

#### Option B: Using Command Line
1. Open a new terminal/PowerShell window
2. Navigate to the project directory:
   ```powershell
   cd "C:\Users\Dunya Sher\Desktop\college management"
   ```
3. Start the backend server:
   ```powershell
   npm run server
   ```
   OR
   ```powershell
   cd backend
   node server.js
   ```

### Step 2: Verify Server is Running

You should see:
- `✅ MongoDB Connected successfully`
- `🚀 Server running on port 5000`
- `📡 Access at: http://localhost:5000`

### Step 3: Check Frontend

1. Make sure the frontend is running on port 3000
2. The frontend will automatically connect to the backend via proxy

## Common Issues

### MongoDB Not Running
If you see MongoDB connection errors:
```powershell
# Run PowerShell as Administrator, then:
net start MongoDB
```

### Port Already in Use
If port 5000 is already in use:
1. Find the process using port 5000:
   ```powershell
   netstat -ano | findstr :5000
   ```
2. Kill the process or change the port in `backend/.env`

### Both Servers Must Run
- **Backend**: Port 5000 (required for API)
- **Frontend**: Port 3000 (required for UI)

Keep both terminal windows open while using the application!

## Quick Test

Open in browser: http://localhost:5000/api/health

You should see: `{"status":"OK","message":"Education ERP API is running"}`

