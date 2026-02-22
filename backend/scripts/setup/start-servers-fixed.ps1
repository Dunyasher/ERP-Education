# Comprehensive Server Startup Script
# This script ensures both frontend and backend are properly connected

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Frontend & Backend Servers" -ForegroundColor Green
Write-Host "  Ensuring Proper Connection" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$scriptRoot = $PSScriptRoot
if (-not $scriptRoot) {
    $scriptRoot = Get-Location
}

# Check .env files
Write-Host "1. Checking Environment Files..." -ForegroundColor Yellow
$backendEnv = Join-Path $scriptRoot "backend\.env"
$frontendEnv = Join-Path $scriptRoot "frontend\.env"

if (-not (Test-Path $backendEnv)) {
    Write-Host "   [WARN] Backend .env not found, creating..." -ForegroundColor Yellow
    $envContent = @"
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/education-erp
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
JWT_SECRET=change-this-to-a-random-secret-key-in-production
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=change-this-to-a-random-secret-key-in-production
REFRESH_TOKEN_EXPIRE=30d
SESSION_SECRET=change-this-to-a-random-secret-key-in-production
"@
    $envContent | Out-File -FilePath $backendEnv -Encoding utf8
    Write-Host "   [OK] Backend .env created" -ForegroundColor Green
} else {
    Write-Host "   [OK] Backend .env exists" -ForegroundColor Green
}

if (-not (Test-Path $frontendEnv)) {
    Write-Host "   [WARN] Frontend .env not found, creating..." -ForegroundColor Yellow
    $envContent = @"
VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:5173
VITE_BACKEND_URL=http://localhost:5000
"@
    $envContent | Out-File -FilePath $frontendEnv -Encoding utf8
    Write-Host "   [OK] Frontend .env created" -ForegroundColor Green
} else {
    Write-Host "   [OK] Frontend .env exists" -ForegroundColor Green
}

Write-Host ""

# Check if ports are in use
Write-Host "2. Checking Port Availability..." -ForegroundColor Yellow
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if ($port5000) {
    Write-Host "   [INFO] Port 5000 is in use (Backend may already be running)" -ForegroundColor Cyan
} else {
    Write-Host "   [OK] Port 5000 is available" -ForegroundColor Green
}

if ($port5173) {
    Write-Host "   [INFO] Port 5173 is in use (Frontend may already be running)" -ForegroundColor Cyan
} else {
    Write-Host "   [OK] Port 5173 is available" -ForegroundColor Green
}

Write-Host ""

# Check dependencies
Write-Host "3. Checking Dependencies..." -ForegroundColor Yellow
$backendNodeModules = Join-Path $scriptRoot "backend\node_modules"
$frontendNodeModules = Join-Path $scriptRoot "frontend\node_modules"

if (-not (Test-Path $backendNodeModules)) {
    Write-Host "   [WARN] Backend node_modules not found" -ForegroundColor Yellow
    Write-Host "   Installing backend dependencies..." -ForegroundColor Cyan
    Set-Location (Join-Path $scriptRoot "backend")
    npm install
    Set-Location $scriptRoot
} else {
    Write-Host "   [OK] Backend dependencies installed" -ForegroundColor Green
}

if (-not (Test-Path $frontendNodeModules)) {
    Write-Host "   [WARN] Frontend node_modules not found" -ForegroundColor Yellow
    Write-Host "   Installing frontend dependencies..." -ForegroundColor Cyan
    Set-Location (Join-Path $scriptRoot "frontend")
    npm install
    Set-Location $scriptRoot
} else {
    Write-Host "   [OK] Frontend dependencies installed" -ForegroundColor Green
}

Write-Host ""

# Start servers
Write-Host "4. Starting Servers..." -ForegroundColor Yellow
Write-Host ""

# Start Backend
Write-Host "   Starting Backend Server (Port 5000)..." -ForegroundColor Cyan
$backendPath = Join-Path $scriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend Server Starting...' -ForegroundColor Green; npm start" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "   Starting Frontend Server (Port 5173)..." -ForegroundColor Cyan
$frontendPath = Join-Path $scriptRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Frontend Server Starting...' -ForegroundColor Green; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Servers Starting..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Wait 10-15 seconds for servers to fully start" -ForegroundColor Yellow
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "  API:      http://localhost:5000/api" -ForegroundColor White
Write-Host "  Health:   http://localhost:5000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "To test connection, run: .\test-connection.ps1" -ForegroundColor Cyan
Write-Host ""

