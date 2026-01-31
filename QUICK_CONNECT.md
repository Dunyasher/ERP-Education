# ⚡ Quick Connection Guide

## 🎯 Fast Setup (Copy & Paste)

### 1. Backend Environment (`backend/.env`)

Create `backend/.env` with:

```env
MONGO_URI=mongodb://localhost:27017/furniture
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-this
SESSION_SECRET=your-session-secret
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
REDIS_URL=redis://localhost:6379
```

### 2. Frontend Environment (`client/.env`)

Create `client/.env` with:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Start Everything

**Option A: Use PowerShell Script (Windows)**
```powershell
.\start-all-connections.ps1
```

**Option B: Manual Start**

Terminal 1 - Backend:
```bash
cd backend
npm install
npm start
```

Terminal 2 - Frontend:
```bash
cd client
npm install
npm run dev
```

### 4. Verify

Run connection test:
```bash
node connect-all.js
```

---

## ✅ Success Indicators

- ✅ MongoDB: Connected to database
- ✅ Backend: Server running on port 5000
- ✅ Frontend: Server running on port 5173
- ✅ API: Endpoints responding
- ✅ CORS: Properly configured

---

## 🔗 Access URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Backend Health:** http://localhost:5000

---

**That's it! Your application should be fully connected.** 🎉

