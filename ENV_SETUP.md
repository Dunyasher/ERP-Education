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

## Next Steps

1. **Make sure MongoDB is running** on your system
2. **Run the application**: `npm run dev`
3. **Access**: 
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

