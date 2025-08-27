#!/usr/bin/env python3
"""
Emergency Deployment Script for Render
This script creates a working configuration when SSL issues persist
"""

import os
import sys
from pathlib import Path

def create_emergency_settings():
    """Create emergency settings that should work with Render"""
    print("🚨 Creating Emergency Deployment Configuration...")
    
    emergency_settings = '''
# Emergency Django Settings for Render Deployment
# This configuration prioritizes connection over SSL security

import os
from pathlib import Path
from decouple import config

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Get the port from environment (Render requirement)
PORT = config('PORT', default=8000, cast=int)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='jewelry-crm-secure-key-2024-8f7e6d5c4b3a2918-7f6e5d4c3b2a1909-6e5d4c3b2a1908f7-5d4c3b2a1908f6e5')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    
    # Local apps
    'apps.tenants',
    'apps.users',
    'apps.clients',
    'apps.stores',
    'apps.sales',
    'apps.products',
    'apps.integrations',
    'apps.analytics',
    'apps.automation',
    'apps.tasks',
    'apps.escalation',
    'apps.feedback',
    'apps.announcements',
    'apps.marketing',
    'apps.support',
    'apps.notifications',
    'apps.exhibition',
    'telecalling',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.users.middleware.ScopedVisibilityMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# EMERGENCY DATABASE CONFIGURATION - Multiple SSL modes to try
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='crm_db'),
        'USER': config('DB_USER', default='crm_user'),
        'PASSWORD': config('DB_PASSWORD', default='crm_password123'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
        'OPTIONS': {
            'connect_timeout': 60,  # Extended timeout
            'sslmode': 'prefer',    # Try SSL, fallback to non-SSL
            'keepalives': 1,        # Enable keepalive
            'keepalives_idle': 30,  # Send keepalive after 30 seconds
            'keepalives_interval': 10,  # Send keepalive every 10 seconds
            'keepalives_count': 5,  # Allow 5 failed keepalives
        },
        'CONN_MAX_AGE': 300,  # Keep connections alive for 5 minutes
    }
}

# EMERGENCY: If SSL fails, try without SSL
if not DEBUG:
    try:
        # Test connection with current settings
        from django.db import connection
        connection.ensure_connection()
        print("✅ SSL connection successful")
    except Exception as e:
        if 'SSL' in str(e):
            print(f"⚠️  SSL connection failed: {e}")
            print("🔄 Trying without SSL...")
            
            # Fallback to no SSL
            DATABASES['default']['OPTIONS']['sslmode'] = 'disable'
            DATABASES['default']['OPTIONS']['connect_timeout'] = 30
            
            try:
                connection.ensure_connection()
                print("✅ Non-SSL connection successful")
            except Exception as e2:
                print(f"❌ Non-SSL connection also failed: {e2}")
                print("🚨 Database connection failed completely")

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = config('STATIC_URL', default='/static/')
STATIC_ROOT = BASE_DIR / config('STATIC_ROOT', default='staticfiles')
STATICFILES_DIRS = []

# Media files
MEDIA_URL = config('MEDIA_URL', default='/media/')
MEDIA_ROOT = BASE_DIR / config('MEDIA_ROOT', default='media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# JWT Settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=config('JWT_ACCESS_TOKEN_LIFETIME', default=60, cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(minutes=config('JWT_REFRESH_TOKEN_LIFETIME', default=1440, cast=int)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': config('JWT_SECRET_KEY', default=SECRET_KEY),
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# CORS Settings
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://crm-final-five.vercel.app,https://crm-final-mfe4.onrender.com').split(',')
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGIGINS = config('CORS_ALLOW_ALL_ORIGINS', default=False, cast=bool)

# WhatsApp Integration
WAHA_BASE_URL = config('WAHA_BASE_URL', default='http://localhost:3001')
WAHA_SESSION = config('WAHA_SESSION', default='jewelry_crm')

# Email Configuration
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')

# Celery Configuration
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Production Security Settings (minimal for emergency deployment)
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    
    # Disable HTTPS redirect for emergency deployment
    # SECURE_SSL_REDIRECT = False
    
    # Basic cookie security
    SESSION_COOKIE_SECURE = False  # Allow HTTP for emergency
    CSRF_COOKIE_SECURE = False     # Allow HTTP for emergency

# Internal IPs
INTERNAL_IPS = ['127.0.0.1']

# Logging Configuration
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
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
os.makedirs(BASE_DIR / 'logs', exist_ok=True)
'''
    
    # Write emergency settings
    emergency_file = BASE_DIR / 'core' / 'emergency_settings.py'
    with open(emergency_file, 'w') as f:
        f.write(emergency_settings)
    
    print(f"✅ Emergency settings created: {emergency_file}")
    return emergency_file

def update_render_yaml():
    """Update render.yaml with emergency configuration"""
    print("\n🔧 Updating render.yaml for emergency deployment...")
    
    emergency_render = '''
services:
  - type: web
    name: jewellery-crm-backend
    env: python
    plan: starter
    buildCommand: ./build.sh
    startCommand: gunicorn core.emergency_settings:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: PORT
        value: 8000
      - key: DEBUG
        value: false
      - key: SECRET_KEY
        value: f3Csh9SZNGRp84-xLGvEEYPhWqTt2_q6-5lXuXjiR5Y
      - key: ALLOWED_HOSTS
        value: crm-final-mfe4.onrender.com
      - key: CORS_ALLOWED_ORIGINS
        value: http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://crm-final-five.vercel.app,https://crm-final-mfe4.onrender.com
      - key: CORS_ALLOW_ALL_ORIGINS
        value: false
      - key: CSRF_TRUSTED_ORIGINS
        value: http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://crm-final-five.vercel.app,https://crm-final-mfe4.onrender.com
      - key: DB_ENGINE
        value: django.db.backends.postgresql
      - key: DB_NAME
        value: jewellery_crm_db_6lhq
      - key: DB_USER
        value: jewellery_crm_db_6lhq_user
      - key: DB_PASSWORD
        value: 00tT3WerKiPOn89oEfpzytXdcqRHnCJa
      - key: DB_HOST
        value: dpg-d27ekt0gjchc7384-a.oregon-postgres.render.com
      - key: DB_PORT
        value: 5432
      - key: JWT_SECRET_KEY
        value: 25CBSetI1cCv7Zfy0Wfl9bd6YB/Ws7l/dZnRVFWBVzg=
      - key: JWT_ACCESS_TOKEN_LIFETIME
        value: 60
      - key: JWT_REFRESH_TOKEN_LIFETIME
        value: 1440
      - key: STATIC_URL
        value: /static/
      - key: MEDIA_URL
        value: /media/
      - key: STATIC_ROOT
        value: staticfiles
      - key: MEDIA_ROOT
        value: media
    healthCheckPath: /api/health/
    autoDeploy: true

databases:
  - name: jewellery-crm-db
    databaseName: jewellery_crm_db_6lhq
    user: jewellery_crm_db_6lhq_user
    plan: starter
'''
    
    # Write emergency render.yaml
    emergency_render_file = BASE_DIR / 'emergency_render.yaml'
    with open(emergency_render_file, 'w') as f:
        f.write(emergency_render)
    
    print(f"✅ Emergency render.yaml created: {emergency_render_file}")
    return emergency_render_file

def main():
    """Main emergency deployment function"""
    print("🚨 Emergency Deployment Configuration Generator")
    print("=" * 60)
    
    # Get base directory
    BASE_DIR = Path(__file__).resolve().parent
    
    print("This script creates emergency configurations when SSL issues persist.")
    print("These configurations prioritize connection over security for deployment.")
    
    # Create emergency settings
    emergency_settings = create_emergency_settings()
    
    # Create emergency render.yaml
    emergency_render = update_render_yaml()
    
    print("\n🎯 Emergency Configuration Created!")
    print("=" * 50)
    print("Files created:")
    print(f"1. {emergency_settings}")
    print(f"2. {emergency_render}")
    
    print("\n📋 Next Steps:")
    print("1. Commit these emergency files:")
    print("   git add .")
    print("   git commit -m 'Emergency deployment configuration'")
    print("   git push origin main")
    
    print("\n2. Use emergency_render.yaml for deployment:")
    print("   - Rename it to render.yaml")
    print("   - Or update your existing render.yaml")
    
    print("\n3. Deploy to Render:")
    print("   - Manual deploy with latest commit")
    
    print("\n⚠️  IMPORTANT:")
    print("- These settings disable some security features")
    print("- Use only for emergency deployment")
    print("- Revert to secure settings once connection is stable")
    
    print("\n🚀 Ready for emergency deployment!")

if __name__ == "__main__":
    main()
