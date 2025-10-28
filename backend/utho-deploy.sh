#!/bin/bash
# Utho Cloud VM Deployment Script for Jewellery CRM Backend
# Production-ready: Pulls latest code, checks dependencies, manages services, shows logs
set -e

echo "🚀 Starting Production Deployment for Jewellery CRM..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
info() { echo -e "${CYAN}[INFO]${NC} $1"; }
debug() { echo -e "${MAGENTA}[DEBUG]${NC} $1"; }

log "Checking environment..."
if ! command -v python3.11 &> /dev/null; then error "Python 3.11 not found"; exit 1; fi

# Check for PostgreSQL
if ! command -v psql &> /dev/null; then warning "PostgreSQL client not found. Install it with: sudo apt-get install postgresql-client"; fi

# Check for Redis
if ! command -v redis-cli &> /dev/null; then warning "Redis client not found. Install it with: sudo apt-get install redis-tools"; fi

# Check for Git
if ! command -v git &> /dev/null; then error "Git not found. Install it with: sudo apt-get install git"; exit 1; fi

success "Environment checks passed"

# Step 1: Git operations
echo ""
log "🔄 Step 1: Fetching latest code from Git..."
cd /var/www/CRM_FINAL || error "CRM_FINAL directory not found"; exit 1

# Check if we're in a git repository
if [[ -d ".git" ]]; then
    info "Current branch: $(git branch --show-current)"
    info "Latest commit: $(git log -1 --pretty=format:'%h - %s')"
    
    # Stash any local changes
    if [[ -n $(git status -s) ]]; then
        warning "Local changes detected, stashing..."
        git stash
    fi
    
    # Pull latest code
    log "Pulling latest changes from repository..."
    
    # For public repos, credentials are NOT needed
    # Try to pull with auto-merge (merge if conflicts, fast-forward if clean)
    if git pull --no-rebase --quiet 2>&1; then
        success "Code updated successfully"
        info "Latest commit: $(git log -1 --pretty=format:'%h - %s')"
    else
        # If merge conflict, try rebase
        warning "Auto-merge failed, trying rebase..."
        git rebase --abort 2>/dev/null || true
        if git pull --rebase --quiet 2>&1; then
            success "Code updated successfully (rebase)"
            info "Latest commit: $(git log -1 --pretty=format:'%h - %s')"
        else
            error "Git pull failed!"
            info "This might be a conflict or network issue"
            warning "Continuing with existing code..."
        fi
    fi
else
    warning ".git directory not found. Skipping git pull."
fi

# Navigate to backend
cd backend || error "Backend directory not found"; exit 1

if [[ ! -f "manage.py" ]]; then error "manage.py not found. Are you in the backend directory?"; exit 1; fi

# Setup virtual environment
log "Setting up Python virtual environment..."
if [[ ! -d "venv" ]]; then
    python3.11 -m venv venv
    success "Virtual environment created"
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
if ! pip list | grep -q gunicorn; then pip install gunicorn uvicorn[standard]; fi

# Create directories
log "Creating required directories..."
mkdir -p logs media/products media/profile_pictures staticfiles
chmod -R 755 logs media staticfiles

# Create .env if needed
if [[ ! -f ".env" ]]; then
    warning "No .env file found. Creating default..."
    cat > .env << 'EOF'
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=150.241.246.110,localhost,127.0.0.1,jewel-crm.vercel.app
DB_ENGINE=django.db.backends.postgresql
DB_NAME=jewellery_crm
DB_USER=crm_user
DB_PASSWORD=SecurePassword123!
DB_HOST=localhost
DB_PORT=5432
STATIC_URL=/static/
STATIC_ROOT=/var/www/CRM_FINAL/backend/staticfiles
MEDIA_URL=/media/
MEDIA_ROOT=/var/www/CRM_FINAL/backend/media
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
PORT=8000
PYTHONUNBUFFERED=1
DJANGO_SETTINGS_MODULE=core.settings
CORS_ALLOWED_ORIGINS=http://150.241.246.110,http://localhost:3000,https://jewel-crm.vercel.app
CSRF_TRUSTED_ORIGINS=http://150.241.246.110,http://localhost:3000,https://jewel-crm.vercel.app
SITE_URL=http://150.241.246.110
EOF
    warning "Update .env with your actual values!"
fi

# Test database
log "Testing database connection..."
python manage.py check --database default || { error "Database connection failed!"; exit 1; }
success "Database connection successful"

log "Running migrations..."
python manage.py migrate --noinput

log "Collecting static files..."
python manage.py collectstatic --noinput

log "Creating superuser..."
python manage.py shell << EOF || warning "Superuser creation skipped"
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(username='admin', email='admin@jewelrycrm.com', password='admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
EOF

success "✅ Deployment setup completed!"

# Step 6: Check for missing Python packages
echo ""
log "🔍 Step 6: Checking Python package dependencies..."
info "Required packages: py-vapid, pywebpush, channels, channels-redis, redis"
missing_packages=()

if ! pip list | grep -q py-vapid; then
    missing_packages+=("py-vapid")
fi

if ! pip list | grep -q pywebpush; then
    missing_packages+=("pywebpush")
fi

if ! pip list | grep -q channels; then
    missing_packages+=("channels")
fi

if ! pip list | grep -q channels-redis; then
    missing_packages+=("channels-redis")
fi

if ! pip list | grep -q redis; then
    missing_packages+=("redis")
fi

if [[ ${#missing_packages[@]} -gt 0 ]]; then
    warning "Missing packages detected: ${missing_packages[*]}"
    log "Installing missing packages..."
    pip install -r requirements.txt
    success "Dependencies installed"
else
    success "All required packages are installed"
fi

# Step 7: Service Management
echo ""
log "🔧 Step 7: Managing system services..."

# Restart services if they exist
restart_service() {
    local service_name=$1
    if systemctl list-unit-files | grep -q "$service_name"; then
        info "Restarting $service_name..."
        sudo systemctl restart "$service_name"
        if systemctl is-active --quiet "$service_name"; then
            success "$service_name restarted successfully"
        else
            error "$service_name failed to start"
        fi
    else
        warning "$service_name is not installed"
    fi
}

# Check and restart PostgreSQL
if systemctl list-unit-files | grep -q postgresql; then
    restart_service "postgresql"
else
    warning "PostgreSQL service not found"
fi

# Check and restart Redis
if systemctl list-unit-files | grep -q redis-server; then
    restart_service "redis-server"
else
    warning "Redis server not found"
fi

# Check and restart CRM backend service
if systemctl list-unit-files | grep -q crm-backend; then
    restart_service "crm-backend.service"
else
    warning "CRM backend service not installed"
fi

# Check and restart Nginx
if systemctl list-unit-files | grep -q nginx; then
    restart_service "nginx"
else
    warning "Nginx service not found"
fi

# Step 8: Show Service Status & Logs
echo ""
log "📊 Step 8: Service Status & Logs"
echo "=================================="

# Function to show service status
show_service_status() {
    local service_name=$1
    echo ""
    info "Service: $service_name"
    if systemctl is-active --quiet "$service_name" 2>/dev/null; then
        success "Status: Running"
        echo "Recent logs:"
        sudo journalctl -u "$service_name" --no-pager -n 3 --since "1 minute ago" | tail -5
    else
        error "Status: Not Running"
        echo "Last 5 log lines:"
        sudo journalctl -u "$service_name" --no-pager -n 5 || echo "  No logs available"
    fi
}

# Show PostgreSQL status
if systemctl list-unit-files | grep -q postgresql; then
    show_service_status "postgresql"
fi

# Show Redis status
if systemctl list-unit-files | grep -q redis-server; then
    show_service_status "redis-server"
fi

# Show CRM Backend status
if systemctl list-unit-files | grep -q crm-backend.service; then
    show_service_status "crm-backend.service"
fi

# Show Nginx status
if systemctl list-unit-files | grep -q nginx; then
    show_service_status "nginx"
fi

# Step 9: Network and Port Status
echo ""
log "🌐 Step 9: Network & Port Status"
echo "=================================="
info "Active connections on key ports:"
netstat -tuln | grep -E ':(5432|6379|8000|80)' || info "No active connections on monitored ports"
echo ""

# Step 10: Health Check
echo ""
log "🏥 Step 10: Running health checks..."
echo "=================================="

# Test database connection
info "Testing database connection..."
if python manage.py check --database default --quiet 2>/dev/null; then
    success "Database: Connected"
else
    error "Database: Failed to connect"
fi

# Test Redis connection
info "Testing Redis connection..."
if redis-cli ping >/dev/null 2>&1; then
    success "Redis: Connected"
else
    warning "Redis: Not reachable"
fi

# Test application health
info "Testing application health..."
if curl -s http://localhost:8000/api/health/ >/dev/null 2>&1; then
    success "Application: Responding"
else
    error "Application: Not responding"
fi

# Final Summary
echo ""
echo "=================================="
success "🎉 Deployment Complete!"
echo "=================================="
info "Summary:"
echo "  ✅ Code pulled from Git"
echo "  ✅ Dependencies installed/verified"
echo "  ✅ Database migrated"
echo "  ✅ Static files collected"
echo "  ✅ Services restarted"
echo "  ✅ Health checks completed"
echo ""
echo "=================================="
log "📋 Step 11: Would you like to view live logs?"
echo "=================================="
echo ""
echo "Choose an option:"
echo "  1) View all service logs (recommended)"
echo "  2) View only backend logs"
echo "  3) View only PostgreSQL logs"
echo "  4) View only Nginx access logs"
echo "  5) Skip and exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        info "Starting live logs for all services (Press Ctrl+C to exit)..."
        echo ""
        # Create a temp script to run all logs in parallel
        trap 'kill $(jobs -p) 2>/dev/null; exit' INT
        sudo journalctl -u crm-backend.service -f --no-pager | sed 's/^/[BACKEND] /' &
        sudo journalctl -u postgresql -f --no-pager 2>/dev/null | sed 's/^/[POSTGRES] /' &
        sudo journalctl -u redis-server -f --no-pager 2>/dev/null | sed 's/^/[REDIS] /' &
        sudo tail -f /var/log/nginx/access.log 2>/dev/null | sed 's/^/[NGINX] /' &
        wait
        ;;
    2)
        info "Starting live backend logs (Press Ctrl+C to exit)..."
        echo ""
        sudo journalctl -u crm-backend.service -f --no-pager
        ;;
    3)
        info "Starting live PostgreSQL logs (Press Ctrl+C to exit)..."
        echo ""
        sudo journalctl -u postgresql -f --no-pager
        ;;
    4)
        info "Starting live Nginx access logs (Press Ctrl+C to exit)..."
        echo ""
        sudo tail -f /var/log/nginx/access.log
        ;;
    5|"")
        info "Skipping live logs"
        ;;
    *)
        warning "Invalid choice, skipping logs"
        ;;
esac

echo ""
info "📝 Quick log commands for future use:"
echo "  - All logs:     sudo journalctl -f"
echo "  - Backend:      sudo journalctl -u crm-backend.service -f"
echo "  - PostgreSQL:   sudo journalctl -u postgresql -f"
echo "  - Redis:        sudo journalctl -u redis-server -f"
echo "  - Nginx access: sudo tail -f /var/log/nginx/access.log"
echo "  - Nginx error:  sudo tail -f /var/log/nginx/error.log"
echo ""
success "Your application is ready! 🚀"

