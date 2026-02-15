@echo off
echo ========================================
echo   Education ERP System - Startup Script
echo ========================================
echo.

echo [1/3] Checking MongoDB connection...
timeout /t 2 /nobreak >nul

echo [2/3] Starting Backend Server...
start "Backend Server" cmd /k "npm run server"

echo [3/3] Starting Frontend Server...
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "npm run client"

echo.
echo ========================================
echo   Servers Starting...
echo ========================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to exit...
pause >nul

