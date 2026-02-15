# Complete Startup Script - Fixes All Issues and Starts Everything
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COMPLETE SYSTEM STARTUP" -ForegroundColor Green
Write-Host "  Fixing All Issues & Starting Servers" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptRoot = $PSScriptRoot
if (-not $scriptRoot) {
    $scriptRoot = Get-Location
}

# ============================================
# 1. BACKEND SETUP
# ============================================
Write-Host "1. SETTING UP BACKEND..." -ForegroundColor Yellow
$backendPath = Join-Path $scriptRoot "backend"

if (Test-Path $backendPath) {
    Set-Location $backendPath
    
    # Check .env
    if (-not (Test-Path ".env")) {
        Write-Host "   Creating backend .env..." -ForegroundColor Cyan
        @"
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
"@ | Out-File -FilePath ".env" -Encoding utf8
    }
    
    # Check dependencies
    if (-not (Test-Path "node_modules")) {
        Write-Host "   Installing backend dependencies..." -ForegroundColor Cyan
        npm install --silent
    }
    
    Write-Host "   [OK] Backend ready" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Backend directory not found!" -ForegroundColor Red
}

Write-Host ""

# ============================================
# 2. FRONTEND SETUP
# ============================================
Write-Host "2. SETTING UP FRONTEND..." -ForegroundColor Yellow
$frontendPath = Join-Path $scriptRoot "frontend"

if (Test-Path $frontendPath) {
    Set-Location $frontendPath
    
    # Check .env
    if (-not (Test-Path ".env")) {
        Write-Host "   Creating frontend .env..." -ForegroundColor Cyan
        @"
VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:5173
VITE_BACKEND_URL=http://localhost:5000
"@ | Out-File -FilePath ".env" -Encoding utf8
    }
    
    # Check dependencies
    if (-not (Test-Path "node_modules")) {
        Write-Host "   Installing frontend dependencies (this may take a few minutes)..." -ForegroundColor Cyan
        npm install
    } else {
        Write-Host "   [OK] Dependencies installed" -ForegroundColor Green
    }
    
    # Verify critical files
    $criticalFiles = @("index.html", "vite.config.js", "src\main.jsx", "src\App.jsx")
    $allFilesExist = $true
    foreach ($file in $criticalFiles) {
        if (-not (Test-Path $file)) {
            Write-Host "   [FAIL] Missing: $file" -ForegroundColor Red
            $allFilesExist = $false
        }
    }
    
    if ($allFilesExist) {
        Write-Host "   [OK] All critical files present" -ForegroundColor Green
    }
    
    Write-Host "   [OK] Frontend ready" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Frontend directory not found!" -ForegroundColor Red
}

Write-Host ""

# ============================================
# 3. CHECK PORTS
# ============================================
Write-Host "3. CHECKING PORTS..." -ForegroundColor Yellow

# Check port 5000
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($port5000) {
    $pid = ($port5000 | Select-Object -First 1).OwningProcess
    Write-Host "   [INFO] Port 5000 in use (PID: $pid) - Backend may already be running" -ForegroundColor Cyan
} else {
    Write-Host "   [OK] Port 5000 available" -ForegroundColor Green
}

# Check port 5173
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($port5173) {
    $pid = ($port5173 | Select-Object -First 1).OwningProcess
    Write-Host "   [WARN] Port 5173 in use (PID: $pid) - Stopping..." -ForegroundColor Yellow
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "   [OK] Port 5173 freed" -ForegroundColor Green
} else {
    Write-Host "   [OK] Port 5173 available" -ForegroundColor Green
}

Write-Host ""

# ============================================
# 4. START SERVERS
# ============================================
Write-Host "4. STARTING SERVERS..." -ForegroundColor Yellow
Write-Host ""

# Start Backend
if (-not $port5000) {
    Write-Host "   Starting Backend Server..." -ForegroundColor Cyan
    $backendPath = Join-Path $scriptRoot "backend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend Server Starting on http://localhost:5000' -ForegroundColor Green; npm start" -WindowStyle Normal
    Start-Sleep -Seconds 3
} else {
    Write-Host "   [INFO] Backend already running" -ForegroundColor Cyan
}

# Start Frontend
Write-Host "   Starting Frontend Server..." -ForegroundColor Cyan
$frontendPath = Join-Path $scriptRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Frontend Server Starting on http://localhost:5173' -ForegroundColor Green; Write-Host 'Opening browser in 5 seconds...' -ForegroundColor Yellow; Start-Sleep -Seconds 5; Start-Process 'http://localhost:5173'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SERVERS STARTING..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please wait 10-15 seconds for servers to fully start" -ForegroundColor Yellow
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "  API:      http://localhost:5000/api" -ForegroundColor White
Write-Host "  Health:   http://localhost:5000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "The browser will open automatically in 5 seconds" -ForegroundColor Green
Write-Host ""
Write-Host "If you see a blank page:" -ForegroundColor Yellow
Write-Host "  1. Wait 10-15 seconds for the app to load" -ForegroundColor White
Write-Host "  2. Check browser console (F12) for errors" -ForegroundColor White
Write-Host "  3. Make sure backend is running on port 5000" -ForegroundColor White
Write-Host "  4. Try refreshing the page (F5)" -ForegroundColor White
Write-Host ""
Write-Host "To test connection: .\test-connection.ps1" -ForegroundColor Cyan
Write-Host ""

