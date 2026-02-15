# PowerShell script to check server status and provide instructions
Write-Host "🔍 Checking Server Status..." -ForegroundColor Cyan
Write-Host ""

# Check Backend (Port 5000)
$backendPort = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($backendPort) {
    Write-Host "✅ Backend server is running on port 5000" -ForegroundColor Green
} else {
    Write-Host "❌ Backend server is NOT running on port 5000" -ForegroundColor Red
    Write-Host "   Start it with: .\start-backend.ps1" -ForegroundColor Yellow
}

Write-Host ""

# Check Frontend (Port 5173)
$frontendPort = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($frontendPort) {
    Write-Host "✅ Frontend server is running on port 5173" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend server is NOT running on port 5173" -ForegroundColor Red
    Write-Host "   Start it with: .\start-frontend.ps1" -ForegroundColor Yellow
}

Write-Host ""

# Check Frontend (Port 3000 - old config)
$frontendPort3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($frontendPort3000) {
    Write-Host "⚠️  Old frontend server detected on port 3000" -ForegroundColor Yellow
    Write-Host "   You may need to stop it and restart on port 5173" -ForegroundColor Yellow
    $processId = ($frontendPort3000 | Select-Object -First 1).OwningProcess
    Write-Host "   Process ID: $processId" -ForegroundColor Gray
    Write-Host "   To stop: Stop-Process -Id $processId" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📋 Quick Start Instructions:" -ForegroundColor Cyan
Write-Host "   1. Start Backend:  .\start-backend.ps1" -ForegroundColor White
Write-Host "   2. Start Frontend: .\start-frontend.ps1" -ForegroundColor White
Write-Host "   OR start both:    .\start-all-connections.ps1" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Access URLs:" -ForegroundColor Cyan
Write-Host "   • Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   • Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "   • API:      http://localhost:5000/api" -ForegroundColor White
Write-Host ""

