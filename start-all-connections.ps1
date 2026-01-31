# PowerShell Script to Start All Connections
# Frontend, Backend, and Database

Write-Host "🚀 Starting All Connections..." -ForegroundColor Green
Write-Host ""

# Check if MongoDB is running
Write-Host "📊 Checking MongoDB..." -ForegroundColor Yellow
try {
    $mongoProcess = Get-Process -Name "mongod" -ErrorAction SilentlyContinue
    if ($mongoProcess) {
        Write-Host "✅ MongoDB is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MongoDB process not found. Make sure MongoDB is running." -ForegroundColor Yellow
        Write-Host "   Start MongoDB: net start MongoDB" -ForegroundColor Cyan
    }
} catch {
    Write-Host "⚠️  Could not check MongoDB status" -ForegroundColor Yellow
}

Write-Host ""

# Check environment files
Write-Host "📝 Checking Environment Files..." -ForegroundColor Yellow

$backendEnv = "backend\.env"
$clientEnv = "client\.env"

if (Test-Path $backendEnv) {
    Write-Host "✅ Backend .env file exists" -ForegroundColor Green
} else {
    Write-Host "❌ Backend .env file NOT found!" -ForegroundColor Red
    Write-Host "   Create backend/.env with required variables" -ForegroundColor Cyan
}

if (Test-Path $clientEnv) {
    Write-Host "✅ Client .env file exists" -ForegroundColor Green
} else {
    Write-Host "❌ Client .env file NOT found!" -ForegroundColor Red
    Write-Host "   Create client/.env with VITE_API_URL=http://localhost:5000/api" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🔧 Starting Services..." -ForegroundColor Yellow
Write-Host ""

# Start Backend
Write-Host "1️⃣  Starting Backend Server..." -ForegroundColor Cyan
Write-Host "   Running: cd backend; npm start" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm start" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "2️⃣  Starting Frontend Server..." -ForegroundColor Cyan
Write-Host "   Running: cd client; npm run dev" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\client'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Services Starting..." -ForegroundColor Green
Write-Host ""
Write-Host "📋 Access Points:" -ForegroundColor Yellow
Write-Host "   • Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "   • Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   • API: http://localhost:5000/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏳ Wait a few seconds for servers to start..." -ForegroundColor Yellow
Write-Host ""
Write-Host "To verify connections, run: node connect-all.js" -ForegroundColor Cyan

