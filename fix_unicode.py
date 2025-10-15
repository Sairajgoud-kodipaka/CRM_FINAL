#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os

def fix_unicode_in_file(file_path):
    """Replace Unicode emoji characters with regular text"""
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Define replacements
    replacements = {
        '✅': 'SUCCESS:',
        '❌': 'ERROR:',
        '⚠️': 'WARNING:',
        'ℹ️': 'INFO:',
        '🎯': 'TARGET:'
    }
    
    # Apply replacements
    for emoji, replacement in replacements.items():
        content = content.replace(emoji, replacement)
    
    # Write back to file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Fixed Unicode characters in {file_path}")

if __name__ == "__main__":
    file_path = "backend/apps/clients/serializers.py"
    fix_unicode_in_file(file_path)

