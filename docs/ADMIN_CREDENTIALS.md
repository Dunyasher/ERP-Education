# 🔐 Admin Credentials & Management

## ✅ Current Admin Account

**Email:** `admin@college.com`  
**Password:** `admin123`  
**Role:** Admin  
**Status:** ✅ Active

---

## 📋 Quick Commands

### View Admin Information
```powershell
cd backend
node scripts/showAdmin.js
```

### Create Admin Account
```powershell
cd backend
node scripts/createAdmin.js
```
**Creates:** `admin@college.com` / `admin123`

### Reset Admin Password
```powershell
cd backend
node scripts/resetAdminPassword.js <email> <newPassword>
```

**Example:**
```powershell
node scripts/resetAdminPassword.js admin@college.com MyNewPassword123
```

### View All Admins (PowerShell Script)
```powershell
.\get-admin-password.ps1
```

---

## 🔑 Default Credentials

When you first create an admin using `createAdmin.js`:
- **Email:** `admin@college.com`
- **Password:** `admin123`
- **Role:** `admin`

---

## 🛠️ Admin Management Scripts

All scripts are located in: `backend/scripts/`

1. **createAdmin.js** - Creates default admin account
2. **showAdmin.js** - Lists all admin users
3. **resetAdminPassword.js** - Resets password for an admin

---

## 📝 Usage Examples

### Create Admin (if doesn't exist)
```powershell
cd backend
node scripts/createAdmin.js
```

### View All Admins
```powershell
cd backend
node scripts/showAdmin.js
```

### Reset Password
```powershell
cd backend
node scripts/resetAdminPassword.js admin@college.com newpassword123
```

### Change Password for Specific Admin
```powershell
cd backend
node scripts/resetAdminPassword.js admin@college.com MySecurePassword456
```

---

## ⚠️ Important Notes

1. **Passwords are hashed** - Stored securely in the database
2. **Default password** - `admin123` (change it after first login!)
3. **Email must be unique** - Each admin needs a unique email
4. **MongoDB must be running** - Scripts require database connection

---

## 🚀 Quick Login

1. Go to: http://localhost:5173
2. Enter:
   - Email: `admin@college.com`
   - Password: `admin123`
3. Click "Sign In"

---

## 🔒 Security Recommendations

1. **Change default password** after first login
2. **Use strong passwords** (min 8 characters, mix of letters/numbers)
3. **Don't share credentials** publicly
4. **Create separate admin accounts** for different users

---

**Last Updated:** Admin account created and verified ✅

