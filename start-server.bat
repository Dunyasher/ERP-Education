@echo off
echo ========================================
echo Starting College Management Server
echo ========================================
echo.

REM Check if MongoDB is running
echo Checking MongoDB service...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo [WARNING] MongoDB service is not running!
    echo Starting MongoDB service...
    net start MongoDB
    timeout /t 3 /nobreak >nul
)

REM Check if .env exists
if not exist "backend\.env" (
    echo [ERROR] backend\.env file not found!
    echo Creating .env file...
    (
        echo PORT=5000
        echo MONGODB_URI=mongodb://localhost:27017/education-erp
        echo JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
        echo JWT_EXPIRE=7d
        echo NODE_ENV=development
    ) > backend\.env
    echo .env file created!
)

echo.
echo Starting Node.js server...
echo Server will be available at: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

cd backend
node server.js

