@echo off
echo ========================================
echo   Starting Backend Server
echo ========================================
echo.

cd backend

echo Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo Starting server on port 5000...
echo.
echo IMPORTANT: Keep this window open!
echo Press Ctrl+C to stop the server
echo.

call npm start

pause

