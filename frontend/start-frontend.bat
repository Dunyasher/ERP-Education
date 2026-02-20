@echo off
title Frontend Server - College Management
color 0B
echo.
echo ========================================
echo   STARTING FRONTEND SERVER
echo ========================================
echo.

cd /d "%~dp0"

REM Check if frontend directory exists
if not exist "frontend" (
    echo [ERROR] Frontend directory not found!
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo [INFO] Starting frontend server...
echo.
echo Frontend will be available at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

cd frontend
call npm start

pause

