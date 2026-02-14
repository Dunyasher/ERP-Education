@echo off
echo ========================================
echo Starting Backend Server
echo ========================================
echo.

cd /d "%~dp0"

echo Checking if Node.js is installed...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found!
echo.

echo Checking if MongoDB is running...
net start MongoDB >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: MongoDB service might not be running
    echo If you get connection errors, start MongoDB with:
    echo   net start MongoDB
    echo.
)

echo Starting backend server on port 5000...
echo.
echo ========================================
echo Backend Server Starting...
echo ========================================
echo.
echo Keep this window open while using the application
echo Press Ctrl+C to stop the server
echo.

cd backend
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

node server.js

pause

