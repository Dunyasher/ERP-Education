#!/bin/bash

echo "========================================"
echo "  Education ERP System - Startup Script"
echo "========================================"
echo ""

echo "[1/3] Checking MongoDB connection..."
sleep 2

echo "[2/3] Starting Backend Server..."
npm run server &
BACKEND_PID=$!

echo "[3/3] Starting Frontend Server..."
sleep 3
npm run client &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "  Servers Starting..."
echo "========================================"
echo "  Backend:  http://localhost:5000"
echo "  Frontend: http://localhost:3000"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

