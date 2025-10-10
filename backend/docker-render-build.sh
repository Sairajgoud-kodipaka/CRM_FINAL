#!/usr/bin/env bash
# Docker-only build script for Render deployment
# This ensures Docker build happens during Render deployment

set -e

echo "🐳 Starting Docker build for Render deployment..."

# Check if we're in the backend directory
if [[ ! -f "manage.py" ]]; then
    echo "❌ Error: manage.py not found. Please run this script from the backend directory."
    exit 1
fi

# Check if Dockerfile exists
if [[ ! -f "Dockerfile" ]]; then
    echo "❌ Error: Dockerfile not found."
    exit 1
fi

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -f Dockerfile -t jewellery-crm-backend .

echo "✅ Docker build completed successfully!"
