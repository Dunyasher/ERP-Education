# Test Connection Script
Write-Host "Testing Frontend-Backend Connection..." -ForegroundColor Cyan
Write-Host ""

# Check Backend
Write-Host "1. Checking Backend Server..." -ForegroundColor Yellow
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   [OK] Backend is running and responding" -ForegroundColor Green
    Write-Host "   Status: $($backendResponse.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] Backend is NOT responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure backend is running: .\start-backend.ps1" -ForegroundColor Yellow
}

Write-Host ""

# Check Frontend
Write-Host "2. Checking Frontend Server..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   [OK] Frontend is running and responding" -ForegroundColor Green
    Write-Host "   Status: $($frontendResponse.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] Frontend is NOT responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure frontend is running: .\start-frontend.ps1" -ForegroundColor Yellow
}

Write-Host ""

# Check Port Status
Write-Host "3. Checking Port Status..." -ForegroundColor Yellow
$backendPort = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
$frontendPort = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if ($backendPort) {
    Write-Host "   [OK] Port 5000 is LISTENING" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Port 5000 is NOT LISTENING" -ForegroundColor Red
}

if ($frontendPort) {
    Write-Host "   [OK] Port 5173 is LISTENING" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Port 5173 is NOT LISTENING" -ForegroundColor Red
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
if ($backendPort -and $frontendPort) {
    Write-Host "   [OK] Both servers are running!" -ForegroundColor Green
    Write-Host "   Access your app at: http://localhost:5173" -ForegroundColor Cyan
} else {
    Write-Host "   [WARN] Some servers are not running" -ForegroundColor Yellow
    Write-Host "   Run: .\start-servers-fixed.ps1" -ForegroundColor Cyan
}
Write-Host ""
