# Complete Connection Setup Guide

This guide will help you connect Frontend, Backend, and Database.

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** (Local or Atlas)
3. **Redis** (Optional - for caching)
4. **npm** or **yarn**

## 🔧 Step 1: Backend Setup

### 1.1 Install Backend Dependencies

```bash
cd backend
npm install
```

### 1.2 Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `backend/.env` and configure:

**Required:**
- `MONGO_URI` - Your MongoDB connection string
  - Local: `mongodb://localhost:27017/furniture`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/furniture`
- `CLIENT_URL` - Frontend URL (e.g., `http://localhost:5173`)
- `JWT_SECRET` - A random secret key for JWT tokens
- `PORT` - Backend server port (default: 5000)

3. Generate a JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1.3 Start MongoDB

**Local MongoDB:**
```bash
# Windows
net start MongoDB

# Mac/Linux
brew services start mongodb-community
# or
sudo systemctl start mongod
```

**MongoDB Atlas:**
- Create account at https://www.mongodb.com/cloud/atlas
- Create a cluster
- Get connection string
- Add your IP to whitelist

### 1.4 Start Backend Server

```bash
cd backend
npm start
```

You should see:
```
MongoDB connected successfully
Server is running on port 5000
```

## 🎨 Step 2: Frontend Setup

### 2.1 Install Frontend Dependencies

```bash
cd client
npm install
```

### 2.2 Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `client/.env` and set:
```env
VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:5173
VITE_BACKEND_URL=http://localhost:5000
```

### 2.3 Start Frontend Development Server

```bash
cd client
npm run dev
```

You should see:
```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

## 🔗 Step 3: Verify Connections

### 3.1 Run Connection Verification Script

```bash
node verify-all-connections.js
```

This will test:
- ✅ MongoDB connection
- ✅ Redis connection (if configured)
- ✅ Backend server health
- ✅ API endpoints
- ✅ CORS configuration

### 3.2 Manual Testing

**Test Backend:**
```bash
curl http://localhost:5000/
# Should return: "Welcome to Zaryab Auto API"
```

**Test Frontend:**
- Open browser: http://localhost:5173
- Check browser console for errors
- Try logging in/registering

## 📊 Connection Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │ ◄─────► │   Backend    │ ◄─────► │  MongoDB    │
│ (React/Vite)│  HTTP  │  (Express)    │  Mongoose│  Database   │
│ Port: 5173  │         │  Port: 5000  │         │  Port: 27017│
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │    Redis    │
                        │   (Cache)   │
                        │ Port: 6379  │
                        └─────────────┘
```

## 🔍 Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify `MONGO_URI` in `.env`
- Check if port 5000 is available
- Look for error messages in console

### Frontend can't connect to backend
- Verify `VITE_API_URL` in `client/.env`
- Check CORS settings in `backend/index.js`
- Ensure backend is running
- Check browser console for CORS errors

### Database connection fails
- Verify MongoDB is running
- Check connection string format
- For Atlas: Check IP whitelist
- Check network/firewall settings

### CORS errors
- Ensure `CLIENT_URL` in backend `.env` matches frontend URL
- Check `corsOptions` in `backend/index.js`
- Clear browser cache

## ✅ Verification Checklist

- [ ] MongoDB is running and accessible
- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Backend connects to MongoDB
- [ ] Frontend can make API calls to backend
- [ ] CORS is properly configured
- [ ] Environment variables are set correctly
- [ ] All dependencies are installed

## 🚀 Quick Start Commands

```bash
# Terminal 1: Start MongoDB (if local)
mongod

# Terminal 2: Start Backend
cd backend
npm start

# Terminal 3: Start Frontend
cd client
npm run dev

# Terminal 4: Verify Connections
node verify-all-connections.js
```

## 📝 Environment Variables Summary

### Backend (.env)
- `MONGO_URI` - MongoDB connection string
- `CLIENT_URL` - Frontend URL for CORS
- `JWT_SECRET` - JWT token secret
- `PORT` - Backend port (default: 5000)

### Frontend (.env)
- `VITE_API_URL` - Backend API URL
- `VITE_FRONTEND_URL` - Frontend URL
- `VITE_BACKEND_URL` - Backend URL for sockets

## 🎯 Next Steps

1. Create a super admin user:
```bash
cd backend
node create-super-admin.js
```

2. Access the admin dashboard:
- URL: http://localhost:5173/admin/dashboard
- Login with super admin credentials

3. Test all features:
- User registration/login
- Product management
- Order processing
- Chat functionality

## 📞 Support

If you encounter issues:
1. Check the error logs
2. Run `verify-all-connections.js`
3. Verify all environment variables
4. Check MongoDB/Redis status
5. Review the troubleshooting section

