@echo off
REM Toggle Script for Windows
REM Switches between Production and Development modes

if "%1"=="dev" (
    echo 🔄 Switching to Development Mode...
    python toggle.py dev
    goto :end
)

if "%1"=="prod" (
    echo 🔄 Switching to Production Mode...
    python toggle.py prod
    goto :end
)

if "%1"=="status" (
    python toggle.py status
    goto :end
)

if "%1"=="setup" (
    echo 🚀 Setting up Development Environment...
    python toggle.py setup
    goto :end
)

echo 🔧 Jewelry CRM Environment Toggle
echo =================================
echo Usage:
echo   toggle.bat dev     - Switch to development mode
echo   toggle.bat prod    - Switch to production mode
echo   toggle.bat status  - Show current status
echo   toggle.bat setup   - Complete development setup
echo.
python toggle.py status

:end
pause
