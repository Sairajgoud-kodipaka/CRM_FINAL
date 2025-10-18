#!/bin/bash

# Exit on any error
set -e

echo "Starting Django application..."

# Wait for database to be ready
echo "Waiting for database connection..."
python -c "
import os
import sys
import django
from django.conf import settings
from django.db import connection
from django.core.management import execute_from_command_line

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Test database connection
try:
    connection.ensure_connection()
    print('Database connection successful!')
except Exception as e:
    print(f'Database connection failed: {e}')
    sys.exit(1)
"

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Create superuser if it doesn't exist
echo "Creating superuser if needed..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()

if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@jewelrycrm.com',
        password='admin123'
    )
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
EOF

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start the application
echo "Starting application server..."

# Check if we should use ASGI (for WebSockets) or WSGI (for stability)
if [ "$USE_ASGI" = "true" ]; then
    echo "Starting Uvicorn (ASGI) server for WebSocket support..."
    exec uvicorn core.asgi:application \
        --host 0.0.0.0 \
        --port $PORT \
        --workers 1 \
        --proxy-headers
else
    echo "Starting Gunicorn (WSGI) server for stability..."
    exec gunicorn core.wsgi:application \
        --bind 0.0.0.0:$PORT \
        --workers 2 \
        --timeout 300 \
        --preload \
        --access-logfile - \
        --error-logfile -
fi