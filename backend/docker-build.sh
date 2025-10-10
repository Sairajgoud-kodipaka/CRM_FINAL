#!/usr/bin/env bash
# Simple Docker build script for Jewellery CRM Backend
# This script implements the recommended fix for Docker build issues

set -e

# Configuration
DOCKERFILE_PATH="Dockerfile"
IMAGE_NAME="jewellery-crm-backend"
BUILD_CONTEXT="."

echo "🐳 Building Docker image for Jewellery CRM Backend..."

# Check if we're in the backend directory
if [[ ! -f "manage.py" ]]; then
    echo "❌ Error: manage.py not found. Please run this script from the backend directory."
    exit 1
fi

# Check if Dockerfile exists
if [[ ! -f "$DOCKERFILE_PATH" ]]; then
    echo "❌ Error: Dockerfile not found at $DOCKERFILE_PATH"
    exit 1
fi

# Build the Docker image using the recommended fix
echo "🔨 Building with command: docker build -f $DOCKERFILE_PATH -t $IMAGE_NAME $BUILD_CONTEXT"
docker build -f "$DOCKERFILE_PATH" -t "$IMAGE_NAME" "$BUILD_CONTEXT"

echo "✅ Docker image '$IMAGE_NAME' built successfully!"
echo "🚀 You can now run: docker run -p 8000:8000 $IMAGE_NAME"
