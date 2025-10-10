FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Create necessary directories
RUN mkdir -p /app/media /app/staticfiles /app/logs /etc/secrets

# Set proper permissions
RUN chmod -R 755 /app/media /app/staticfiles /app/logs
RUN chmod -R 755 /etc/secrets

# Collect static files (skip if not needed for faster builds)
RUN python manage.py collectstatic --noinput || echo "Static files collection skipped"

# Expose port (use PORT environment variable for Render)
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/api/health/ || exit 1

# Run the application with Gunicorn
CMD exec gunicorn core.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 300 --max-requests 1000 --max-requests-jitter 100 --preload --worker-class sync 