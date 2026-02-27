Write-Host "Testing Backend Connection..." -ForegroundColor Cyan
Write-Host ""

# Check if backend is running on port 5000
$backend = netstat -ano | findstr ":5000"
if ($backend) {
    Write-Host "✅ Backend port 5000 is in use" -ForegroundColor Green
} else {
    Write-Host "❌ Backend is NOT running on port 5000" -ForegroundColor Red
    Write-Host ""
    Write-Host "To start the backend, run:" -ForegroundColor Yellow
    Write-Host "  cd 'C:\Users\Dunya Sher\Desktop\college management'" -ForegroundColor White
    Write-Host "  npm run start:backend" -ForegroundColor White
    exit
}

# Test health endpoint
Write-Host ""
Write-Host "Testing /api/health endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Backend is responding!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor White
    Write-Host "   Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "The backend might be starting up. Wait a few seconds and try again." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Testing /api/auth/login endpoint (should return 400 for missing data)..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{}' -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Login endpoint is accessible (returned 400 as expected for empty data)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Login endpoint returned: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Backend connection test complete!" -ForegroundColor Cyan

