"""
Shared validation utilities for the CRM system.
"""
import re
from django.core.exceptions import ValidationError


def validate_indian_phone_number(value):
    """
    Validate Indian phone number format.
    Expected format: +91 followed by exactly 10 digits starting with 6, 7, 8, or 9.
    
    Args:
        value (str): Phone number to validate
        
    Raises:
        ValidationError: If phone number format is invalid
    """
    if not value:
        return
    
    # Remove all non-digit characters except +
    cleaned_value = re.sub(r'[^\d+]', '', value)
    
    # Check if it starts with +91
    if not cleaned_value.startswith('+91'):
        # If it doesn't start with +91, assume it's just the mobile number
        mobile_digits = cleaned_value
    else:
        # Extract mobile number part (after +91)
        mobile_digits = cleaned_value[3:]
    
    # Validate mobile number: exactly 10 digits
    if len(mobile_digits) != 10:
        raise ValidationError('Phone number must have exactly 10 digits.')
    
    # Check if all characters are digits
    if not mobile_digits.isdigit():
        raise ValidationError('Phone number must contain only digits.')
    
    # Check if it starts with valid Indian mobile prefixes
    first_digit = mobile_digits[0]
    if first_digit not in ['6', '7', '8', '9']:
        raise ValidationError('Indian mobile numbers must start with 6, 7, 8, or 9.')
    
    return value


def normalize_phone_number(value):
    """
    Normalize phone number to consistent format (+91XXXXXXXXXX).
    
    Args:
        value (str): Phone number to normalize
        
    Returns:
        str: Normalized phone number in +91XXXXXXXXXX format
    """
    if not value:
        return value
    
    # Remove all non-digit characters
    digits_only = re.sub(r'\D', '', value)
    
    # If it starts with 91 and has 12 digits, it's already in correct format
    if digits_only.startswith('91') and len(digits_only) == 12:
        return f'+{digits_only}'
    
    # If it has 10 digits, add +91 prefix
    if len(digits_only) == 10:
        return f'+91{digits_only}'
    
    # If it has 11 digits and starts with 0, remove the 0 and add +91
    if len(digits_only) == 11 and digits_only.startswith('0'):
        return f'+91{digits_only[1:]}'
    
    # Return as is if it doesn't match expected patterns
    return value
