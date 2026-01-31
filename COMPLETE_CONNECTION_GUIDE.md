# 🔗 Complete Connection Guide: Client, Backend & Database

This guide will help you connect all components of your furniture e-commerce application.

## 📋 Overview

Your application consists of:
- **Frontend (Client)**: React + Vite application
- **Backend**: Node.js + Express API server
- **Database**: MongoDB (required)
- **Cache**: Redis (optional but recommended)

## 🚀 Quick Setup (Automated)

### Option 1: Interactive Setup Script

```bash
node setup-connections.js
```

This interactive script will guide you through:
- MongoDB connection setup
- Redis configuration (optional)
- Backend server configuration
- Frontend API configuration

### Option 2: Manual Setup

Follow the steps below to manually configure everything.

## 📝 Step-by-Step Manual Setup

### Step 1: Backend Environment Configuration

1. Navigate to backend directory:
```bash
cd backend
```

2. Create or edit `.env` file with the following variables:

```env
# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:5173

# MongoDB Database (REQUIRED)
MONGO_URI=mongodb://localhost:27017/furniture
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/furniture

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_EXP=365d
JWT_REFRESH_EXP=365d

# Redis Cache (OPTIONAL but recommended)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=
REDIS_SSL=false
# OR for Redis Cloud:
# REDIS_URL=redis://username:password@host:port

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration (for notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_FROM_NAME=Your Store Name

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...

# OpenAI (for AI features)
OPENAI_API_KEY=sk-proj-...
```

**Important Variables:**
- `MONGO_URI`: Your MongoDB connection string (REQUIRED)
- `CLIENT_URL`: Must match your frontend URL exactly
- `JWT_SECRET`: Generate a strong random string
- `PORT`: Backend server port (default: 5000)

### Step 2: Frontend Environment Configuration

1. Navigate to client directory:
```bash
cd client
```

2. Create or edit `.env` file:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000/api

# Socket.IO URL (for real-time features)
VITE_SOCKET_URL=http://localhost:5000

# Stripe Publishable Key (for payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Important Variables:**
- `VITE_API_URL`: Must point to your backend API (include `/api` suffix)
- `VITE_SOCKET_URL`: Backend URL without `/api` (for Socket.IO)

### Step 3: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### Step 4: Verify Connections

Run the verification script to test all connections:

```bash
node verify-all-connections.js
```

This will test:
- ✅ MongoDB connection
- ✅ Redis connection (if configured)
- ✅ Backend server
- ✅ API endpoints
- ✅ CORS configuration

### Step 5: Start the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

**Expected Output:**
```
Server is running on port 5000
MongoDB connected successfully
Redis Client Connected (if Redis is configured)
```

**Terminal 2 - Start Frontend:**
```bash
cd client
npm run dev
```

**Expected Output:**
```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Step 6: Test the Connection

1. Open browser: `http://localhost:5173`
2. Open DevTools (F12) → Network tab
3. Try to:
   - Browse products
   - Login/Register
   - Add items to cart
4. Verify API calls go to `http://localhost:5000/api/*`
5. Check for successful responses (status 200)

## 🔍 Connection Architecture

```
┌─────────────────────┐
│   React Frontend    │
│   Port: 5173        │
│   (Vite Dev Server) │
└──────────┬──────────┘
           │
           │ HTTP/HTTPS
           │ JSON + Cookies
           │ Socket.IO (WebSocket)
           │
           ▼
┌─────────────────────┐
│  Express Backend    │
│   Port: 5000        │
│   (Node.js Server)  │
└──────────┬──────────┘
           │
           ├──────────────┐
           │              │
           ▼              ▼
    ┌──────────┐   ┌──────────┐
    │ MongoDB  │   │  Redis   │
    │ Database │   │  Cache   │
    └──────────┘   └──────────┘
```

## 🔑 Key Connection Points

### 1. API Requests
- **Frontend**: Uses `axiosInstance` with `baseURL: VITE_API_URL`
- **Backend**: Routes prefixed with `/api`
- **Authentication**: JWT tokens in httpOnly cookies

### 2. CORS Configuration
- **Backend**: Allows requests from `CLIENT_URL`
- **Frontend**: Sends requests to `VITE_API_URL`
- **Important**: `CLIENT_URL` must match frontend URL exactly

### 3. Socket.IO (Real-time)
- **Frontend**: Connects to `VITE_SOCKET_URL`
- **Backend**: Socket server on same port as HTTP server
- **Features**: Chat, order tracking, notifications

### 4. Database Connections
- **MongoDB**: Required, stores all application data
- **Redis**: Optional, used for caching and sessions

## 🛠️ Troubleshooting

### Backend Won't Start

**Issue: MongoDB Connection Failed**
```
MongoDB connection failed: ...
```

**Solutions:**
- Verify `MONGO_URI` in `backend/.env` is correct
- Check MongoDB is running (if local) or accessible (if Atlas)
- Test connection: `mongosh "your-mongo-uri"`
- Check firewall/network settings

**Issue: Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions:**
- Change `PORT` in `backend/.env` to a different port
- Kill process using port 5000: `npx kill-port 5000`
- Update `VITE_API_URL` in `client/.env` to match new port

**Issue: Redis Connection Failed**
```
Redis Client Error: ...
```

**Solutions:**
- Redis is optional - app will work without it
- Verify Redis credentials in `backend/.env`
- Check Redis server is running (if local)
- For Redis Cloud, verify connection string

### Frontend Can't Connect to Backend

**Issue: CORS Error**
```
Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solutions:**
- Ensure `CLIENT_URL` in `backend/.env` matches frontend URL exactly
- Restart backend after changing `.env`
- Check backend console for CORS errors
- Verify no trailing slashes in URLs

**Issue: Connection Refused**
```
Failed to fetch
net::ERR_CONNECTION_REFUSED
```

**Solutions:**
- Verify backend is running: `curl http://localhost:5000`
- Check `VITE_API_URL` in `client/.env` matches backend URL
- Ensure no firewall is blocking the connection
- Try accessing backend directly in browser

**Issue: 401 Unauthorized**
```
Request failed with status code 401
```

**Solutions:**
- This is normal for protected routes without authentication
- Try logging in first
- Check `JWT_SECRET` is set in `backend/.env`
- Clear browser cookies and try again

### Database Issues

**Issue: MongoDB Connection Timeout**
```
MongoServerError: connection timed out
```

**Solutions:**
- Check internet connection (for Atlas)
- Verify MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas (if using)
- Increase timeout in connection string

**Issue: Redis Connection Issues**
```
Redis Client Error: Connection refused
```

**Solutions:**
- Redis is optional - app works without it
- For local Redis: `redis-server` must be running
- For Redis Cloud: verify credentials
- Check firewall/network settings

## ✅ Verification Checklist

Before considering setup complete, verify:

- [ ] Backend server starts without errors
- [ ] MongoDB connection successful (check backend console)
- [ ] Redis connection successful (if configured)
- [ ] Frontend server starts without errors
- [ ] Can access frontend at `http://localhost:5173`
- [ ] Can access backend at `http://localhost:5000`
- [ ] No CORS errors in browser console
- [ ] API calls visible in Network tab
- [ ] Can fetch products/authenticate
- [ ] Socket.IO connection works (check browser console)

## 🧪 Testing Scripts

### Test All Connections
```bash
node verify-all-connections.js
```

### Test Backend Only
```bash
curl http://localhost:5000
# Should return: "Welcome to Zaryab Auto API"
```

### Test API Endpoint
```bash
curl http://localhost:5000/api/get-products?limit=5
# Should return JSON (may require authentication)
```

### Test Frontend API Connection
Open browser console and run:
```javascript
fetch('http://localhost:5000/api/get-products?limit=5')
  .then(r => r.json())
  .then(console.log)
```

## 📚 Additional Resources

- [CONNECTION_SETUP.md](./CONNECTION_SETUP.md) - Detailed setup documentation
- [QUICK_START.md](./QUICK_START.md) - Quick start guide
- [CONNECTION_STATUS.md](./CONNECTION_STATUS.md) - Current connection status

## 🎯 Next Steps

Once all connections are verified:

1. ✅ Test user authentication (login/signup)
2. ✅ Browse products
3. ✅ Add items to cart
4. ✅ Place an order
5. ✅ Test admin panel
6. ✅ Test real-time features (chat, order tracking)

## 💡 Pro Tips

1. **Development vs Production**: Use different `.env` files for different environments
2. **Environment Variables**: Never commit `.env` files to version control
3. **Connection Pooling**: MongoDB connection is reused across requests
4. **Caching**: Redis improves performance for frequently accessed data
5. **Error Handling**: Check both backend and frontend console logs for errors
6. **Network Issues**: Use `localhost` for local development, not `127.0.0.1`

## 🆘 Getting Help

If you encounter issues:

1. Check both backend and frontend console logs
2. Verify all environment variables are set correctly
3. Ensure both servers are running
4. Check firewall/antivirus settings
5. Review CORS configuration
6. Run `node verify-all-connections.js` for diagnostics

---

**Happy Coding! 🚀**

