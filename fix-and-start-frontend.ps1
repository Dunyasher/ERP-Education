# Fix and Start Frontend Script
# This script fixes all frontend issues and starts the server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fixing and Starting Frontend" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptRoot = $PSScriptRoot
if (-not $scriptRoot) {
    $scriptRoot = Get-Location
}

$frontendPath = Join-Path $scriptRoot "frontend"

# Check if frontend directory exists
if (-not (Test-Path $frontendPath)) {
    Write-Host "[FAIL] Frontend directory not found!" -ForegroundColor Red
    Write-Host "Path: $frontendPath" -ForegroundColor Yellow
    exit 1
}

Set-Location $frontendPath
Write-Host "[OK] Navigated to frontend directory" -ForegroundColor Green
Write-Host ""

# Check and create .env file
Write-Host "1. Checking .env file..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "   [WARN] .env not found, creating..." -ForegroundColor Yellow
    @"
VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:5173
VITE_BACKEND_URL=http://localhost:5000
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "   [OK] .env created" -ForegroundColor Green
} else {
    Write-Host "   [OK] .env exists" -ForegroundColor Green
}
Write-Host ""

# Check and install dependencies
Write-Host "2. Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "   [WARN] node_modules not found" -ForegroundColor Yellow
    Write-Host "   Installing dependencies (this may take a few minutes)..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   [FAIL] npm install failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "   [OK] Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   [OK] Dependencies installed" -ForegroundColor Green
}
Write-Host ""

# Check if port is available
Write-Host "3. Checking port 5173..." -ForegroundColor Yellow
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($port5173) {
    $processId = ($port5173 | Select-Object -First 1).OwningProcess
    Write-Host "   [WARN] Port 5173 is in use (PID: $processId)" -ForegroundColor Yellow
    Write-Host "   Stopping existing process..." -ForegroundColor Cyan
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "   [OK] Port freed" -ForegroundColor Green
} else {
    Write-Host "   [OK] Port 5173 is available" -ForegroundColor Green
}
Write-Host ""

# Verify vite.config.js exists
Write-Host "4. Checking configuration..." -ForegroundColor Yellow
if (-not (Test-Path "vite.config.js")) {
    Write-Host "   [FAIL] vite.config.js not found!" -ForegroundColor Red
    exit 1
}
Write-Host "   [OK] vite.config.js exists" -ForegroundColor Green

if (-not (Test-Path "index.html")) {
    Write-Host "   [FAIL] index.html not found!" -ForegroundColor Red
    exit 1
}
Write-Host "   [OK] index.html exists" -ForegroundColor Green

if (-not (Test-Path "src\main.jsx")) {
    Write-Host "   [FAIL] src\main.jsx not found!" -ForegroundColor Red
    exit 1
}
Write-Host "   [OK] src\main.jsx exists" -ForegroundColor Green
Write-Host ""

# Start the server
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Frontend Server" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server will start on: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Keep this window open while the server is running." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Gray
Write-Host ""

# Start the server
npm run dev

