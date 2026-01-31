# PowerShell script to start frontend server
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Green
Write-Host ""

$clientPath = Join-Path $PSScriptRoot "client"
Set-Location $clientPath

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "Creating .env template..." -ForegroundColor Yellow
    @"
VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:5173
VITE_BACKEND_URL=http://localhost:5000
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "✅ .env file created." -ForegroundColor Green
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "🔧 Starting Vite dev server on port 5173..." -ForegroundColor Cyan
Write-Host ""

# Start the server
npm run dev

