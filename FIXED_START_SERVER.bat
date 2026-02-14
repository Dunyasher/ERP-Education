@echo off
title Backend Server - College Management
color 0A
cls
echo.
echo ========================================
echo   STARTING BACKEND SERVER
echo ========================================
echo.

cd /d "%~dp0"

REM Check MongoDB
echo [1/3] Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo [ERROR] MongoDB is NOT running!
    echo.
    echo Starting MongoDB service...
    net start MongoDB
    timeout /t 3 /nobreak >nul
)

REM Check .env
echo [2/3] Checking configuration...
if not exist "backend\.env" (
    echo Creating .env file...
    (
        echo PORT=5000
        echo MONGODB_URI=mongodb://localhost:27017/education-erp
        echo JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
        echo JWT_EXPIRE=7d
        echo NODE_ENV=development
    ) > backend\.env
)

REM Start server
echo [3/3] Starting server...
echo.
echo ========================================
echo   SERVER OUTPUT:
echo ========================================
echo.

cd backend
node server.js

pause

