# 🔗 Complete Connection Setup Guide

This guide will help you connect Frontend ↔ Backend ↔ Database.

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Redis (optional, for caching)
- npm or yarn

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Backend Environment Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create `.env` file** (if it doesn't exist):
   ```bash
   # Copy from example if available, or create new
   ```

3. **Add these required variables to `backend/.env`:**
   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017/furniture
   # Or for MongoDB Atlas:
   # MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/furniture

   # Server
   PORT=5000
   NODE_ENV=development

   # JWT & Security
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   SESSION_SECRET=your-session-secret-key

   # Frontend URL (for CORS)
   CLIENT_URL=http://localhost:5173
   FRONTEND_URL=http://localhost:5173
   BACKEND_URL=http://localhost:5000
   API_URL=http://localhost:5000/api

   # Redis (Optional - for caching)
   REDIS_URL=redis://localhost:6379

   # Email (Optional - for verification)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password

   # Cloudinary (Optional - for image uploads)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

### Step 2: Frontend Environment Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Create `.env` file** (if it doesn't exist):
   ```bash
   # Create new .env file
   ```

3. **Add these variables to `client/.env`:**
   ```env
   # Backend API URL
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

### Step 3: Install Dependencies & Start

**Backend:**
```bash
cd backend
npm install
npm start
# or for development with auto-reload:
# npm run dev
```

**Frontend (in a new terminal):**
```bash
cd client
npm install
npm run dev
```

---

## ✅ Verify Connections

### Option 1: Use the Connection Test Script

```bash
# From project root
node connect-all.js
```

This will test:
- ✅ MongoDB connection
- ✅ Backend server
- ✅ API endpoints
- ✅ CORS configuration
- ✅ Frontend server

### Option 2: Manual Verification

1. **Check Backend:**
   - Open: `http://localhost:5000`
   - Should see: "Welcome to Zaryab Auto API"

2. **Check Frontend:**
   - Open: `http://localhost:5173`
   - Should see your application

3. **Check Database:**
   - Backend console should show: "MongoDB connected successfully"

4. **Test API:**
   - Open browser DevTools → Network tab
   - Try logging in or fetching products
   - Check if requests go to `http://localhost:5000/api/*`

---

## 🔧 Troubleshooting

### MongoDB Connection Failed

**Error:** `MongoDB connection failed`

**Solutions:**
1. Make sure MongoDB is running:
   ```bash
   # Windows
   net start MongoDB
   
   # Mac/Linux
   sudo systemctl start mongod
   # or
   mongod
   ```

2. Check `MONGO_URI` in `backend/.env`:
   - Local: `mongodb://localhost:27017/furniture`
   - Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/furniture`

3. Verify MongoDB is accessible:
   ```bash
   mongosh
   # or
   mongo
   ```

### Backend Not Starting

**Error:** `Port 5000 is already in use`

**Solutions:**
1. Change port in `backend/.env`:
   ```env
   PORT=5001
   ```

2. Update `client/.env`:
   ```env
   VITE_API_URL=http://localhost:5001/api
   ```

3. Or kill the process using port 5000:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   
   # Mac/Linux
   lsof -ti:5000 | xargs kill
   ```

### CORS Error

**Error:** `Access to fetch at 'http://localhost:5000/api' from origin 'http://localhost:5173' has been blocked by CORS policy`

**Solutions:**
1. Check `CLIENT_URL` in `backend/.env` matches frontend URL exactly:
   ```env
   CLIENT_URL=http://localhost:5173
   ```

2. Restart backend server after changing `.env`

3. Clear browser cache and cookies

### Frontend Can't Connect to Backend

**Error:** `Network Error` or `Connection Refused`

**Solutions:**
1. Verify backend is running on correct port
2. Check `VITE_API_URL` in `client/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. Ensure no firewall is blocking the connection
4. Check backend console for errors

### 401 Unauthorized

**Error:** `Request failed with status code 401`

**This is normal for:**
- Protected routes without authentication
- Expired tokens

**Solutions:**
1. Try logging in first
2. Check if `JWT_SECRET` is set in `backend/.env`
3. Clear browser storage and try again

---

## 📊 Connection Status Checklist

- [ ] MongoDB is running and accessible
- [ ] `backend/.env` file exists with all required variables
- [ ] `client/.env` file exists with `VITE_API_URL`
- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Backend shows "MongoDB connected successfully"
- [ ] Can access `http://localhost:5000` (backend)
- [ ] Can access `http://localhost:5173` (frontend)
- [ ] API calls work from frontend (check Network tab)
- [ ] No CORS errors in browser console

---

## 🎯 Next Steps After Connection

1. **Create Admin Account:**
   ```bash
   cd backend
   node create-super-admin.js
   ```

2. **Test Login:**
   - Go to `http://localhost:5173/login`
   - Use admin credentials

3. **Access Admin Dashboard:**
   - Go to `http://localhost:5173/admin/dashboard`

4. **Add Products:**
   - Navigate to Products section
   - Create your first product

---

## 🌐 Production Setup

For production, update these in your hosting environment:

**Backend:**
- Set `NODE_ENV=production`
- Use secure MongoDB connection (Atlas)
- Use strong JWT secrets
- Update `CLIENT_URL` to production domain

**Frontend:**
- Set `VITE_API_URL` to production backend URL
- Build: `npm run build`
- Deploy `dist` folder

---

## 📞 Need Help?

If connections still fail:
1. Run `node connect-all.js` for detailed diagnostics
2. Check backend console for error messages
3. Check browser console (F12) for frontend errors
4. Verify all environment variables are set correctly

---

**✅ Once all connections are green, your application is ready to use!**

