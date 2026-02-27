Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Checking and Fixing Connection Issues" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check MongoDB
Write-Host "1. Checking MongoDB..." -ForegroundColor Yellow
$mongoService = Get-Service MongoDB -ErrorAction SilentlyContinue
if ($mongoService) {
    if ($mongoService.Status -eq 'Running') {
        Write-Host "   ✅ MongoDB is running" -ForegroundColor Green
    } else {
        Write-Host "   ❌ MongoDB is not running" -ForegroundColor Red
        Write-Host "   → Starting MongoDB..." -ForegroundColor Yellow
        try {
            Start-Service MongoDB -ErrorAction Stop
            Write-Host "   ✅ MongoDB started" -ForegroundColor Green
            Start-Sleep -Seconds 3
        } catch {
            Write-Host "   ⚠️  Could not start MongoDB: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "   → Try manually: net start MongoDB (requires admin)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ⚠️  MongoDB service not found" -ForegroundColor Yellow
    Write-Host "   → MongoDB may not be installed or using a different name" -ForegroundColor Gray
}

# Step 2: Check Backend Port
Write-Host ""
Write-Host "2. Checking Backend Port (5000)..." -ForegroundColor Yellow
$backendPort = netstat -ano | findstr ":5000" | findstr "LISTENING"
if ($backendPort) {
    $pid = ($backendPort -split '\s+')[-1]
    Write-Host "   ✅ Port 5000 is in use (PID: $pid)" -ForegroundColor Green
    
    # Test if backend is responding
    Write-Host ""
    Write-Host "3. Testing Backend Response..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 5
        Write-Host "   ✅ Backend is responding!" -ForegroundColor Green
        Write-Host "   Status: $($response.status)" -ForegroundColor White
    } catch {
        Write-Host "   ❌ Backend is not responding" -ForegroundColor Red
        Write-Host "   → The backend process exists but may be stuck" -ForegroundColor Yellow
        Write-Host "   → Restarting backend..." -ForegroundColor Yellow
        
        # Kill and restart
        try {
            Stop-Process -Id $pid -Force -ErrorAction Stop
            Write-Host "   ✅ Stopped old backend process" -ForegroundColor Green
            Start-Sleep -Seconds 2
        } catch {
            Write-Host "   ⚠️  Could not stop process: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Start new backend
        $scriptPath = "C:\Users\Dunya Sher\Desktop\college management"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath'; Write-Host '🚀 Starting Backend Server...' -ForegroundColor Green; npm run start:backend" -WindowStyle Normal
        Write-Host "   ✅ Backend restarting in new window..." -ForegroundColor Green
        Write-Host "   → Wait 10 seconds for backend to start" -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        # Test again
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 5
            Write-Host "   ✅ Backend is now responding!" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Backend still not responding. Check the backend window for errors." -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ❌ Backend is not running on port 5000" -ForegroundColor Red
    Write-Host "   → Starting backend..." -ForegroundColor Yellow
    
    $scriptPath = "C:\Users\Dunya Sher\Desktop\college management"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath'; Write-Host '🚀 Starting Backend Server...' -ForegroundColor Green; npm run start:backend" -WindowStyle Normal
    Write-Host "   ✅ Backend starting in new window..." -ForegroundColor Green
    Write-Host "   → Wait 10 seconds for backend to start" -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Test connection
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 5
        Write-Host "   ✅ Backend is responding!" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Backend not responding yet. Check the backend window." -ForegroundColor Yellow
    }
}

# Step 4: Check Frontend
Write-Host ""
Write-Host "4. Checking Frontend Port (5173)..." -ForegroundColor Yellow
$frontendPort = netstat -ano | findstr ":5173" | findstr "LISTENING"
if ($frontendPort) {
    Write-Host "   ✅ Frontend is running on port 5173" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Frontend is not running on port 5173" -ForegroundColor Yellow
    Write-Host "   → Start frontend: npm run start:frontend" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. If backend was restarted, wait for 'Server is ready' message" -ForegroundColor Cyan
Write-Host "2. Refresh your browser at http://localhost:5173/login" -ForegroundColor Cyan
Write-Host "3. Try logging in again" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you still see errors:" -ForegroundColor Yellow
Write-Host "→ Check the backend terminal window for MongoDB connection errors" -ForegroundColor White
Write-Host "→ Make sure MongoDB is running: Get-Service MongoDB" -ForegroundColor White
Write-Host ""

