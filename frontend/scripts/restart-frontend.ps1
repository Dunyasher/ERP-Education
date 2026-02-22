# Restart Frontend with Fixed Configuration
Write-Host "Restarting Frontend Server with Connection Fix..." -ForegroundColor Cyan
Write-Host ""

# Stop existing frontend on port 5173
$frontendPort = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($frontendPort) {
    $processId = ($frontendPort | Select-Object -First 1).OwningProcess
    Write-Host "Stopping existing frontend server (PID: $processId)..." -ForegroundColor Yellow
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "[OK] Stopped" -ForegroundColor Green
}

Write-Host ""

# Navigate to frontend directory
$scriptRoot = $PSScriptRoot
if (-not $scriptRoot) {
    $scriptRoot = Get-Location
}

$frontendPath = Join-Path $scriptRoot "frontend"
Set-Location $frontendPath

Write-Host "Starting frontend server with fixed configuration..." -ForegroundColor Green
Write-Host "Server will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "The connection error should now be fixed!" -ForegroundColor Green
Write-Host "Open your browser and go to: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""

# Start the server
npm run dev

