#!/usr/bin/env python3
"""
Toggle Script for Jewelry CRM
Switches between Production and Development modes
"""

import os
import sys
import json
import shutil
from pathlib import Path

class CRMEnvironmentToggle:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.backend_dir = self.project_root / "backend"
        self.frontend_dir = self.project_root / "jewellery-crm"
        
        # Configuration files
        self.backend_settings = self.backend_dir / "core" / "settings.py"
        self.backend_settings_dev = self.backend_dir / "core" / "settings_dev.py"
        self.frontend_env = self.frontend_dir / ".env.local"
        self.frontend_env_prod = self.frontend_dir / ".env.production"
        self.frontend_env_dev = self.frontend_dir / ".env.development"
        
        # Current mode file
        self.mode_file = self.project_root / ".current_mode"
    
    def get_current_mode(self):
        """Get current environment mode"""
        if self.mode_file.exists():
            return self.mode_file.read_text().strip()
        return "production"  # Default to production
    
    def set_mode(self, mode):
        """Set current environment mode"""
        self.mode_file.write_text(mode)
        print(f"✅ Mode set to: {mode}")
    
    def switch_to_development(self):
        """Switch to development mode"""
        print("🔄 Switching to Development Mode...")
        
        # 1. Create development settings for backend
        self.create_backend_dev_settings()
        
        # 2. Create development environment for frontend
        self.create_frontend_dev_env()
        
        # 3. Set mode
        self.set_mode("development")
        
        print("🎉 Development mode activated!")
        print("📋 Development URLs:")
        print("   Frontend: http://localhost:3000")
        print("   Backend: http://localhost:8000")
        print("   Database: SQLite (db.sqlite3)")
        print("\n🚀 To start development:")
        print("   Backend: cd backend && python manage.py runserver --settings=core.settings_dev")
        print("   Frontend: cd jewellery-crm && npm run dev")
    
    def switch_to_production(self):
        """Switch to production mode"""
        print("🔄 Switching to Production Mode...")
        
        # 1. Create production environment for frontend
        self.create_frontend_prod_env()
        
        # 2. Set mode
        self.set_mode("production")
        
        print("🎉 Production mode activated!")
        print("📋 Production URLs:")
        print("   Frontend: https://jewel-crm.vercel.app/")
        print("   Backend: https://crm-final-tj4n.onrender.com/")
        print("   Database: PostgreSQL (Render)")
    
    def create_backend_dev_settings(self):
        """Create development settings for backend"""
        dev_settings_content = '''"""
Development settings for Jewelry CRM project.
"""

import os
from pathlib import Path
from .settings import *

# Override settings for development
DEBUG = True
SECRET_KEY = 'jewelry-crm-local-development-key-2024'

# Local development hosts
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# Database Configuration - SQLite for development (no SSL issues)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# CORS Settings for development
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
]
CORS_ALLOW_ALL_ORIGINS = False

# CSRF Settings for development
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
]

# Email Configuration for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Site URL for development
SITE_URL = 'http://localhost:8000'

# Disable SSL requirements for development
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Disable WhiteNoise for development
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# Logging configuration for development
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Enable debug toolbar for development
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
    INTERNAL_IPS = ['127.0.0.1', 'localhost']
'''
        
        self.backend_settings_dev.write_text(dev_settings_content)
        print("✅ Created backend development settings")
    
    def create_frontend_dev_env(self):
        """Create development environment for frontend"""
        dev_env_content = '''# Development Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
'''
        
        self.frontend_env.write_text(dev_env_content)
        print("✅ Created frontend development environment")
    
    def create_frontend_prod_env(self):
        """Create production environment for frontend"""
        prod_env_content = '''# Production Environment Variables
NEXT_PUBLIC_API_URL=https://crm-final-tj4n.onrender.com
NODE_ENV=production
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=false
'''
        
        self.frontend_env.write_text(prod_env_content)
        print("✅ Created frontend production environment")
    
    def show_status(self):
        """Show current status"""
        current_mode = self.get_current_mode()
        print(f"📊 Current Mode: {current_mode.upper()}")
        
        if current_mode == "development":
            print("🌐 Development URLs:")
            print("   Frontend: http://localhost:3000")
            print("   Backend: http://localhost:8000")
            print("   Database: SQLite")
        else:
            print("🌐 Production URLs:")
            print("   Frontend: https://jewel-crm.vercel.app/")
            print("   Backend: https://crm-final-tj4n.onrender.com/")
            print("   Database: PostgreSQL (Render)")
    
    def setup_development(self):
        """Complete development setup"""
        print("🚀 Setting up Development Environment...")
        
        # Switch to development mode
        self.switch_to_development()
        
        # Run backend migrations
        print("\n🗄️ Setting up database...")
        os.chdir(self.backend_dir)
        os.system("python manage.py migrate --settings=core.settings_dev")
        
        # Create superuser if needed
        print("\n👤 Creating superuser...")
        os.system('''python manage.py shell --settings=core.settings_dev << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created: username=admin, password=admin123')
else:
    print('Superuser already exists')
EOF''')
        
        print("\n🎉 Development setup complete!")
        print("🔑 Login: username=admin, password=admin123")

def main():
    toggle = CRMEnvironmentToggle()
    
    if len(sys.argv) < 2:
        print("🔧 Jewelry CRM Environment Toggle")
        print("=================================")
        print("Usage:")
        print("  python toggle.py dev     - Switch to development mode")
        print("  python toggle.py prod    - Switch to production mode")
        print("  python toggle.py status  - Show current status")
        print("  python toggle.py setup   - Complete development setup")
        print()
        toggle.show_status()
        return
    
    command = sys.argv[1].lower()
    
    if command == "dev":
        toggle.switch_to_development()
    elif command == "prod":
        toggle.switch_to_production()
    elif command == "status":
        toggle.show_status()
    elif command == "setup":
        toggle.setup_development()
    else:
        print(f"❌ Unknown command: {command}")
        print("Available commands: dev, prod, status, setup")

if __name__ == "__main__":
    main()
