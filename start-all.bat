@echo off
title College Management - Full System Startup
color 0B
echo.
echo ========================================
echo   COLLEGE MANAGEMENT SYSTEM
echo   Complete Startup & Connection Test
echo ========================================
echo.

REM Navigate to project directory
cd /d "%~dp0"

REM Check MongoDB
echo [STEP 1/5] Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo [ERROR] MongoDB is NOT running!
    echo.
    echo Please start MongoDB:
    echo   1. Open Services (Win+R, type: services.msc)
    echo   2. Find "MongoDB Server (MongoDB)"
    echo   3. Right-click and select "Start"
    echo.
    echo OR run as Administrator:
    echo   net start MongoDB
    echo.
    pause
    exit /b 1
) else (
    echo [OK] MongoDB is running
)

REM Check .env
echo [STEP 2/5] Checking configuration...
if not exist "backend\.env" (
    echo [INFO] Creating .env file...
    (
        echo PORT=5000
        echo MONGODB_URI=mongodb://localhost:27017/education-erp
        echo JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
        echo JWT_EXPIRE=7d
        echo NODE_ENV=development
    ) > backend\.env
    echo [OK] .env file created
) else (
    echo [OK] .env file exists
)

REM Verify admin user
echo [STEP 3/5] Verifying admin user...
cd backend
node scripts\createAdmin.js >nul 2>&1
cd ..
echo [OK] Admin user verified

REM Start backend
echo [STEP 4/5] Starting backend server...
echo.
start "Backend Server" cmd /k "cd backend && node server.js"
timeout /t 5 /nobreak >nul
echo [OK] Backend server started

REM Test backend
echo [STEP 5/5] Testing connections...
timeout /t 3 /nobreak >nul
node test-connection.js

echo.
echo ========================================
echo   STARTUP COMPLETE
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000 (start with: npm run client)
echo.
echo Login Credentials:
echo   Email: admin@college.com
echo   Password: admin123
echo.
echo Press any key to exit...
pause >nul

