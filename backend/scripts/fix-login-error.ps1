# Fix Login Error Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FIXING LOGIN ERROR" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptRoot = $PSScriptRoot
if (-not $scriptRoot) {
    $scriptRoot = Get-Location
}

$backendPath = Join-Path $scriptRoot "backend"

Write-Host "1. Resetting admin password..." -ForegroundColor Yellow
Set-Location $backendPath
node scripts/resetAdminPassword.js admin@college.com admin123
Write-Host ""

Write-Host "2. Testing password..." -ForegroundColor Yellow
node scripts/testLogin.js admin@college.com admin123
Write-Host ""

Write-Host "3. Checking backend server..." -ForegroundColor Yellow
$backendPort = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($backendPort) {
    Write-Host "   [OK] Backend is running" -ForegroundColor Green
    Write-Host "   [INFO] Backend needs to be restarted to apply route fixes" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   To restart backend:" -ForegroundColor Cyan
    Write-Host "   1. Stop the current backend (Ctrl+C)" -ForegroundColor White
    Write-Host "   2. Run: .\start-backend.ps1" -ForegroundColor White
} else {
    Write-Host "   [WARN] Backend is NOT running" -ForegroundColor Yellow
    Write-Host "   Start it with: .\start-backend.ps1" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LOGIN CREDENTIALS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Email:    admin@college.com" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "After restarting backend, try logging in again." -ForegroundColor Yellow
Write-Host ""

