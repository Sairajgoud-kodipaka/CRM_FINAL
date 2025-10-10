FROM python:3.11-slim

# Build argument to force cache invalidation
ARG BUILD_DATE=2025-10-10-10-03

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

# Copy project (cache busted by BUILD_DATE)
COPY . .

# Create necessary directories
RUN mkdir -p /app/media /app/staticfiles /app/logs /etc/secrets

# Set proper permissions
RUN chmod -R 755 /app/media /app/staticfiles /app/logs
RUN chmod -R 755 /etc/secrets

# Make startup script executable
RUN chmod +x start.sh

# Expose port (use PORT environment variable for Render)
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/api/health/ || exit 1

# Run the application with startup script
CMD ["./start.sh"] 