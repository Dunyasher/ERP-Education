# 🚀 Start Here: Connect Everything

## Quick Connection Setup

Your furniture e-commerce application needs these connections:
- ✅ **Frontend (Client)** ↔️ **Backend API**
- ✅ **Backend** ↔️ **MongoDB Database**
- ✅ **Backend** ↔️ **Redis Cache** (optional)

## 🎯 Fastest Way to Connect Everything

### Step 1: Verify Current Setup

```bash
node verify-all-connections.js
```

This will check:
- MongoDB connection
- Redis connection
- Backend server status
- API endpoints
- CORS configuration

### Step 2: Start Backend

```bash
cd backend
npm start
```

**Look for:**
```
✅ Server is running on port 5000
✅ MongoDB connected successfully
✅ Redis Client Connected
```

### Step 3: Start Frontend

**In a new terminal:**
```bash
cd client
npm run dev
```

**Look for:**
```
✅ VITE ready
✅ Local: http://localhost:5173/
```

### Step 4: Test Connection

1. Open browser: `http://localhost:5173`
2. Open DevTools (F12) → Network tab
3. Try browsing products or logging in
4. Check API calls go to `http://localhost:5000/api/*`

## 📝 Environment Files

### Backend `.env` (backend/.env)
```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### Frontend `.env` (client/.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🔧 If Something's Not Working

### Backend won't start?
- Check MongoDB connection in `backend/.env`
- Verify port 5000 is available
- Check Redis connection (optional)

### Frontend can't connect?
- Verify backend is running
- Check `VITE_API_URL` in `client/.env`
- Ensure `CLIENT_URL` in `backend/.env` matches frontend URL

### CORS errors?
- Make sure `CLIENT_URL` in backend `.env` matches frontend URL exactly
- Restart backend after changing `.env`

## 📚 More Help

- **Complete Guide**: [COMPLETE_CONNECTION_GUIDE.md](./COMPLETE_CONNECTION_GUIDE.md)
- **Quick Start**: [QUICK_START.md](./QUICK_START.md)
- **Detailed Setup**: [CONNECTION_SETUP.md](./CONNECTION_SETUP.md)

## ✅ Success Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] MongoDB connected (check backend console)
- [ ] Redis connected (check backend console)
- [ ] No CORS errors in browser
- [ ] API calls working in Network tab

---

**Ready? Run `node verify-all-connections.js` to check everything!** 🎉

