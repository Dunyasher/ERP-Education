@echo off
echo ========================================
echo Starting College Management Backend
echo ========================================
echo.

REM Navigate to project root
cd /d "%~dp0"

REM Check MongoDB
echo [1/4] Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo [WARNING] MongoDB is not running!
    echo Attempting to start MongoDB...
    net start MongoDB >nul 2>&1
    timeout /t 3 /nobreak >nul
)

REM Check .env file
echo [2/4] Checking .env file...
if not exist "backend\.env" (
    echo [INFO] Creating .env file...
    (
        echo PORT=5000
        echo MONGODB_URI=mongodb://localhost:27017/education-erp
        echo JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
        echo JWT_EXPIRE=7d
        echo NODE_ENV=development
    ) > backend\.env
)

REM Check dependencies
echo [3/4] Checking dependencies...
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
)

REM Start server
echo [4/4] Starting server...
echo.
echo ========================================
echo Server starting...
echo ========================================
echo.
echo Server will be available at: http://localhost:5000
echo Health check: http://localhost:5000/api/health
echo.
echo Press Ctrl+C to stop the server
echo.

cd backend
node server.js

pause

