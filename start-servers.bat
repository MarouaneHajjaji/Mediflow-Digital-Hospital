@echo off
setlocal enabledelayedexpansion

title MediFlow Digital Hospital - Servers

set "PHP_CMD=php"
if exist "C:\xampp\php\php.exe" (
  set "PHP_CMD=C:\xampp\php\php.exe"
)

echo.
echo ======== MediFlow Digital Hospital - Starting Servers ========
echo.
echo Backend will run on:   http://localhost:8000 (or your IP:8000)
echo Frontend will run on:  http://localhost:3000 (or your IP:3000)
echo.
echo PHP command: %PHP_CMD%
echo Press Ctrl+C to stop servers
echo.

cd /d C:\Users\Admin\Desktop\mediflow-digital-hospital

REM Start backend in a separate window
echo Starting PHP backend on port 8000...
start "MediFlow Backend" cmd /k %PHP_CMD% -S 0.0.0.0:8000 -t backend/public

REM Wait a moment for backend to start
timeout /t 2 /nobreak

REM Start frontend in another window
echo Starting Vite frontend on port 3000...
start "MediFlow Frontend" cmd /k npm run frontend

echo.
echo Both servers are starting in separate windows...
echo Close the windows to stop the servers.
