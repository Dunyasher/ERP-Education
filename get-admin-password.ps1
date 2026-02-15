# Get Admin Password Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ADMIN CREDENTIALS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptRoot = $PSScriptRoot
if (-not $scriptRoot) {
    $scriptRoot = Get-Location
}

$backendPath = Join-Path $scriptRoot "backend"

if (-not (Test-Path $backendPath)) {
    Write-Host "[FAIL] Backend directory not found!" -ForegroundColor Red
    exit 1
}

Set-Location $backendPath

Write-Host "Checking admin accounts in database..." -ForegroundColor Yellow
Write-Host ""

# Run the showAdmin script
node scripts/showAdmin.js

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEFAULT ADMIN CREDENTIALS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Email:    admin@college.com" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "If admin doesn't exist, create it with:" -ForegroundColor Yellow
Write-Host "  node scripts/createAdmin.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "To reset password:" -ForegroundColor Yellow
Write-Host "  node scripts/resetAdminPassword.js [email] [newPassword]" -ForegroundColor Cyan
Write-Host ""

