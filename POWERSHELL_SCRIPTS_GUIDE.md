# PowerShell Scripts Guide

## 📋 Available Scripts

### 1. **start-servers-fixed.ps1** ⭐ (Recommended)
**Purpose**: Comprehensive script that starts both servers with full setup checks

**Features**:
- ✅ Checks and creates `.env` files if missing
- ✅ Verifies port availability
- ✅ Checks and installs dependencies if needed
- ✅ Starts both backend and frontend in separate windows
- ✅ Provides clear status messages

**Usage**:
```powershell
.\start-servers-fixed.ps1
```

**What it does**:
1. Checks for `.env` files (creates if missing)
2. Checks port availability (5000, 5173)
3. Verifies `node_modules` (installs if missing)
4. Starts backend server in new window
5. Starts frontend server in new window
6. Shows access URLs

---

### 2. **test-connection.ps1** 🔍
**Purpose**: Diagnostic script to test frontend-backend connection

**Features**:
- ✅ Tests backend health endpoint
- ✅ Tests frontend accessibility
- ✅ Checks port listening status
- ✅ Provides clear error messages

**Usage**:
```powershell
.\test-connection.ps1
```

**What it checks**:
1. Backend health: `http://localhost:5000/api/health`
2. Frontend: `http://localhost:5173`
3. Port 5000 listening status
4. Port 5173 listening status
5. Provides summary and recommendations

---

### 3. **start-backend.ps1** 🚀
**Purpose**: Start only the backend server

**Features**:
- ✅ Creates `.env` file if missing
- ✅ Installs dependencies if needed
- ✅ Starts backend on port 5000

**Usage**:
```powershell
.\start-backend.ps1
```

**What it does**:
1. Navigates to `backend` directory
2. Checks for `.env` file (creates template if missing)
3. Checks for `node_modules` (installs if missing)
4. Starts backend server with `npm start`

---

### 4. **start-frontend.ps1** 🎨
**Purpose**: Start only the frontend server

**Features**:
- ✅ Creates `.env` file if missing
- ✅ Installs dependencies if needed
- ✅ Starts frontend on port 5173

**Usage**:
```powershell
.\start-frontend.ps1
```

**What it does**:
1. Navigates to `frontend` directory
2. Checks for `.env` file (creates template if missing)
3. Checks for `node_modules` (installs if missing)
4. Starts frontend server with `npm run dev`

---

### 5. **start-all-connections.ps1** 🔗
**Purpose**: Start both servers with MongoDB check

**Features**:
- ✅ Checks MongoDB status
- ✅ Verifies `.env` files exist
- ✅ Starts backend and frontend in separate windows

**Usage**:
```powershell
.\start-all-connections.ps1
```

**What it does**:
1. Checks if MongoDB is running
2. Verifies `.env` files exist (warns if missing)
3. Starts backend server in new window
4. Starts frontend server in new window
5. Shows access URLs

---

### 6. **START_BACKEND_NOW.ps1** ⚡
**Purpose**: Quick backend startup (fixed path issues)

**Features**:
- ✅ Uses relative paths (fixed from hardcoded path)
- ✅ Installs dependencies if needed
- ✅ Starts backend server

**Usage**:
```powershell
.\START_BACKEND_NOW.ps1
```

---

## 🔧 Fixed Issues

### Path Issues Fixed:
1. ✅ **start-frontend.ps1**: Changed `"client"` → `"frontend"`
2. ✅ **start-all-connections.ps1**: Changed all `"client"` → `"frontend"`
3. ✅ **START_BACKEND_NOW.ps1**: Removed hardcoded path, uses `$PSScriptRoot`

### Configuration Issues Fixed:
1. ✅ **start-backend.ps1**: Fixed `MONGO_URI` → `MONGODB_URI`
2. ✅ **start-backend.ps1**: Updated database name to `education-erp`
3. ✅ All scripts now use consistent `.env` templates

---

## 📝 Script Comparison

| Script | Backend | Frontend | Env Check | Deps Check | MongoDB Check | Port Check |
|--------|---------|----------|-----------|-------------|---------------|------------|
| `start-servers-fixed.ps1` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `start-all-connections.ps1` | ✅ | ✅ | ⚠️ | ❌ | ✅ | ❌ |
| `start-backend.ps1` | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `start-frontend.ps1` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `test-connection.ps1` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**Legend**:
- ✅ = Full support
- ⚠️ = Warning only (doesn't create)
- ❌ = Not included

---

## 🚀 Quick Start Guide

### First Time Setup:
```powershell
# Use the comprehensive script
.\start-servers-fixed.ps1
```

### Daily Development:
```powershell
# Option 1: Start both together
.\start-all-connections.ps1

# Option 2: Start separately (if you need more control)
.\start-backend.ps1    # Terminal 1
.\start-frontend.ps1   # Terminal 2
```

### Troubleshooting:
```powershell
# Test connection
.\test-connection.ps1

# If issues, use comprehensive script
.\start-servers-fixed.ps1
```

---

## 🌐 Access URLs

After starting servers:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Backend Health**: http://localhost:5000/api/health

---

## ⚠️ Important Notes

1. **Port Conflicts**: If ports 5000 or 5173 are in use, the scripts will show warnings
2. **MongoDB**: Backend requires MongoDB to be running for database operations
3. **Dependencies**: First run may take time to install `node_modules`
4. **Windows**: All scripts are designed for PowerShell on Windows
5. **Paths**: All scripts use relative paths and work from project root

---

## 🐛 Troubleshooting

### "Port already in use" error:
```powershell
# Find process using port
netstat -ano | findstr ":5000"
netstat -ano | findstr ":5173"

# Stop process (replace PID with actual process ID)
Stop-Process -Id <PID> -Force
```

### "Cannot find .env file" error:
- Scripts will create `.env` files automatically
- If not created, check file permissions

### "npm command not found":
- Make sure Node.js is installed
- Verify npm is in PATH: `npm --version`

### Connection refused errors:
- Run `.\test-connection.ps1` to diagnose
- Make sure both servers are running
- Check firewall settings

---

## 📚 Additional Resources

- See `CONNECTION_FIXES.md` for connection configuration details
- Check `backend/.env` and `frontend/.env` for environment variables
- Review `backend/server.js` for CORS configuration
- Check `frontend/vite.config.js` for proxy settings

