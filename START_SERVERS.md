# Start Frontend & Backend

## Fix "Cannot connect to server" / "Network error"

Do these in order:

1. **Install dependencies** (once):
   ```powershell
   cd "d:\Real project\ERP-Management"
   npm install
   cd backend && npm install && cd ..
   cd frontend && npm install && cd ..
   ```

2. **Ensure MongoDB is running** (backend needs it):
   - **Local:** Install [MongoDB Community](https://www.mongodb.com/try/download/community), then in **Admin PowerShell**: `net start MongoDB`
   - **Cloud:** Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), create a cluster, and set `MONGODB_URI` in `backend/.env` to your connection string.

3. **Ensure `backend/.env` exists** with at least:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/education-erp
   JWT_SECRET=your_secret_key
   ```
   (Copy from `backend/.env.example` if needed.)

4. **Start both servers** from project root:
   ```powershell
   cd "d:\Real project\ERP-Management"
   npm run dev
   ```
   Or use the script (installs deps if missing and starts both):
   ```powershell
   .\start-dev.ps1
   ```

5. **Verify:** Open http://localhost:5000/api/health — should show `{"status":"OK",...}`. Then open **http://localhost:5173** for the app.

---

## Easiest: use the startup script

In PowerShell, from the project folder:

```powershell
cd "d:\Real project\ERP-Management"
.\start-dev.ps1
```

This checks/installs dependencies and starts both backend and frontend. Then open **http://localhost:5173**.

---

## Quick start (both servers)

From the **project root** (`ERP-Management`):

```powershell
cd "d:\Real project\ERP-Management"
$env:Path = "C:\Program Files\nodejs;" + $env:Path   # if npm not in PATH
npm run dev
```

- **Backend** runs on **http://localhost:5000**
- **Frontend** runs on **http://localhost:5173** (open this in the browser)
- Frontend proxies `/api` to the backend automatically

---

## If you see "Cannot connect to server"

### 1. Start the backend

Backend must be running on port 5000. From project root:

```powershell
cd "d:\Real project\ERP-Management"
npm run dev
```

Or backend only:

```powershell
cd "d:\Real project\ERP-Management\backend"
npm run dev
```

Wait until you see: **"Server is ready to accept connections"**

### 2. MongoDB must be running

Backend needs MongoDB. Choose one:

- **Local MongoDB**  
  - Install: https://www.mongodb.com/try/download/community  
  - Start service: `net start MongoDB` (Windows, as Admin)  
  - `backend/.env` should have:  
    `MONGODB_URI=mongodb://localhost:27017/education-erp`

- **MongoDB Atlas (cloud)**  
  - Create a free cluster at https://www.mongodb.com/cloud/atlas  
  - Copy the connection string into `backend/.env`:  
    `MONGODB_URI=mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/education-erp`

### 3. Check backend/.env

File **backend/.env** must exist and contain at least:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/education-erp
```

### 4. Port 5000 not in use

If something else uses port 5000:

```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

Or set a different port in **backend/.env**: `PORT=5001` (and in **frontend/.env** use `VITE_API_URL=http://localhost:5001/api` if needed).

### 5. Firewall

Allow Node.js or port 5000 in Windows Firewall if the backend still can’t be reached.

---

## Health check

- Backend: http://localhost:5000/api/health  
  Should return: `{"status":"OK","message":"Education ERP API is running"}`
- Frontend: http://localhost:5173
