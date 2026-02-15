@echo off
echo ========================================
echo Starting Backend Server (Robust Mode)
echo ========================================
echo.

cd /d "%~dp0"

:restart
echo [%date% %time%] Starting server...

cd backend
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting server...
node server.js

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo Server crashed or exited with error!
    echo Error code: %errorlevel%
    echo ========================================
    echo.
    echo Waiting 5 seconds before restart...
    timeout /t 5 /nobreak >nul
    echo.
    goto restart
) else (
    echo.
    echo Server stopped normally.
    pause
)

