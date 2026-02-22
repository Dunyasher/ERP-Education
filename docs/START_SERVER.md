# 🚀 How to Connect/Start the Server

## ✅ Quick Start (3 Steps)

### Step 1: Open PowerShell/Terminal
Open a new PowerShell window.

### Step 2: Navigate to Backend
```powershell
cd "C:\Users\sir dunya sher\Desktop\furtniture\backend"
```

### Step 3: Start Server
```powershell
npm start
```

**You should see:**
```
✅ MongoDB connected successfully
✅ Server is running on port 5000
```

---

## 🔍 Verify Server is Running

### Test 1: Check in Browser
Open: `http://localhost:5000`

**Should see:** "Welcome to Zaryab Auto API"

### Test 2: Test in PowerShell
Open another PowerShell and run:
```powershell
curl http://localhost:5000
```

**Should return:** "Welcome to Zaryab Auto API"

---

## ⚠️ If Server Doesn't Start

### Check 1: MongoDB Connection
The server needs MongoDB. Verify it's connected:
```powershell
cd backend
node test-mongodb-connection.js
```

### Check 2: Port Conflict
If port 5000 is in use:
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

### Check 3: Missing Dependencies
```powershell
cd backend
npm install
```

### Check 4: Environment Variables
Make sure `backend/.env` exists and has:
```env
MONGO_URI=your-mongodb-connection-string
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=your-secret-key
```

---

## 📋 Complete Startup Process

### Terminal 1 - Backend:
```powershell
cd "C:\Users\sir dunya sher\Desktop\furtniture\backend"
npm start
```

**Keep this terminal open!** The server runs here.

### Terminal 2 - Frontend (if needed):
```powershell
cd "C:\Users\sir dunya sher\Desktop\furtniture\client"
npm run dev
```

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Console shows: "MongoDB connected successfully"
- ✅ Console shows: "Server is running on port 5000"
- ✅ `http://localhost:5000` works in browser
- ✅ Frontend can connect (no network errors)
- ✅ Login works with admin credentials

---

## 🎯 After Server Starts

1. **Server is running** ✅
2. **Frontend can connect** ✅
3. **Network errors are gone** ✅
4. **You can login** ✅

---

## 🛑 To Stop Server

Press `Ctrl+C` in the terminal where server is running.

---

**Important:** The server must stay running for your application to work. Keep the terminal open!

