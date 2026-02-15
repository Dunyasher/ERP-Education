@echo off
echo ========================================
echo Checking Server Status
echo ========================================
echo.

echo Checking if server is running on port 5000...
netstat -ano | findstr :5000

echo.
echo Checking if server is responding...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -Method Get -TimeoutSec 5; Write-Host '✅ Server is working!'; Write-Host $response.Content } catch { Write-Host '❌ Server is not responding properly' }"

echo.
echo ========================================
echo If server is running, you can use it!
echo If not, start it with: npm run server
echo ========================================
pause

