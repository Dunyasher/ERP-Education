# Start ERP backend + frontend (fixes "Cannot connect to server" when backend not running)
# Run from project root: .\start-dev.ps1

$ErrorActionPreference = "Stop"
$nodePath = "C:\Program Files\nodejs"
if (-not (Test-Path "$nodePath\node.exe")) {
  Write-Host "Node.js not found at $nodePath. Install from https://nodejs.org" -ForegroundColor Red
  exit 1
}
$env:Path = "$nodePath;" + $env:Path

Set-Location $PSScriptRoot

# Ensure dependencies are installed
Write-Host "Checking dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
  Write-Host "Installing root dependencies (concurrently)..." -ForegroundColor Yellow
  npm install
}
if (-not (Test-Path "backend\node_modules")) {
  Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
  Set-Location backend
  npm install
  Set-Location ..
}
if (-not (Test-Path "frontend\node_modules")) {
  Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
  Set-Location frontend
  npm install
  Set-Location ..
}

# Check backend .env
if (-not (Test-Path "backend\.env")) {
  Write-Host ""
  Write-Host "WARNING: backend\.env not found. Create it with:" -ForegroundColor Yellow
  Write-Host "  PORT=5000" -ForegroundColor Gray
  Write-Host "  MONGODB_URI=mongodb://localhost:27017/education-erp" -ForegroundColor Gray
  Write-Host "  JWT_SECRET=your_secret_key" -ForegroundColor Gray
  Write-Host ""
}

Write-Host ""
Write-Host "Starting backend (port 5000) and frontend (port 5173)..." -ForegroundColor Cyan
Write-Host "  - Backend must have MongoDB running (local or set MONGODB_URI in backend\.env)" -ForegroundColor Gray
Write-Host "  - Open in browser: http://localhost:5173" -ForegroundColor Green
Write-Host "  - Health check: http://localhost:5000/api/health" -ForegroundColor Gray
Write-Host ""

npm run dev
