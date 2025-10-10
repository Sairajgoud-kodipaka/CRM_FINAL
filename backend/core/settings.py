"""
Django settings for Jewelry CRM project.
"""

import os
from pathlib import Path
from decouple import config, Csv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Get the port from environment (Fly.io requirement)
PORT = config('PORT', default=8000, cast=int)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='jewelry-crm-2024-production-secure-key-8f7e6d5c4b3a2918-7f6e5d4c3b2a1909-8f7e6d5c4b3a2918-7f6e5d4c3b2a1909')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)  # Changed to True for development

ALLOWED_HOSTS = [host.strip() for host in config('ALLOWED_HOSTS', default='localhost,127.0.0.1,testserver').split(',') if host.strip()]

# Google Sheets Configuration
GOOGLE_SHEETS_ID = config('GOOGLE_SHEETS_ID', default='16pJPUtjKmCTEntCwP4lzJf849pLiN38y4pmFHjQkefk')

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
    # 'whitenoise.middleware.WhiteNoiseMiddleware',  # Commented out for development
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.users.middleware.ScopedVisibilityMiddleware',
]

# Debug toolbar configuration for development
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']

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

# Database Configuration - PostgreSQL for all environments
import sys

# Use PostgreSQL for all environments
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='jewellery_crm'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD', default='postgresql'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
        'OPTIONS': {
            'connect_timeout': 30,
        },
    }
}

# Production configuration for Fly.io managed database
if not DEBUG:
    # Fly.io automatically provides DATABASE_URL environment variable
    import dj_database_url
    DATABASES['default'] = dj_database_url.parse(
        config('DATABASE_URL', default='sqlite:///db.sqlite3'),
        conn_max_age=600,
        conn_health_checks=True,
    )
    
    # Additional Fly.io optimizations
    DATABASES['default']['OPTIONS'].update({
        'application_name': 'jewellery_crm_backend',
        'keepalives': 1,
        'keepalives_idle': 30,
        'keepalives_interval': 10,
        'keepalives_count': 5,
        'connect_timeout': 60,
    })

# During collectstatic, use a dummy database config
if 'collectstatic' in sys.argv:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
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

# Whitenoise configuration for static files (commented out for development)
# STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

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
        # 'rest_framework.permissions.IsAuthenticated',  # Temporarily disabled for testing
        'rest_framework.permissions.AllowAny',
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
CORS_ALLOWED_ORIGINS = [origin.strip().rstrip('/') for origin in config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://jewel-crm.vercel.app,https://crm-final-mfe4.onrender.com').split(',') if origin.strip()]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = config('CORS_ALLOW_ALL_ORIGINS', default=False, cast=bool)  # Secure by default

# WhatsApp Integration (WAHA)
WAHA_BASE_URL = config('WAHA_BASE_URL', default='http://localhost:3001')
WAHA_SESSION = config('WAHA_SESSION', default='jewelry_crm')
WAHA_API_KEY = config('WAHA_API_KEY', default=None)
SITE_URL = config('SITE_URL', default='http://localhost:8000')
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
CSRF_TRUSTED_ORIGINS = [origin.strip().rstrip('/') for origin in config('CSRF_TRUSTED_ORIGINS', default='http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://jewel-crm.vercel.app,https://crm-final-mfe4.onrender.com').split(',') if origin.strip()]

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

# Production Security Settings (commented out for development)
# if not DEBUG:
#     # Security Headers
#     SECURE_BROWSER_XSS_FILTER = True
#     SECURE_CONTENT_TYPE_NOSNIFF = True
#     X_FRAME_OPTIONS = 'DENY'
#     
#     # HTTPS Settings - Render handles SSL automatically
#     SECURE_SSL_REDIRECT = False  # Render handles HTTPS redirects
#     SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')  # Trust proxy headers
#     SECURE_HSTS_SECONDS = 31536000  # 1 year
#     SECURE_HSTS_INCLUDE_SUBDOMAINS = True
#     SECURE_HSTS_PRELOAD = True
#     
#     # Cookie Security
#     SESSION_COOKIE_SECURE = True
#     CSRF_COOKIE_SECURE = True
#     
#     # Additional Security
#     SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Internal IPs for development (if needed)
INTERNAL_IPS = [
    '127.0.0.1',
]

# Logging Configuration - Development Mode (Reduced Verbosity)
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
            'level': 'INFO',  # Reduced from DEBUG to INFO
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',  # Reduced from DEBUG to INFO
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',  # Reduced from DEBUG to INFO
            'propagate': False,
        },
        'django.utils.autoreload': {
            'handlers': ['console'],
            'level': 'WARNING',  # Suppress autoreload debug messages
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'WARNING',  # Suppress database debug messages
            'propagate': False,
        },
    },
}

# Production Logging Configuration (commented out for development)
# LOGGING = {
#     'version': 1,
#     'disable_existing_loggers': False,
#     'formatters': {
#         'verbose': {
#             'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
#             'style': '{',
#         },
#         'simple': {
#             'format': '{levelname} {message}',
#             'style': '{',
#         },
#     },
#     'handlers': {
#         'file': {
#             'level': 'INFO',
#             'class': 'logging.FileHandler',
#             'filename': BASE_DIR / 'logs' / 'django.log',
#             'formatter': 'verbose',
#         },
#         'console': {
#             'level': 'INFO',
#             'class': 'logging.StreamHandler',
#             'formatter': 'simple',
#         },
#     },
#     'root': {
#         'handlers': ['console', 'file'],
#         'level': 'INFO',
#     },
#     'loggers': {
#         'django': {
#             'handlers': ['console', 'file'],
#             'level': 'INFO',
#             'propagate': False,
#         },
#     },
# }
# 
# # Create logs directory if it doesn't exist
# os.makedirs(BASE_DIR / 'logs', exist_ok=True)

# Channels Configuration
ASGI_APPLICATION = 'core.asgi.application'

# Redis Configuration for Channels
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
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
