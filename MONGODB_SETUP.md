# 🔧 MongoDB Setup Guide

## Error: `connect ECONNREFUSED ::1:27017`

This error means MongoDB is not running or not installed on your system.

## Solution Options

### Option 1: Install MongoDB Locally (Recommended for Development)

#### Windows Installation:

1. **Download MongoDB Community Server**
   - Visit: https://www.mongodb.com/try/download/community
   - Select: Windows x64
   - Download and run the installer

2. **Install MongoDB**
   - Run the installer
   - Choose "Complete" installation
   - Install as a Windows Service (recommended)
   - Install MongoDB Compass (optional GUI tool)

3. **Start MongoDB**
   ```powershell
   # MongoDB should start automatically as a service
   # Or manually start:
   net start MongoDB
   ```

4. **Verify MongoDB is Running**
   ```powershell
   mongosh
   # If this opens MongoDB shell, it's working!
   ```

#### Mac Installation:

```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux Installation:

```bash
# Ubuntu/Debian
sudo apt-get install mongodb
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

### Option 2: Use MongoDB Atlas (Cloud - No Installation Required)

1. **Create Free Account**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Sign up for free (M0 cluster is free forever)

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose FREE tier (M0)
   - Select your preferred cloud provider and region
   - Click "Create"

3. **Set Up Database Access**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Create username and password (save these!)
   - Set privileges to "Atlas admin"

4. **Set Up Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add your specific IP address

5. **Get Connection String**
   - Go to "Database" → Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `education-erp`

6. **Update .env File**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/education-erp?retryWrites=true&w=majority
   ```

---

## Quick Fix Steps

### If MongoDB is Installed but Not Running:

**Windows:**
```powershell
# Check if MongoDB service is running
Get-Service MongoDB

# Start MongoDB service
net start MongoDB
```

**Mac/Linux:**
```bash
# Start MongoDB
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### Verify Connection:

After starting MongoDB, restart your application:
```bash
npm run dev
```

You should see: `✅ MongoDB Connected successfully`

---

## Troubleshooting

### MongoDB Service Won't Start

**Windows:**
- Check if MongoDB is installed: Look for MongoDB in Programs and Features
- Check Windows Services: `services.msc` → Find "MongoDB"
- Try manual start: `mongod --dbpath C:\data\db` (create folder if needed)

### Port 27017 Already in Use

```powershell
# Find what's using port 27017
netstat -ano | findstr :27017

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Still Having Issues?

1. Check MongoDB logs:
   - Windows: `C:\Program Files\MongoDB\Server\<version>\log\mongod.log`
   - Mac/Linux: `/var/log/mongodb/mongod.log`

2. Try connecting manually:
   ```bash
   mongosh mongodb://localhost:27017
   ```

3. Use MongoDB Atlas (cloud) - it's easier and free!

---

## After Setup

Once MongoDB is running, restart your application:
```bash
npm run dev
```

The error should be resolved! 🎉

