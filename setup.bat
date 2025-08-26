@echo off
setlocal enabledelayedexpansion

REM JulyCrm Setup Script for Windows
REM This script will install all dependencies and set up the development environment

echo 🚀 Starting JulyCrm Setup...
echo ================================

REM Check if Python is installed
echo [INFO] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)
python --version
echo [SUCCESS] Python found

REM Check if Node.js is installed
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)
node --version
echo [SUCCESS] Node.js found

REM Check if npm is installed
echo [INFO] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm first.
    pause
    exit /b 1
)
npm --version
echo [SUCCESS] npm found

echo.
echo [INFO] Starting setup process...

REM Setup Backend
echo [INFO] Setting up Backend (Django)...
cd backend

REM Create virtual environment
echo [INFO] Creating Python virtual environment...
python -m venv venv

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo [INFO] Upgrading pip...
python -m pip install --upgrade pip

REM Install Python dependencies
echo [INFO] Installing Python dependencies...
pip install -r requirements.txt

REM Create .env file from example
if not exist .env (
    echo [INFO] Creating .env file from example...
    copy env.example .env
    echo [WARNING] Please update the .env file with your database credentials and other settings.
)

REM Run Django migrations
echo [INFO] Running Django migrations...
python manage.py migrate

REM Create superuser
echo [INFO] Creating superuser...
echo from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'admin123') if not User.objects.filter(username='admin').exists() else None | python manage.py shell

echo [SUCCESS] Backend setup completed!
cd ..

REM Setup Frontend
echo [INFO] Setting up Frontend (Next.js)...
cd jewellery-crm

REM Install Node.js dependencies
echo [INFO] Installing Node.js dependencies...
npm install

REM Create .env.local file if it doesn't exist
if not exist .env.local (
    echo [INFO] Creating .env.local file...
    (
        echo # API Configuration
        echo NEXT_PUBLIC_API_URL=http://localhost:8000
        echo.
        echo # Authentication
        echo NEXTAUTH_URL=http://localhost:3000
        echo NEXTAUTH_SECRET=your-secret-key-here
        echo.
        echo # Database (if needed)
        echo DATABASE_URL=your-database-url-here
    ) > .env.local
    echo [WARNING] Please update the .env.local file with your configuration.
)

echo [SUCCESS] Frontend setup completed!
cd ..

REM Create run scripts
echo [INFO] Creating run scripts...

REM Backend run script
(
    echo @echo off
    echo cd backend
    echo call venv\Scripts\activate.bat
    echo python manage.py runserver 8000
) > run_backend.bat

REM Frontend run script
(
    echo @echo off
    echo cd jewellery-crm
    echo npm run dev
) > run_frontend.bat

REM Combined run script
(
    echo @echo off
    echo echo Starting both backend and frontend...
    echo start "Backend" cmd /k "run_backend.bat"
    echo start "Frontend" cmd /k "run_frontend.bat"
    echo echo Both servers are now running in separate windows.
    echo echo Close the windows to stop the servers.
    echo pause
) > run_both.bat

echo [SUCCESS] Run scripts created!

echo.
echo 🎉 Setup completed successfully!
echo ================================
echo.
echo 📋 Next Steps:
echo 1. Update backend/.env with your database settings
echo 2. Update jewellery-crm/.env.local with your API configuration
echo 3. Run the application using one of the following commands:
echo    - run_backend.bat (backend only)
echo    - run_frontend.bat (frontend only)
echo    - run_both.bat (both backend and frontend)
echo.
echo 🌐 Access URLs:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:8000
echo    - Django Admin: http://localhost:8000/admin
echo.
echo 🔑 Default Admin Credentials:
echo    - Username: admin
echo    - Password: admin123
echo.
echo 📚 Documentation:
echo    - Check the README.md files in each directory
echo    - API documentation available at http://localhost:8000/api/
echo.
pause 