"""
Django settings for Jewelry CRM project.
"""

import os
from pathlib import Path
from decouple import config, Csv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Get the port from environment (Render requirement)
PORT = config('PORT', default=8000, cast=int)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='jewelry-crm-2024-production-secure-key-8f7e6d5c4b3a2918-7f6e5d4c3b2a1909-8f7e6d5c4b3a2918-7f6e5d4c3b2a1909')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=False, cast=bool)

# Production ALLOWED_HOSTS configuration
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,testserver,0.0.0.0,crm-final-tj4n.onrender.com', cast=Csv())

# Google Sheets Configuration
GOOGLE_SHEETS_ID = config('GOOGLE_SHEETS_ID', default='1W9JFanGBpl5DpFDcGELl3iLCvGnj35rWK0VLxvTS5t0')

# Multiple Google Sheets Support
GOOGLE_SHEETS_IDS = config('GOOGLE_SHEETS_IDS', default='16pJPUtjKmCTEntCwP4lzJf849pLiN38y4pmFHjQkefk', cast=Csv())

# VAPID Keys for Web Push Notifications
# Generate keys using: python generate_vapid_keys.py
# IMPORTANT: Set these in environment variables (.env file) - DO NOT commit keys to git
# For development, you can use defaults, but for production, always use environment variables
VAPID_PRIVATE_KEY = config('VAPID_PRIVATE_KEY', default='')
VAPID_PUBLIC_KEY = config('VAPID_PUBLIC_KEY', default='')
VAPID_CLAIMS_EMAIL = config('VAPID_CLAIMS_EMAIL', default='mailto:admin@jewellerycrm.com')

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
    'channels',
    # 'drf_spectacular',  # Temporarily disabled for deployment
    
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
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Enable for production static files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.users.middleware.ScopedVisibilityMiddleware',
    'apps.core.middleware.GlobalDateFilterMiddleware',  # Global date filtering
]

# Debug toolbar configuration for development
# Temporarily disabled due to duplicate entry issue
# if DEBUG:
#     INSTALLED_APPS += ['debug_toolbar']
#     MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']

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

# Database Configuration - Use PostgreSQL for Utho Cloud
import sys

# Primary database configuration - PostgreSQL (for Utho Cloud deployment)
DATABASES = {
    'default': {
        'ENGINE': config('DB_ENGINE', default='django.db.backends.postgresql'),
        'NAME': config('DB_NAME', default='jewellery_crm'),
        'USER': config('DB_USER', default='crm_user'),
        'PASSWORD': config('DB_PASSWORD', default='SecurePassword123!'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 600,
        'CONN_HEALTH_CHECKS': True,
    }
}

# Use DATABASE_URL if provided (for compatibility with external services)
if config('DATABASE_URL', default=None):
    # Check if DATABASE_URL is provided (preferred method)
    database_url = config('DATABASE_URL', default=None)
    
    if database_url:
        # Use DATABASE_URL if provided
        import dj_database_url
        DATABASES['default'] = dj_database_url.parse(
            database_url,
            conn_max_age=600,
            conn_health_checks=True,
        )
    else:
        # Fallback to individual database environment variables
        DATABASES['default'] = {
            'ENGINE': config('DB_ENGINE', default='django.db.backends.postgresql'),
            'NAME': config('DB_NAME', default='crm_db'),
            'USER': config('DB_USER', default='crm_user'),
            'PASSWORD': config('DB_PASSWORD', default=''),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
            'CONN_MAX_AGE': 600,
            'CONN_HEALTH_CHECKS': True,
        }
    
    # Additional PostgreSQL optimizations (for Utho Cloud VM)
    if DATABASES['default']['ENGINE'] == 'django.db.backends.postgresql':
        if 'OPTIONS' not in DATABASES['default']:
            DATABASES['default']['OPTIONS'] = {}
        
        DATABASES['default']['OPTIONS'].update({
            'application_name': 'jewellery_crm_backend',
            'connect_timeout': 60,
            'client_encoding': 'utf8',
        })

# During collectstatic, use a minimal PostgreSQL config
if 'collectstatic' in sys.argv:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': 'postgres',
            'USER': config('DB_USER', default='postgres'),
            'PASSWORD': config('DB_PASSWORD', default=''),
            'HOST': 'localhost',
            'PORT': '5432',
        }
    }

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

# Static files (CSS, JavaScript, Images)
STATIC_URL = config('STATIC_URL', default='/static/')
STATIC_ROOT = BASE_DIR / config('STATIC_ROOT', default='staticfiles')
STATICFILES_DIRS = []  # Empty for production - static files will be collected to STATIC_ROOT

# Whitenoise configuration for static files
if not DEBUG:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = config('MEDIA_URL', default='/media/')
MEDIA_ROOT = BASE_DIR / config('MEDIA_ROOT', default='media')

# Data upload limits - Temporarily increased for bulk delete operations
# TODO: Reduce this back to default (1000) after bulk deletion is complete
DATA_UPLOAD_MAX_NUMBER_FIELDS = config('DATA_UPLOAD_MAX_NUMBER_FIELDS', default=10000, cast=int)
DATA_UPLOAD_MAX_MEMORY_SIZE = config('DATA_UPLOAD_MAX_MEMORY_SIZE', default=2621440, cast=int)  # 2.5 MB

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
        'rest_framework.permissions.IsAuthenticated',  # Enable authentication for production
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    # 'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',  # Temporarily disabled for deployment
}

# JWT Settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=config('JWT_ACCESS_TOKEN_LIFETIME', default=1440, cast=int)),  # 24 hours
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

# Feature flags and lightweight auth configs
# Sales PIN quick login is enabled by default for sales users
SALES_PIN_LOGIN_ENABLED = config('SALES_PIN_LOGIN_ENABLED', default=True, cast=bool)
# Default PIN for UAT; override via environment in production
SALES_PIN_CODE = config('SALES_PIN_CODE', default='1234')
# Roles allowed to use PIN login (sales-only)
SALES_PIN_ALLOWED_ROLES = [r.strip() for r in config('SALES_PIN_ALLOWED_ROLES', default='inhouse_sales,sales_team').split(',') if r.strip()]

# CORS Settings
CORS_ALLOWED_ORIGINS = [origin.strip().rstrip('/') for origin in config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://jewel-crm.vercel.app,https://crm-final-mfe4.onrender.com,https://crm-final-tj4n.onrender.com,https://jewellery-crm-frontend.vercel.app').split(',') if origin.strip()]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = config('CORS_ALLOW_ALL_ORIGINS', default=False, cast=bool)  # Secure by default

# WhatsApp Integration (WAHA)
WAHA_BASE_URL = config('WAHA_BASE_URL', default='http://localhost:3001')
WAHA_SESSION = config('WAHA_SESSION', default='jewelry_crm')
WAHA_API_KEY = config('WAHA_API_KEY', default=None)
SITE_URL = config('SITE_URL', default='https://crm-final-tj4n.onrender.com')
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'content-length',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'cache-control',
    'pragma',
]

# Additional CORS settings for file uploads
CORS_EXPOSE_HEADERS = [
    'content-type',
    'content-length',
    'content-disposition',
]

# CSRF Settings
CSRF_TRUSTED_ORIGINS = [origin.strip().rstrip('/') for origin in config('CSRF_TRUSTED_ORIGINS', default='http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://jewel-crm.vercel.app,https://crm-final-mfe4.onrender.com,https://crm-final-tj4n.onrender.com,https://jewellery-crm-frontend.vercel.app').split(',') if origin.strip()]

# Cross-site cookie configuration for frontend on a different domain (e.g., Vercel)
# Defaults are production-safe; can be overridden via environment if needed
SESSION_COOKIE_SAMESITE = config('SESSION_COOKIE_SAMESITE', default='None')
CSRF_COOKIE_SAMESITE = config('CSRF_COOKIE_SAMESITE', default='None')
SESSION_COOKIE_SECURE = config('SESSION_COOKIE_SECURE', default=True, cast=bool)
CSRF_COOKIE_SECURE = config('CSRF_COOKIE_SECURE', default=True, cast=bool)

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

# API Documentation - Temporarily disabled for deployment
# SPECTACULAR_SETTINGS = {
#     'TITLE': 'Jewelry CRM API',
#     'DESCRIPTION': 'A comprehensive CRM system for jewelry businesses',
#     'VERSION': '1.0.0',
#     'SERVE_INCLUDE_SCHEMA': False,  # Disabled for deployment
#     'COMPONENT_SPLIT_REQUEST': True,
#     'SCHEMA_PATH_PREFIX': '/api/',
#     'SWAGGER_UI_SETTINGS': {
#         'deepLinking': True,
#     },
#     # Disable schema generation to avoid field name conflicts
#     'GENERATE_SCHEMA': False,
#     'SCHEMA_GENERATOR_CLASS': None,
# }

# Production Security Settings
if not DEBUG:
    # Security Headers
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    
    # HTTPS Settings - Render handles SSL automatically
    SECURE_SSL_REDIRECT = False  # Render handles HTTPS redirects
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')  # Trust proxy headers
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # Cookie Security
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # Additional Security
    SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Internal IPs for development (if needed)
INTERNAL_IPS = [
    '127.0.0.1',
]

# Logging Configuration - Production Mode
if DEBUG:
    # Development logging
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
                'level': 'INFO',
                'class': 'logging.StreamHandler',
                'formatter': 'simple',
            },
        },
        'root': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'loggers': {
            'django': {
                'handlers': ['console'],
                'level': 'INFO',
                'propagate': False,
            },
            'django.utils.autoreload': {
                'handlers': ['console'],
                'level': 'WARNING',
                'propagate': False,
            },
            'django.db.backends': {
                'handlers': ['console'],
                'level': 'WARNING',
                'propagate': False,
            },
        },
    }
else:
    # Production logging
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
                'level': 'WARNING',  # Only warnings and errors in production
                'class': 'logging.StreamHandler',
                'formatter': 'simple',
            },
        },
        'root': {
            'handlers': ['console'],
            'level': 'WARNING',
        },
        'loggers': {
            'django': {
                'handlers': ['console'],
                'level': 'WARNING',
                'propagate': False,
            },
            'django.utils.autoreload': {
                'handlers': ['console'],
                'level': 'ERROR',
                'propagate': False,
            },
            'django.db.backends': {
                'handlers': ['console'],
                'level': 'ERROR',
                'propagate': False,
            },
        },
    }


# Channels Configuration
ASGI_APPLICATION = 'core.asgi.application'

# Redis Configuration for Channels
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [(
                config('REDIS_HOST', default='127.0.0.1'),
                config('REDIS_PORT', default=6379, cast=int)
            )],
        },
    },
}

# Exotel Configuration
EXOTEL_CONFIG = {
    'account_sid': config('EXOTEL_ACCOUNT_SID', default=''),
    'api_key': config('EXOTEL_API_KEY', default=''),
    'api_token': config('EXOTEL_API_TOKEN', default=''),
    'agent_number': config('EXOTEL_AGENT_NUMBER', default=''),
    'caller_id': config('EXOTEL_CALLER_ID', default=''),
    'subdomain': config('EXOTEL_SUBDOMAIN', default='api.exotel.com'),  # api.exotel.com for Singapore or api.in.exotel.com for Mumbai
    'webhook_url': config('EXOTEL_WEBHOOK_URL', default=''),
    'webhook_secret': config('EXOTEL_WEBHOOK_SECRET', default=''),
    'record_calls': config('EXOTEL_RECORD_CALLS', default=True, cast=bool),
    
    # WebRTC Configuration for direct browser-to-phone calling
    'webrtc_client_id': config('EXOTEL_WEBRTC_CLIENT_ID', default=''),
    'webrtc_client_secret': config('EXOTEL_WEBRTC_CLIENT_SECRET', default=''),
    'webrtc_customer_id': config('EXOTEL_WEBRTC_CUSTOMER_ID', default=''),
    'webrtc_app_id': config('EXOTEL_WEBRTC_APP_ID', default=''),
    'webrtc_user_id': config('EXOTEL_WEBRTC_USER_ID', default=''),
    'webrtc_sip_username': config('EXOTEL_WEBRTC_SIP_USERNAME', default=''),
    'webrtc_sip_password': config('EXOTEL_WEBRTC_SIP_PASSWORD', default=''),
    'webrtc_enabled': config('EXOTEL_WEBRTC_ENABLED', default=False, cast=bool),
}
