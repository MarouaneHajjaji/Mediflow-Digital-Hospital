# Script to start both backend and frontend servers on the same IP address

Write-Host "=== MediFlow Digital Hospital - Starting Servers ===" -ForegroundColor Green
Write-Host ""

# Colors for output
$BackendColor = "Cyan"
$FrontendColor = "Yellow"
$PhpCommand = "php"

if (Test-Path "C:\xampp\php\php.exe") {
    $PhpCommand = "C:\xampp\php\php.exe"
}

# Get local IP address
$IP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.AddressState -eq "Preferred" } | Select-Object -First 1).IPAddress

Write-Host "🖥️  Backend will run on:   http://localhost:8000 or http://$($IP):8000" -ForegroundColor $BackendColor
Write-Host "🌐 Frontend will run on:  http://localhost:3000 or http://$($IP):3000" -ForegroundColor $FrontendColor
Write-Host "PHP command: $PhpCommand" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Magenta
Write-Host ""

# Start backend in a background job
$BackendJob = Start-Job -ScriptBlock {
    param($PhpCommand)
    Set-Location "C:\Users\Admin\Desktop\mediflow-digital-hospital\backend"
    & $PhpCommand -S 0.0.0.0:8000 -t public
} -ArgumentList $PhpCommand

# Give backend a moment to start
Start-Sleep -Seconds 2

# Start frontend in the main process (foreground)
Set-Location "C:\Users\Admin\Desktop\mediflow-digital-hospital"
npm run frontend

# If frontend exits, clean up backend
Stop-Job -Job $BackendJob
Write-Host "Servers stopped." -ForegroundColor Red
