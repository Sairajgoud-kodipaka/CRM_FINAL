#!/usr/bin/env python3
"""
Python version compatibility checker for Jewellery CRM
Ensures the correct Python version is being used
"""

import sys
import platform

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    python_version = f"{version.major}.{version.minor}.{version.micro}"
    
    print(f"🐍 Python version detected: {python_version}")
    print(f"🖥️  Platform: {platform.platform()}")
    
    # Recommended versions
    recommended_versions = [(3, 11), (3, 12)]
    current_version = (version.major, version.minor)
    
    if current_version in recommended_versions:
        print("✅ Python version is compatible!")
        return True
    elif version.major == 3 and version.minor >= 13:
        print("⚠️  Python 3.13+ detected - may have compatibility issues")
        print("💡 Recommended: Use Python 3.11 or 3.12 for best compatibility")
        print("🔧 You can still proceed, but some packages may fail to build")
        return False
    else:
        print("❌ Python version is too old!")
        print("💡 Please upgrade to Python 3.11 or 3.12")
        return False

if __name__ == "__main__":
    success = check_python_version()
    if not success:
        print("\n🚀 To fix this:")
        print("1. Install Python 3.11 or 3.12")
        print("2. Create a new virtual environment:")
        print("   python3.11 -m venv venv")
        print("3. Activate and install requirements:")
        print("   source venv/bin/activate  # On Windows: venv\\Scripts\\activate")
        print("   pip install -r requirements.txt")
    sys.exit(0 if success else 1)
