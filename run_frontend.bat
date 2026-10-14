@echo off
title BharatRail Frontend Client (Port 5173)
cd client
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)
echo Starting React Vite Frontend on http://localhost:5173 ...
call npm run dev
pause
