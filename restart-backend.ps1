Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Restarting Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find process using port 5000
Write-Host "1. Finding process using port 5000..." -ForegroundColor Yellow
$connections = netstat -ano | findstr ":5000" | findstr "LISTENING"
if ($connections) {
    $pid = ($connections -split '\s+')[-1]
    Write-Host "   Found process ID: $pid" -ForegroundColor White
    
    # Get process info
    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "   Process Name: $($process.ProcessName)" -ForegroundColor White
        Write-Host "   Process Path: $($process.Path)" -ForegroundColor Gray
    }
    
    # Kill the process
    Write-Host ""
    Write-Host "2. Stopping existing backend process..." -ForegroundColor Yellow
    try {
        Stop-Process -Id $pid -Force -ErrorAction Stop
        Write-Host "   ✅ Process stopped successfully" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "   ⚠️  Could not stop process: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Try manually: taskkill /PID $pid /F" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ️  No process found on port 5000" -ForegroundColor Gray
}

Write-Host ""
Write-Host "3. Starting backend server..." -ForegroundColor Yellow
Write-Host "   (This will open in a new window)" -ForegroundColor Gray
Write-Host ""

# Start backend in new window
$scriptPath = "C:\Users\Dunya Sher\Desktop\college management"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath'; Write-Host 'Starting Backend Server...' -ForegroundColor Green; npm run start:backend" -WindowStyle Normal

Write-Host "   ✅ Backend server starting..." -ForegroundColor Green
Write-Host ""
Write-Host "4. Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Test connection
Write-Host ""
Write-Host "5. Testing backend connection..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 5
    Write-Host "   ✅ Backend is responding!" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor White
    Write-Host "   Message: $($response.message)" -ForegroundColor White
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ Backend is ready!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now try logging in at: http://localhost:5173/login" -ForegroundColor Cyan
} catch {
    Write-Host "   ⚠️  Backend not responding yet: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   Wait a few more seconds and check the backend window for errors" -ForegroundColor Yellow
    Write-Host "   Or test manually: curl http://localhost:5000/api/health" -ForegroundColor Gray
}

Write-Host ""

