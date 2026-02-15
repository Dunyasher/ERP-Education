# 🚀 Quick Setup Guide

## Step-by-Step Installation

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Setup Environment Variables

Create `backend/.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/education-erp
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows
mongod

# Mac/Linux
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### 4. Run the Application

```bash
# Start both backend and frontend together
npm run dev

# Or start separately:
npm run server    # Backend on http://localhost:5000
npm run client    # Frontend on http://localhost:3000
```

### 5. Create First Admin User

Use Postman or curl to register first admin:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin",
    "profile": {
      "firstName": "Admin",
      "lastName": "User"
    }
  }'
```

### 6. Login

Go to http://localhost:3000/login and use:
- Email: `admin@example.com`
- Password: `admin123`

---

## 🎯 Next Steps

1. Create Categories (Science, Arts, Computer, etc.)
2. Create Courses
3. Add Teachers
4. Enroll Students
5. Generate Fee Invoices
6. Mark Attendance

---

## 📝 Notes

- Default MongoDB database: `education-erp`
- Backend API: http://localhost:5000/api
- Frontend: http://localhost:3000
- All serial numbers are auto-generated (STU-0001, TEA-0001, etc.)

