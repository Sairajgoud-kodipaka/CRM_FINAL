#!/usr/bin/env python3
"""
SSL Troubleshooting Script for Render PostgreSQL
This script helps diagnose and fix SSL connection issues
"""

import os
import sys
import psycopg2
from pathlib import Path

def test_ssl_modes():
    """Test different SSL modes to find one that works"""
    print("🔍 Testing Different SSL Modes...")
    print("=" * 50)
    
    # Database connection parameters
    db_params = {
        'host': 'dpg-d27ekt0gjchc7384-a.oregon-postgres.render.com',
        'port': 5432,
        'database': 'jewellery_crm_db_6lhq',
        'user': 'jewellery_crm_db_6lhq_user',
        'password': '00tT3WerKiPOn89oEfpzytXdcqRHnCJa',
        'connect_timeout': 30
    }
    
    # SSL modes to test
    ssl_modes = [
        'disable',      # No SSL
        'allow',        # Try SSL, fallback to non-SSL
        'prefer',       # Prefer SSL, fallback to non-SSL
        'require',      # Require SSL
        'verify-ca',    # Verify CA
        'verify-full'   # Full verification
    ]
    
    working_modes = []
    
    for ssl_mode in ssl_modes:
        print(f"\n🔍 Testing SSL mode: {ssl_mode}")
        
        try:
            # Test connection with this SSL mode
            test_params = db_params.copy()
            test_params['sslmode'] = ssl_mode
            
            conn = psycopg2.connect(**test_params)
            
            # Test a simple query
            with conn.cursor() as cursor:
                cursor.execute("SELECT version();")
                version = cursor.fetchone()
                print(f"✅ {ssl_mode}: Connection successful!")
                print(f"   PostgreSQL Version: {version[0]}")
                working_modes.append(ssl_mode)
            
            conn.close()
            
        except Exception as e:
            print(f"❌ {ssl_mode}: Failed - {e}")
    
    return working_modes

def test_connection_string():
    """Test connection using connection string format"""
    print("\n🔍 Testing Connection String Format...")
    print("=" * 50)
    
    # Connection string format
    conn_string = "postgresql://jewellery_crm_db_6lhq_user:00tT3WerKiPOn89oEfpzytXdcqRHnCJa@dpg-d27ekt0gjchc7384-a.oregon-postgres.render.com:5432/jewellery_crm_db_6lhq"
    
    try:
        # Test with SSL prefer
        conn = psycopg2.connect(conn_string + "?sslmode=prefer&connect_timeout=30")
        
        with conn.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"✅ Connection String (SSL prefer): Success!")
            print(f"   PostgreSQL Version: {version[0]}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Connection String (SSL prefer): Failed - {e}")
        
        try:
            # Test with SSL require
            conn = psycopg2.connect(conn_string + "?sslmode=require&connect_timeout=30")
            
            with conn.cursor() as cursor:
                cursor.execute("SELECT version();")
                version = cursor.fetchone()
                print(f"✅ Connection String (SSL require): Success!")
                print(f"   PostgreSQL Version: {version[0]}")
            
            conn.close()
            return True
            
        except Exception as e2:
            print(f"❌ Connection String (SSL require): Failed - {e2}")
            return False

def generate_working_config(working_modes):
    """Generate working configuration based on test results"""
    print("\n🔧 Generating Working Configuration...")
    print("=" * 50)
    
    if not working_modes:
        print("❌ No SSL modes worked. This suggests a network or authentication issue.")
        return
    
    # Recommend the best working mode
    best_mode = working_modes[0]
    
    if 'disable' in working_modes:
        best_mode = 'disable'  # If no SSL works, use disable
    elif 'prefer' in working_modes:
        best_mode = 'prefer'   # Prefer SSL but allow fallback
    elif 'require' in working_modes:
        best_mode = 'require'  # Require SSL
    
    print(f"✅ Recommended SSL mode: {best_mode}")
    
    # Generate the configuration
    if best_mode == 'disable':
        print("\n⚠️  WARNING: SSL is disabled. This is not recommended for production.")
        print("   Consider using a different database service or SSL mode.")
    
    print(f"\n📝 Update your Django settings to use:")
    print(f"   'sslmode': '{best_mode}'")
    
    # Generate alternative configurations
    print(f"\n🔄 Alternative configurations to try:")
    for mode in working_modes[:3]:  # Show top 3 working modes
        print(f"   - sslmode: '{mode}'")

def check_render_environment():
    """Check if we're in Render environment"""
    print("\n🔍 Checking Render Environment...")
    print("=" * 50)
    
    render_vars = [
        'RENDER',
        'RENDER_EXTERNAL_HOSTNAME',
        'RENDER_SERVICE_ID',
        'RENDER_SERVICE_NAME'
    ]
    
    render_detected = False
    for var in render_vars:
        if os.environ.get(var):
            print(f"✅ {var}: {os.environ.get(var)}")
            render_detected = True
        else:
            print(f"❌ {var}: Not set")
    
    if render_detected:
        print("\n✅ Running in Render environment")
    else:
        print("\n❌ Not running in Render environment")
        print("   This script should be run on Render for accurate results")
    
    return render_detected

def main():
    """Main troubleshooting function"""
    print("🚀 Render PostgreSQL SSL Troubleshooter")
    print("=" * 60)
    
    # Check environment
    is_render = check_render_environment()
    
    if not is_render:
        print("\n⚠️  This script is designed to run on Render.")
        print("   Running locally may not give accurate results for production issues.")
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            return
    
    # Test different SSL modes
    working_modes = test_ssl_modes()
    
    # Test connection string format
    conn_string_works = test_connection_string()
    
    # Generate working configuration
    generate_working_config(working_modes)
    
    # Summary
    print("\n📊 Summary")
    print("=" * 50)
    print(f"Working SSL modes: {', '.join(working_modes) if working_modes else 'None'}")
    print(f"Connection string works: {'Yes' if conn_string_works else 'No'}")
    
    if working_modes:
        print("\n🎉 SSL troubleshooting completed successfully!")
        print("Use the recommended configuration above.")
    else:
        print("\n💥 SSL troubleshooting failed.")
        print("This suggests a deeper network or authentication issue.")
        print("Check your Render database service status and credentials.")

if __name__ == "__main__":
    main()
