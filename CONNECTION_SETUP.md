# Frontend-Backend Connection Setup Guide

This guide will help you connect the frontend (React) and backend (Node.js/Express) applications.

> **Quick Start?** See [QUICK_START.md](./QUICK_START.md) for a faster setup guide.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Redis (local or cloud)
- npm or yarn

## Step 1: Backend Setup

### 1.1 Install Dependencies

```bash
cd backend
npm install
```

### 1.2 Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and configure the following:

**Required Variables:**
- `MONGO_URI` - Your MongoDB connection string
- `JWT_SECRET` - A random secret key for JWT tokens
- `CLIENT_URL` - Frontend URL (e.g., `http://localhost:5173`)
- `FRONTEND_URL` - Same as CLIENT_URL

**Optional but Recommended:**
- `REDIS_URL` - Redis connection string (for caching and sessions)
- `EMAIL_USER`, `EMAIL_PASSWORD` - For email verification and password reset
- `CLOUDINARY_*` - For image uploads

### 1.3 Start Backend Server

```bash
npm start
# or for development
npm run dev
```

The backend should start on `http://localhost:5000` (or your configured PORT).

**Verify Backend:**
- Visit `http://localhost:5000` - Should see "Welcome to Zaryab Auto API"
- Check console for "MongoDB connected successfully" and "Redis Client Connected"

## Step 2: Frontend Setup

### 2.1 Install Dependencies

```bash
cd client
npm install
```

### 2.2 Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and set:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

**Important:** 
- `VITE_API_URL` must match your backend API endpoint
- If backend runs on a different port, update accordingly
- The `/api` suffix is required

### 2.3 Start Frontend Development Server

```bash
npm run dev
```

The frontend should start on `http://localhost:5173` (or Vite's default port).

## Step 3: Verify Connection

### 3.1 Check CORS Configuration

The backend CORS is configured to allow requests from `CLIENT_URL`. Make sure:
- Backend `.env` has `CLIENT_URL=http://localhost:5173` (or your frontend URL)
- Frontend `.env` has `VITE_API_URL=http://localhost:5000/api` (or your backend URL)

### 3.2 Test API Connection

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try logging in or fetching products
4. Check if API calls go to `http://localhost:5000/api/*`
5. Verify responses are successful (status 200)

### 3.3 Common Issues

**Issue: CORS Error**
```
Access to fetch at 'http://localhost:5000/api/login' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution:**
- Check `CLIENT_URL` in backend `.env` matches your frontend URL exactly
- Restart backend server after changing `.env`
- Check backend console for CORS errors

**Issue: Connection Refused**
```
Failed to fetch
```

**Solution:**
- Verify backend is running on the correct port
- Check `VITE_API_URL` in frontend `.env` matches backend URL
- Ensure no firewall is blocking the connection

**Issue: 401 Unauthorized**
```
Request failed with status code 401
```

**Solution:**
- This is normal for protected routes without authentication
- Try logging in first
- Check if JWT_SECRET is set in backend `.env`

## Step 4: Production Setup

### 4.1 Backend Production

1. Set `NODE_ENV=production` in backend `.env`
2. Update `CLIENT_URL` to your production frontend URL
3. Use secure MongoDB and Redis connections
4. Use strong JWT secrets

### 4.2 Frontend Production

1. Set `VITE_API_URL` to your production backend URL
2. Build the frontend:
```bash
npm run build
```
3. Deploy the `dist` folder to your hosting service

### 4.3 Environment Variables in Production

**Vercel/Netlify:**
- Add environment variables in dashboard
- For Vite, prefix with `VITE_` (e.g., `VITE_API_URL`)

**Docker:**
- Use docker-compose with environment files
- Or pass as environment variables

## Architecture Overview

```
┌─────────────┐         HTTP/HTTPS         ┌──────────────┐
│   React     │  ───────────────────────>  │   Express    │
│  Frontend   │  <───────────────────────  │   Backend    │
│             │         JSON + Cookies      │              │
└─────────────┘                             └──────────────┘
     │                                              │
     │                                              │
     │                                              ▼
     │                                      ┌──────────────┐
     │                                      │   MongoDB    │
     │                                      │   Database   │
     │                                      └──────────────┘
     │                                              │
     │                                              ▼
     │                                      ┌──────────────┐
     │                                      │    Redis     │
     │                                      │    Cache     │
     │                                      └──────────────┘
     │
     └──────────────────────────────────────────────┘
              Socket.IO (Real-time features)
```

## Key Connection Points

1. **API Requests**: Frontend uses `axiosInstance` with `baseURL: VITE_API_URL`
2. **Authentication**: JWT tokens stored in httpOnly cookies
3. **CORS**: Backend allows requests from `CLIENT_URL`
4. **Socket.IO**: Real-time features use `VITE_SOCKET_URL`

## Testing the Connection

### Quick Test Script

1. **Backend Health Check:**
```bash
curl http://localhost:5000
# Should return: "Welcome to Zaryab Auto API"
```

2. **Frontend API Test:**
Open browser console and run:
```javascript
fetch('http://localhost:5000/api/get-products?limit=5')
  .then(r => r.json())
  .then(console.log)
```

3. **Login Test:**
- Open frontend
- Try to login with test credentials
- Check Network tab for successful API calls

## Support

If you encounter issues:
1. Check both backend and frontend console logs
2. Verify all environment variables are set correctly
3. Ensure both servers are running
4. Check firewall/antivirus settings
5. Review CORS configuration

## Next Steps

After successful connection:
- ✅ Test user authentication (login/signup)
- ✅ Test product fetching
- ✅ Test cart functionality
- ✅ Test order placement
- ✅ Test real-time features (chat, order tracking)

