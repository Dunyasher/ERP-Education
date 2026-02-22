# 🚨 SOLVE NETWORK ERROR - Step by Step

## ❌ You're Seeing:
- **Network Error** banner at top
- **"Unable to login"** under username and password fields
- Login form with `admin@furniture.com`

## ✅ The Problem:
**Backend server is NOT running** - that's why you see "Network Error"

## 🚀 THE FIX (Do This Now):

### **Step 1: Open PowerShell**
1. Press `Windows Key + X`
2. Click "Windows PowerShell" or "Terminal"

### **Step 2: Copy and Paste This:**
```powershell
cd "C:\Users\sir dunya sher\Desktop\furtniture\backend"
npm start
```

### **Step 3: Wait for These Messages:**
```
✅ MongoDB connected successfully
✅ Server is running on port 5000
```

### **Step 4: Keep That Window Open!**
⚠️ **IMPORTANT:** Don't close the PowerShell window! The server runs there.

### **Step 5: Go Back to Your Browser**
1. Refresh the login page (F5)
2. The "Network Error" should be GONE! ✅
3. Try logging in again:
   - Username: `admin@furniture.com`
   - Password: `Admin123!`

---

## ✅ After Server Starts:

1. ✅ Network Error disappears
2. ✅ "Unable to login" messages go away
3. ✅ Login form works
4. ✅ You can sign in successfully

---

## 🔍 Verify It's Working:

### Test 1: Check Server
Open another PowerShell and run:
```powershell
curl http://localhost:5000
```

**Should see:** "Welcome to Zaryab Auto API"

### Test 2: Check in Browser
Open: `http://localhost:5000`

**Should see:** "Welcome to Zaryab Auto API"

---

## ⚠️ If Server Doesn't Start:

### Check 1: MongoDB Connection
```powershell
cd backend
node test-mongodb-connection.js
```

### Check 2: Port Already in Use
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill it (replace <PID> with the number)
taskkill /PID <PID> /F
```

### Check 3: Missing Dependencies
```powershell
cd backend
npm install
```

---

## 📋 Quick Reference:

**Start Server:**
```powershell
cd backend
npm start
```

**Test Connection:**
```powershell
curl http://localhost:5000
```

**Stop Server:**
Press `Ctrl+C` in the server window

---

## 🎯 Summary:

**Problem:** Network Error because backend server is off

**Solution:** 
1. Open PowerShell
2. `cd backend`
3. `npm start`
4. Keep window open
5. Refresh browser

**Result:** Network Error FIXED! ✅

---

**Do this now and the Network Error will be solved!** 🚀

