#!/usr/bin/env python3
"""
Python version compatibility checker for Jewellery CRM Backend
Ensures Python version meets minimum requirements
"""

import sys
import platform

def check_python_version():
    """Check if Python version meets minimum requirements"""
    min_version = (3, 8)
    current_version = sys.version_info[:2]
    
    print(f"Python version: {platform.python_version()}")
    print(f"Platform: {platform.platform()}")
    
    if current_version < min_version:
        print(f"ERROR: Python {min_version[0]}.{min_version[1]}+ required, got {current_version[0]}.{current_version[1]}")
        return False
    
    print(f"✅ Python version {current_version[0]}.{current_version[1]} is compatible")
    return True

if __name__ == "__main__":
    success = check_python_version()
    sys.exit(0 if success else 1)
