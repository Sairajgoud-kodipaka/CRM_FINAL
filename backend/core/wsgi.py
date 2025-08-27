"""
WSGI config for core project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os
import sys
from django.core.wsgi import get_wsgi_application

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Run migrations automatically at startup
try:
    application = get_wsgi_application()
    
    # Import Django after WSGI application is created
    from django.core.management import execute_from_command_line
    from django.db import connection
    
    # Check if we can connect to database
    if connection.connection is None:
        connection.ensure_connection()
    
    # Run migrations automatically
    execute_from_command_line(['manage.py', 'migrate', '--verbosity=0'])
    print("✅ Database migrations completed successfully")
    
except Exception as e:
    print(f"⚠️ Migration warning: {e}")
    # Continue even if migrations fail
    pass
