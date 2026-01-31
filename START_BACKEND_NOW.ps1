# Start Backend Server Script
# Run this to fix Network Error

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Backend Server" -ForegroundColor Green
Write-Host "  This will fix the Network Error!" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to backend directory
$backendPath = "C:\Users\sir dunya sher\Desktop\furtniture\backend"

if (Test-Path $backendPath) {
    Set-Location $backendPath
    Write-Host "✅ Navigated to backend folder" -ForegroundColor Green
} else {
    Write-Host "❌ Backend folder not found!" -ForegroundColor Red
    Write-Host "Path: $backendPath" -ForegroundColor Yellow
    pause
    exit
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "⚠️  Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

Write-Host ""
Write-Host "🚀 Starting server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: Keep this window open!" -ForegroundColor Yellow
Write-Host "   The server runs here. Closing this window stops the server." -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ After you see 'Server is running on port 5000':" -ForegroundColor Green
Write-Host "   1. Go back to your browser" -ForegroundColor White
Write-Host "   2. Refresh the login page (F5)" -ForegroundColor White
Write-Host "   3. Network Error will be GONE! ✅" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start the server
npm start

