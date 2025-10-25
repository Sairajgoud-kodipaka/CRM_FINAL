#!/bin/bash
# Utho VM Production Startup Script
# This script is designed for Utho Cloud VM deployment

# Exit on any error
set -e

echo "🚀 Starting Jewellery CRM Backend on Utho VM..."

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1)
echo "✓ Python Version: $PYTHON_VERSION"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Please create .env file with production settings"
    exit 1
fi
echo "✓ Environment file found"

# Wait for database to be ready
echo "⏳ Checking database connection..."
python3 << 'PYEOF'
import os
import sys
import time
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection

max_attempts = 30
for i in range(max_attempts):
    try:
        connection.ensure_connection()
        print(f'✓ Database connection successful!')
        break
    except Exception as e:
        if i < max_attempts - 1:
            print(f'  Attempt {i+1}/{max_attempts}: Waiting for database...')
            time.sleep(2)
        else:
            print(f'❌ Database connection failed after {max_attempts} attempts')
            print(f'   Error: {e}')
            sys.exit(1)
PYEOF

# Run migrations
echo "📊 Running database migrations..."
python3 manage.py migrate --noinput

# Create superuser if no users exist
echo "👤 Checking if any users exist..."
python3 manage.py shell << 'EOF'
from django.contrib.auth import get_user_model
User = get_user_model()

user_count = User.objects.count()
print(f'Total users in database: {user_count}')

if user_count == 0:
    # Only create admin if NO users exist
    User.objects.create_superuser(
        username='admin',
        email='admin@jewelrycrm.com',
        password='admin123'
    )
    print('✅ Created initial admin user: admin/admin123')
else:
    print(f'✅ Found {user_count} existing users - preserving all data')
EOF

# Collect static files
echo "📦 Collecting static files..."
python3 manage.py collectstatic --noinput

# Create necessary directories
mkdir -p logs media staticfiles
echo "✓ Created necessary directories"

# Start the application
echo "🎯 Starting application server..."

# Determine port (default to 8000 for Utho VM)
PORT=${PORT:-8000}

# Use ASGI (Uvicorn) by default for Utho VM
echo "🚀 Starting Uvicorn (ASGI) server on port $PORT..."
exec uvicorn core.asgi:application \
    --host 0.0.0.0 \
    --port $PORT \
    --workers 2 \
    --proxy-headers \
    --log-level warning \
    --access-log