# 🚀 Setup Guide for Teammates

## Quick Fix for Build Errors

If you're getting build wheel errors, follow these steps:

### Option 1: Use Recommended Python Version (Recommended)

```bash
# 1. Install Python 3.11 or 3.12
# Download from: https://www.python.org/downloads/

# 2. Create new virtual environment
python3.11 -m venv venv
# OR
python3.12 -m venv venv

# 3. Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### Option 2: If You Must Use Python 3.13

```bash
# 1. Update pip and build tools
python -m pip install --upgrade pip setuptools wheel

# 2. Try installing with specific flags
pip install --no-build-isolation -r requirements.txt

# 3. If that fails, install packages individually
pip install Django==4.2.7
pip install djangorestframework==3.14.0
pip install psycopg2==2.9.9
# ... continue with other packages
```

## Backend Setup

```bash
cd backend

# Check Python version compatibility
python check_python_version.py

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

## Frontend Setup

```bash
cd jewellery-crm

# Install dependencies
npm install

# Run development server
npm run dev
```

## Full Development Setup

```bash
# Backend (Terminal 1)
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (Terminal 2)
cd jewellery-crm
npm install
npm run dev
```

## Common Issues & Solutions

### Build Wheel Error
- **Cause**: Python 3.13 compatibility issues
- **Solution**: Use Python 3.11 or 3.12

### psycopg2 Installation Error
- **Cause**: Missing PostgreSQL development headers
- **Solution**: 
  - Windows: Install PostgreSQL or use `psycopg2-binary`
  - Mac: `brew install postgresql`
  - Linux: `sudo apt-get install libpq-dev`

### Prisma Issues
- **Cause**: Prisma may not support Python 3.13
- **Solution**: Comment out prisma in requirements.txt if not needed

### Node.js Issues
- **Cause**: Version compatibility
- **Solution**: Use Node.js 18+ and npm 9+

## Environment Variables

Create a `.env` file in the backend directory:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DB_NAME=jewellery_crm
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432
```

## Production Deployment

The project is configured for deployment on:
- **Backend**: Render.com
- **Frontend**: Vercel.com
- **Database**: PostgreSQL (Render managed)

## Need Help?

1. Check the Python version: `python check_python_version.py`
2. Check the logs: `backend/logs/django.log`
3. Run tests: `python manage.py test`
4. Check API health: `http://localhost:8000/api/health/`
