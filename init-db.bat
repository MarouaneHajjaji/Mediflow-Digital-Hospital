@echo off
echo Initializing MediFlow Hospital Database...
echo.

REM Change to backend directory
cd /d C:\Users\Admin\Desktop\mediflow-digital-hospital\backend

REM Run the SQL schema file
C:\xampp\mysql\bin\mysql.exe -u root < database\schema.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Database initialized successfully!
    echo ✓ mediflow_hospital database and tables created
) else (
    echo.
    echo ✗ Database initialization failed
    echo Make sure MySQL is running in XAMPP
)

pause
