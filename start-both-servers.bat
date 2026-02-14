@echo off
echo ========================================
echo Starting Both Servers
echo ========================================
echo.

cd /d "%~dp0"

echo Starting Backend Server...
start "Backend Server" powershell -NoExit -Command "cd '%~dp0backend'; Write-Host 'Backend Server Starting...' -ForegroundColor Green; node server.js"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "Frontend Server" powershell -NoExit -Command "cd '%~dp0frontend'; Write-Host 'Frontend Server Starting...' -ForegroundColor Cyan; npm start"

echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Keep both terminal windows open!
echo.
pause

