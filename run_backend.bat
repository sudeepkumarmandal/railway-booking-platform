@echo off
title BharatRail Backend Server (Port 5000)
cd server
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
)
echo Starting Express Backend on http://localhost:5000 ...
call npm run dev
pause
