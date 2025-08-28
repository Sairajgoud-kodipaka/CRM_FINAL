#!/usr/bin/env python
"""
Script to populate the database with realistic jewelry products and categories.
This script runs the Django management command to add sample data.
"""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Setup Django
django.setup()

from django.core.management import call_command
from django.core.management.base import CommandError

def main():
    """Main function to run the jewelry data population command"""
    try:
        print("🚀 Starting jewelry data population...")
        print("=" * 50)
        
        # Run the management command
        call_command('populate_jewelry_data', verbosity=2)
        
        print("=" * 50)
        print("✅ Jewelry data population completed successfully!")
        print("\n📊 Data created:")
        print("   • 10 main categories")
        print("   • 25 subcategories")
        print("   • 20+ realistic jewelry products")
        print("   • Complete inventory records")
        print("\n🎯 Categories include:")
        print("   • Rings (Engagement, Wedding, Fashion, etc.)")
        print("   • Necklaces (Gold, Diamond, Pearl, etc.)")
        print("   • Earrings (Studs, Jhumka, Pearl, etc.)")
        print("   • Bracelets, Pendants, Mangalsutra")
        print("   • Temple Jewellery")
        
    except CommandError as e:
        print(f"❌ Error running command: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
