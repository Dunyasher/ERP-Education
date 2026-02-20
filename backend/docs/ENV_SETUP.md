# Environment Setup

## Create Backend .env File

Create a file named `.env` in the `backend` folder with the following content:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/education-erp
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

### Quick Command (Windows PowerShell):
```powershell
@"
PORT=5000
MONGODB_URI=mongodb://localhost:27017/education-erp
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
"@ | Out-File -FilePath backend\.env -Encoding utf8
```

### Quick Command (Linux/Mac):
```bash
cat > backend/.env << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/education-erp
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
EOF
```

---

## Create Frontend .env File

Create a file named `.env` in the `frontend` folder with the following content:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Application Configuration
VITE_APP_NAME=Education ERP System
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=development

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_MODE=true
```

### Quick Command (Windows PowerShell):
```powershell
@"
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Application Configuration
VITE_APP_NAME=Education ERP System
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=development

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_MODE=true
"@ | Out-File -FilePath frontend\.env -Encoding utf8
```

### Quick Command (Linux/Mac):
```bash
cat > frontend/.env << EOF
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Application Configuration
VITE_APP_NAME=Education ERP System
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=development

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_MODE=true
EOF
```

**Note:** You can also copy the example file:
```bash
cp frontend/.env.example frontend/.env
```

---

## Next Steps

1. **Make sure MongoDB is running** on your system
2. **Create both .env files** (backend and frontend)
3. **Run the application**: 
   - Backend: `cd backend && npm run dev`
   - Frontend: `cd frontend && npm run dev`
4. **Access**: 
   - Frontend: http://localhost:3000 (or http://localhost:5173 if using Vite default)
   - Backend API: http://localhost:5000/api

