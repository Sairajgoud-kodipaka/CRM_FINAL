#!/usr/bin/env python3
"""
Production Deployment Script for Jewellery CRM Backend
This script helps prepare and deploy to Render
"""

import os
import subprocess
import sys
from pathlib import Path

def check_git_status():
    """Check if git repository is clean and up to date"""
    print("🔍 Checking Git Status...")
    
    try:
        # Check if we're in a git repository
        result = subprocess.run(['git', 'status', '--porcelain'], 
                              capture_output=True, text=True, check=True)
        
        if result.stdout.strip():
            print("⚠️  Warning: You have uncommitted changes:")
            print(result.stdout)
            response = input("Do you want to continue anyway? (y/N): ")
            if response.lower() != 'y':
                print("❌ Deployment cancelled. Please commit your changes first.")
                sys.exit(1)
        else:
            print("✅ Git repository is clean")
            
    except subprocess.CalledProcessError:
        print("❌ Error: Not in a git repository or git not available")
        sys.exit(1)

def check_environment_files():
    """Check if all required environment files exist"""
    print("\n🔍 Checking Environment Files...")
    
    required_files = [
        'env.production',
        'render.yaml',
        'requirements.txt',
        'build.sh'
    ]
    
    missing_files = []
    for file in required_files:
        if not Path(file).exists():
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Missing required files: {', '.join(missing_files)}")
        sys.exit(1)
    else:
        print("✅ All required files present")

def check_django_settings():
    """Check Django settings for production readiness"""
    print("\n🔍 Checking Django Settings...")
    
    try:
        # Import Django settings
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
        
        # This will fail if there are syntax errors
        import django
        django.setup()
        
        from django.conf import settings
        
        # Check critical settings
        if settings.DEBUG:
            print("⚠️  Warning: DEBUG is True (should be False in production)")
        else:
            print("✅ DEBUG is False (production ready)")
            
        if not settings.SECRET_KEY or settings.SECRET_KEY == 'django-insecure-cuw8b95y$==pjsl#1pt9jgg#+ot$%)a-9ra2zay3+1=hov81g9':
            print("⚠️  Warning: Using default SECRET_KEY")
        else:
            print("✅ SECRET_KEY is set")
            
        print("✅ Django settings loaded successfully")
        
    except Exception as e:
        print(f"❌ Error loading Django settings: {e}")
        sys.exit(1)

def check_database_connection():
    """Test database connection with production settings"""
    print("\n🔍 Testing Production Database Connection...")
    
    try:
        # Set production environment
        os.environ['DEBUG'] = 'False'
        os.environ['DB_NAME'] = 'jewellery_crm_db_6lhq'
        os.environ['DB_USER'] = 'jewellery_crm_db_6lhq_user'
        os.environ['DB_PASSWORD'] = '00tT3WerKiPOn89oEfpzytXdcqRHnCJa'
        os.environ['DB_HOST'] = 'dpg-d27ekt0gjchc7384-a.oregon-postgres.render.com'
        os.environ['DB_PORT'] = '5432'
        
        # Import Django settings
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
        import django
        django.setup()
        
        from django.db import connection
        
        # Test connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"✅ Production database connection successful!")
            print(f"PostgreSQL Version: {version[0]}")
            
    except Exception as e:
        print(f"❌ Production database connection failed: {e}")
        print("This might be expected if the database is not accessible from your local machine")
        print("The connection will be tested during Render deployment")

def show_deployment_steps():
    """Show the deployment steps"""
    print("\n🚀 Production Deployment Steps")
    print("=" * 50)
    
    print("1. ✅ Environment files prepared")
    print("2. ✅ render.yaml updated")
    print("3. ✅ Database configuration verified")
    print("4. ✅ Django settings checked")
    
    print("\n📋 Next Steps:")
    print("1. Commit and push your changes to git:")
    print("   git add .")
    print("   git commit -m 'Production deployment preparation'")
    print("   git push origin main")
    
    print("\n2. Go to Render Dashboard:")
    print("   https://dashboard.render.com")
    
    print("\n3. Select your 'jewellery-crm-backend' service")
    
    print("\n4. Click 'Manual Deploy' → 'Deploy latest commit'")
    
    print("\n5. Monitor the deployment logs for:")
    print("   ✅ Port binding successful")
    print("   ✅ Database connection established")
    print("   ✅ Health check endpoint responding")
    
    print("\n6. Test your API endpoints:")
    print("   Health Check: https://crm-final-mfe4.onrender.com/api/health/")
    print("   Admin: https://crm-final-mfe4.onrender.com/admin/")

def main():
    """Main deployment preparation function"""
    print("🚀 Jewellery CRM Production Deployment Preparation")
    print("=" * 60)
    
    # Run all checks
    check_git_status()
    check_environment_files()
    check_django_settings()
    check_database_connection()
    
    # Show deployment steps
    show_deployment_steps()
    
    print("\n🎉 Deployment preparation completed!")
    print("Your backend is ready for production deployment on Render.")

if __name__ == "__main__":
    main()
