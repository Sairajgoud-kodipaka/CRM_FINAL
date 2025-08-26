#!/usr/bin/env bash
# exit on error
set -o errexit

echo "🚀 Starting build process for Jewellery CRM Backend..."

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --no-input

# Run database migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

# Verify deployment readiness
echo "🔍 Running deployment checks..."
python manage.py check --deploy

echo "✅ Build process completed successfully!"
