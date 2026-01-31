# Quick Backend Startup Script
# This script starts the backend server

Write-Host "🚀 Starting Backend Server..." -ForegroundColor Green
Write-Host ""

# Change to backend directory
Set-Location -Path "backend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the server
Write-Host "📡 Starting server on port 5000..." -ForegroundColor Cyan
Write-Host ""
npm start

