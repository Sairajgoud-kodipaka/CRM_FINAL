#!/bin/bash

# Startup script for production deployment
set -e

echo "🚀 Starting Jewellery CRM Backend..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
python manage.py check --database default --deploy

# Run migrations
echo "🔄 Running database migrations..."
python manage.py migrate --noinput

# Collect static files if needed
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput || echo "Static files collection completed"

# Start the application
echo "🌟 Starting Gunicorn server..."
exec gunicorn core.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 2 \
    --timeout 300 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --preload \
    --worker-class sync \
    --access-logfile - \
    --error-logfile -
