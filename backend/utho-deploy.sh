#!/bin/bash
# Utho Cloud VM Deployment Script for Jewellery CRM Backend
set -e

echo "🚀 Starting Utho Cloud VM deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

log "Checking environment..."
if ! command -v python3.11 &> /dev/null; then error "Python 3.11 not found"; exit 1; fi

# Check for PostgreSQL
if ! command -v psql &> /dev/null; then warning "PostgreSQL client not found. Install it with: sudo apt-get install postgresql-client"; fi

# Check for Redis (optional)
if ! command -v redis-cli &> /dev/null; then warning "Redis client not found. Install it with: sudo apt-get install redis-tools"; fi

success "Environment checks passed"

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
echo ""
log "📋 Next steps to complete deployment:"
echo ""
echo "1. Update .env file with your actual values:"
echo "   - Replace YOUR_SERVER_IP with your Utho VM IP"
echo "   - Update SECRET_KEY with a strong random key"
echo "   - Configure database credentials if different"
echo ""
echo "2. Install and configure PostgreSQL:"
echo "   sudo apt-get update"
echo "   sudo apt-get install postgresql postgresql-contrib"
echo "   sudo -u postgres createuser --interactive --pwprompt crm_user"
echo "   sudo -u postgres createdb jewellery_crm"
echo ""
echo "3. Install and configure Redis (optional):"
echo "   sudo apt-get install redis-server"
echo "   sudo systemctl enable redis-server"
echo "   sudo systemctl start redis-server"
echo ""
echo "4. Copy systemd service file:"
echo "   sudo cp crm-backend.service /etc/systemd/system/"
echo "   sudo systemctl daemon-reload"
echo "   sudo systemctl enable crm-backend.service"
echo "   sudo systemctl start crm-backend.service"
echo ""
echo "5. Install and configure Nginx:"
echo "   sudo apt-get install nginx"
echo "   sudo cp nginx_crm.conf /etc/nginx/sites-available/crm-backend"
echo "   sudo ln -s /etc/nginx/sites-available/crm-backend /etc/nginx/sites-enabled/"
echo "   sudo nginx -t"
echo "   sudo systemctl restart nginx"
echo ""
echo "6. Test the deployment:"
echo "   curl http://localhost:8000/api/health/"
echo "   curl http://YOUR_SERVER_IP/api/health/"
echo ""
echo "7. Check logs if needed:"
echo "   sudo journalctl -u crm-backend.service -f"
echo "   tail -f /var/www/CRM_FINAL/backend/logs/error.log"
echo ""


