#!/usr/bin/env python3
"""
Database Connection Test Script for Render PostgreSQL
Run this to test database connectivity before deployment
"""

import os
import sys
import django
from pathlib import Path

# Add the project root to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Set Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Setup Django
django.setup()

from django.db import connection
from django.conf import settings

def test_database_connection():
    """Test database connection and show configuration"""
    print("🔍 Testing Database Connection...")
    print("=" * 50)
    
    # Show current database configuration
    db_config = settings.DATABASES['default']
    print(f"Database Engine: {db_config['ENGINE']}")
    print(f"Database Name: {db_config['NAME']}")
    print(f"Database Host: {db_config['HOST']}")
    print(f"Database Port: {db_config['PORT']}")
    print(f"Database User: {db_config['USER']}")
    print(f"SSL Mode: {db_config['OPTIONS'].get('sslmode', 'Not set')}")
    print(f"Connect Timeout: {db_config['OPTIONS'].get('connect_timeout', 'Not set')}")
    print(f"Keepalives: {db_config['OPTIONS'].get('keepalives', 'Not set')}")
    
    print("\n" + "=" * 50)
    
    try:
        # Test connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print("✅ Database connection successful!")
            print(f"PostgreSQL Version: {version[0]}")
            
            # Test basic query
            cursor.execute("SELECT current_database(), current_user, inet_server_addr();")
            db_info = cursor.fetchone()
            print(f"Current Database: {db_info[0]}")
            print(f"Current User: {db_info[1]}")
            print(f"Server Address: {db_info[2]}")
            
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print(f"Error Type: {type(e).__name__}")
        
        # Show more detailed error information
        if hasattr(e, '__cause__') and e.__cause__:
            print(f"Caused by: {e.__cause__}")
        
        return False
    
    return True

def test_migrations_table():
    """Test if migrations table exists and is accessible"""
    print("\n🔍 Testing Migrations Table...")
    print("=" * 50)
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'django_migrations'
            """)
            
            if cursor.fetchone():
                print("✅ Migrations table exists")
                
                # Count migrations
                cursor.execute("SELECT COUNT(*) FROM django_migrations")
                count = cursor.fetchone()[0]
                print(f"Total migrations: {count}")
                
            else:
                print("⚠️  Migrations table does not exist")
                
    except Exception as e:
        print(f"❌ Error checking migrations table: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 Jewellery CRM Database Connection Test")
    print("=" * 50)
    
    # Test basic connection
    if test_database_connection():
        # Test migrations table
        test_migrations_table()
        
        print("\n" + "=" * 50)
        print("🎉 All tests completed!")
    else:
        print("\n" + "=" * 50)
        print("💥 Tests failed. Check your database configuration.")
        sys.exit(1)
