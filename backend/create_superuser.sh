#!/usr/bin/env bash
# Production Django superuser creation script
# This script creates a superuser for production deployment

set -e

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

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log "Starting Django superuser creation..."

# Check if we're in the correct directory
if [ ! -f "manage.py" ]; then
    error "manage.py not found. Please run this script from the Django project root."
    exit 1
fi

# Set production environment variables
export DJANGO_SETTINGS_MODULE=core.settings

# Production superuser credentials
PROD_USERNAME="admin"
PROD_EMAIL="admin@jewellerycrm.com"
PROD_PASSWORD="JewelleryCRM2024!"

log "Creating production superuser..."

# Create superuser using Django management command
python manage.py shell << EOF
from django.contrib.auth import get_user_model
import os

User = get_user_model()

# Check if superuser already exists
if User.objects.filter(username='$PROD_USERNAME').exists():
    print("Superuser '$PROD_USERNAME' already exists.")
else:
    # Create superuser
    User.objects.create_superuser(
        username='$PROD_USERNAME',
        email='$PROD_EMAIL',
        password='$PROD_PASSWORD'
    )
    print("Superuser '$PROD_USERNAME' created successfully!")
    
    # Also create a business admin user
    if not User.objects.filter(username='business_admin').exists():
        User.objects.create_user(
            username='business_admin',
            email='business@jewellerycrm.com',
            password='BusinessAdmin2024!',
            is_staff=True,
            is_active=True
        )
        print("Business admin user created successfully!")
    
    # Create a manager user
    if not User.objects.filter(username='manager').exists():
        User.objects.create_user(
            username='manager',
            email='manager@jewellerycrm.com',
            password='Manager2024!',
            is_staff=True,
            is_active=True
        )
        print("Manager user created successfully!")
    
    # Create a sales user
    if not User.objects.filter(username='sales').exists():
        User.objects.create_user(
            username='sales',
            email='sales@jewellerycrm.com',
            password='Sales2024!',
            is_staff=True,
            is_active=True
        )
        print("Sales user created successfully!")
    
    # Create a telecaller user
    if not User.objects.filter(username='telecaller').exists():
        User.objects.create_user(
            username='telecaller',
            email='telecaller@jewellerycrm.com',
            password='Telecaller2024!',
            is_staff=True,
            is_active=True
        )
        print("Telecaller user created successfully!")

EOF

if [ $? -eq 0 ]; then
    success "Django superuser creation completed!"
    log "Production users created:"
    echo "  - Admin: $PROD_USERNAME / $PROD_PASSWORD"
    echo "  - Business Admin: business_admin / BusinessAdmin2024!"
    echo "  - Manager: manager / Manager2024!"
    echo "  - Sales: sales / Sales2024!"
    echo "  - Telecaller: telecaller / Telecaller2024!"
else
    error "Failed to create superuser"
    exit 1
fi

log "Django superuser creation script completed successfully!"
