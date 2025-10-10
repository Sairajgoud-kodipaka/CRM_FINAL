@echo off
REM Simple Docker build script for Jewellery CRM Backend (Windows version)
REM This script implements the recommended fix for Docker build issues

set DOCKERFILE_PATH=Dockerfile
set IMAGE_NAME=jewellery-crm-backend
set BUILD_CONTEXT=.

echo 🐳 Building Docker image for Jewellery CRM Backend...

REM Check if we're in the backend directory
if not exist "manage.py" (
    echo ❌ Error: manage.py not found. Please run this script from the backend directory.
    exit /b 1
)

REM Check if Dockerfile exists
if not exist "%DOCKERFILE_PATH%" (
    echo ❌ Error: Dockerfile not found at %DOCKERFILE_PATH%
    exit /b 1
)

REM Build the Docker image using the recommended fix
echo 🔨 Building with command: docker build -f %DOCKERFILE_PATH% -t %IMAGE_NAME% %BUILD_CONTEXT%
docker build -f "%DOCKERFILE_PATH%" -t "%IMAGE_NAME%" "%BUILD_CONTEXT%"

if %ERRORLEVEL% neq 0 (
    echo ❌ Docker build failed!
    exit /b 1
)

echo ✅ Docker image '%IMAGE_NAME%' built successfully!
echo 🚀 You can now run: docker run -p 8000:8000 %IMAGE_NAME%
