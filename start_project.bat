@echo off
title BharatRail - Starting Full MERN Stack
echo ========================================================
echo   Starting BharatRail Railway Ticket Booking Platform
echo ========================================================
echo.

echo 1. Checking dependencies...
if not exist "server\node_modules" (
    echo Installing backend dependencies...
    cd server && call npm install && cd ..
)

if not exist "client\node_modules" (
    echo Installing frontend dependencies...
    cd client && call npm install && cd ..
)

echo.
echo 2. Launching Backend and Frontend in separate windows...
start "BharatRail Backend (Port 5000)" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak >nul
start "BharatRail Frontend (Port 5173)" cmd /k "cd client && npm run dev"

echo.
echo ========================================================
echo   Application started!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo ========================================================
echo.
pause
