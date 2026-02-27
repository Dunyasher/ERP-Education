Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verifying Frontend-Backend Connection" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Backend
Write-Host "1. Checking Backend Server (port 5000)..." -ForegroundColor Yellow
$backendPort = netstat -ano | findstr ":5000" | findstr "LISTENING"
if ($backendPort) {
    Write-Host "   ✅ Backend port 5000 is LISTENING" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend port 5000 is NOT listening" -ForegroundColor Red
    Write-Host "   → Start backend: npm run start:backend" -ForegroundColor Yellow
}

# Test Backend Health
Write-Host ""
Write-Host "2. Testing Backend Health Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 5
    Write-Host "   ✅ Backend is responding!" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor White
    Write-Host "   Message: $($response.message)" -ForegroundColor White
} catch {
    Write-Host "   ❌ Backend not responding: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   → Make sure backend is running and MongoDB is connected" -ForegroundColor Yellow
}

# Check Frontend
Write-Host ""
Write-Host "3. Checking Frontend Server (port 5173)..." -ForegroundColor Yellow
$frontendPort = netstat -ano | findstr ":5173" | findstr "LISTENING"
if ($frontendPort) {
    Write-Host "   ✅ Frontend port 5173 is LISTENING" -ForegroundColor Green
} else {
    Write-Host "   ❌ Frontend port 5173 is NOT listening" -ForegroundColor Red
    Write-Host "   → Start frontend: npm run start:frontend" -ForegroundColor Yellow
}

# Test Login Endpoint
Write-Host ""
Write-Host "4. Testing Login Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"test","password":"test"}' -TimeoutSec 5 -ErrorAction SilentlyContinue
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400 -or $statusCode -eq 401) {
        Write-Host "   ✅ Login endpoint is accessible (returned $statusCode - expected for invalid credentials)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Login endpoint returned: $statusCode" -ForegroundColor Yellow
    }
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($backendPort -and $frontendPort) {
    Write-Host "✅ Both servers are running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now:" -ForegroundColor White
    Write-Host "  1. Open http://localhost:5173/login in your browser" -ForegroundColor Cyan
    Write-Host "  2. Try logging in with your credentials" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "If you still see timeout errors:" -ForegroundColor Yellow
    Write-Host "  → Refresh the browser page (Ctrl+F5)" -ForegroundColor White
    Write-Host "  → Check browser console for errors (F12)" -ForegroundColor White
    Write-Host "  → Verify MongoDB is running: Get-Service MongoDB" -ForegroundColor White
} else {
    Write-Host "⚠️  Some servers are not running. Please start them first." -ForegroundColor Yellow
}

Write-Host ""

