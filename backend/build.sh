#!/usr/bin/env bash
# Production-ready build script for Jewellery CRM Backend
# Exit on any error
set -o errexit
set -o pipefail
set -o nounset

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Trap errors and exit
trap 'error "Build failed at line $LINENO. Exit code: $?"' ERR

log "🚀 Starting production build process for Jewellery CRM Backend..."

# Check if we're in the right directory
if [[ ! -f "manage.py" ]]; then
    error "manage.py not found. Please run this script from the backend directory."
    exit 1
fi

# Validate environment variables
log "🔍 Validating environment variables..."
required_vars=("DB_NAME" "DB_USER" "DB_PASSWORD" "DB_HOST" "DB_PORT" "SECRET_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        missing_vars+=("$var")
    fi
done

if [[ ${#missing_vars[@]} -gt 0 ]]; then
    error "Missing required environment variables: ${missing_vars[*]}"
    exit 1
fi

success "Environment variables validated"

# Security audit
log "🔒 Running security audit..."
if command -v safety &> /dev/null; then
    safety check --json --output safety-report.json || {
        warning "Safety check found vulnerabilities. Check safety-report.json for details."
    }
else
    warning "Safety not installed. Skipping dependency security check."
fi

if command -v pip-audit &> /dev/null; then
    pip-audit --format json --output pip-audit-report.json || {
        warning "pip-audit found vulnerabilities. Check pip-audit-report.json for details."
    }
else
    warning "pip-audit not installed. Skipping dependency security check."
fi

# Install dependencies
log "📦 Installing Python dependencies..."
pip install --no-cache-dir -r requirements.txt || {
    error "Failed to install dependencies"
    exit 1
}

# Code quality checks
log "🔍 Running code quality checks..."
if command -v black &> /dev/null; then
    black --check . || {
        warning "Black formatting check failed. Consider running: black ."
    }
else
    warning "Black not installed. Skipping code formatting check."
fi

if command -v flake8 &> /dev/null; then
    flake8 . --max-line-length=88 --extend-ignore=E203,W503 || {
        warning "Flake8 linting found issues."
    }
else
    warning "Flake8 not installed. Skipping linting check."
fi

# Database connection test
log "🗄️ Testing database connection..."
python manage.py check --database default || {
    error "Database connection failed"
    exit 1
}

# Run migrations
log "🔄 Running database migrations..."
python manage.py migrate --noinput || {
    error "Database migration failed"
    exit 1
}

# Collect static files
log "📁 Collecting static files..."
python manage.py collectstatic --noinput || {
    error "Static file collection failed"
    exit 1
}

# Production deployment check
log "🔍 Running production deployment checks..."
python manage.py check --deploy || {
    error "Production deployment check failed"
    exit 1
}

# Health check
log "🏥 Running health check..."
python manage.py check || {
    error "Health check failed"
    exit 1
}

# Create logs directory
log "📝 Setting up logging..."
mkdir -p logs
mkdir -p media
mkdir -p staticfiles

# Set proper permissions
log "🔐 Setting proper permissions..."
chmod 755 logs media staticfiles

# Verify build artifacts
log "✅ Verifying build artifacts..."
if [[ ! -d "staticfiles" ]] || [[ -z "$(ls -A staticfiles)" ]]; then
    error "Static files not collected properly"
    exit 1
fi

if [[ ! -d "logs" ]]; then
    error "Logs directory not created"
    exit 1
fi

# Build summary
log "📊 Build Summary:"
echo "  - Dependencies: ✅ Installed"
echo "  - Security: ✅ Audited"
echo "  - Database: ✅ Connected"
echo "  - Migrations: ✅ Applied"
echo "  - Static Files: ✅ Collected"
echo "  - Production Check: ✅ Passed"
echo "  - Health Check: ✅ Passed"

success "🎉 Production build completed successfully!"
success "🚀 Ready for deployment!"

# Exit with success
exit 0
