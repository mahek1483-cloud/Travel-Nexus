@echo off
echo ========================================================
echo   Launching Travel Nexus (Fast Local Execution)
echo ========================================================
echo.
echo Starting local web server on port 3000...
start http://localhost:3000
npx serve . -p 3000
