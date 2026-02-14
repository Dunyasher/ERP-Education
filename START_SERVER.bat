@echo off
title College Management - Backend Server
color 0A
echo.
echo ========================================
echo   COLLEGE MANAGEMENT - BACKEND SERVER
echo ========================================
echo.

REM Navigate to project directory
cd /d "%~dp0"

REM Check MongoDB
echo [1/3] Checking MongoDB Service...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo [ERROR] MongoDB is NOT running!
    echo.
    echo Please start MongoDB first:
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

REM Check .env file
echo [2/3] Checking configuration...
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

REM Start server
echo [3/3] Starting server...
echo.
echo ========================================
echo   SERVER STARTING...
echo ========================================
echo.
echo Server will be available at:
echo   - http://localhost:5000
echo   - Health: http://localhost:5000/api/health
echo.
echo Login credentials:
echo   - Email: admin@college.com
echo   - Password: admin123
echo.
echo ========================================
echo   Press Ctrl+C to stop the server
echo ========================================
echo.

cd backend
node server.js

pause

