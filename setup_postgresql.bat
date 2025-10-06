@echo off
echo Setting up PostgreSQL for Jewelry CRM...

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo PostgreSQL is not installed or not in PATH.
    echo Please install PostgreSQL from https://www.postgresql.org/download/
    pause
    exit /b 1
)

REM Check if PostgreSQL service is running
pg_isready -q
if %ERRORLEVEL% NEQ 0 (
    echo PostgreSQL service is not running.
    echo Please start PostgreSQL service from Services or pgAdmin.
    pause
    exit /b 1
)

echo Creating database and user...

REM Create user (if it doesn't exist)
psql -U postgres -c "CREATE USER postgres WITH PASSWORD 'postgres';" 2>nul || echo User postgres already exists

REM Create database (if it doesn't exist)
psql -U postgres -c "CREATE DATABASE jewelry_crm_dev OWNER postgres;" 2>nul || echo Database jewelry_crm_dev already exists

REM Grant privileges
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE jewelry_crm_dev TO postgres;"

echo PostgreSQL setup completed!
echo Database: jewelry_crm_dev
echo User: postgres
echo Password: postgres
echo Host: localhost
echo Port: 5432

echo.
echo Next steps:
echo 1. Copy development.env to .env
echo 2. Run: python manage.py migrate
echo 3. Run: python manage.py runserver

pause
