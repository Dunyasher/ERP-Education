# 🚀 Quick Start - Connect Everything

## One-Command Setup

```bash
# Run the setup script
node setup-connections.js
```

This will:
- ✅ Check all dependencies
- ✅ Create .env files if missing
- ✅ Verify your setup

## Start Everything

### Option 1: Manual Start (Recommended)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### Option 2: Automated Start

```bash
node start-all.js
```

## Verify Connections

```bash
node verify-all-connections.js
```

Expected output:
```
✅ MongoDB: Connected
✅ Redis: Connected (if configured)
✅ Backend: Server running
✅ API: Endpoints working
✅ CORS: Configured correctly
```

## Configuration Files

### Backend (.env)
```env
MONGO_URI=mongodb://localhost:27017/furniture
CLIENT_URL=http://localhost:5173
JWT_SECRET=your-secret-key
PORT=5000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:5173
VITE_BACKEND_URL=http://localhost:5000
```

## Troubleshooting

**Backend won't start:**
- Check MongoDB is running
- Verify MONGO_URI in backend/.env
- Check port 5000 is available

**Frontend can't connect:**
- Verify VITE_API_URL in client/.env
- Ensure backend is running
- Check CORS settings

**Database connection fails:**
- Start MongoDB: `mongod`
- Check connection string format
- Verify network/firewall

## Complete Setup Guide

See `CONNECTION_SETUP_COMPLETE.md` for detailed instructions.
