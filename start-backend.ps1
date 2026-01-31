# PowerShell script to start backend server
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Green
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "backend"
Set-Location $backendPath

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "Creating .env template..." -ForegroundColor Yellow
    @"
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/furniture
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
JWT_SECRET=change-this-to-a-random-secret-key
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=change-this-to-a-random-secret-key
REFRESH_TOKEN_EXPIRE=30d
SESSION_SECRET=change-this-to-a-random-secret-key
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "✅ .env file created. Please configure it." -ForegroundColor Green
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "🔧 Starting server on port 5000..." -ForegroundColor Cyan
Write-Host ""

# Start the server
npm start

