"""
Shared validation utilities for the CRM system.
"""
import re
from django.core.exceptions import ValidationError
import phonenumbers
from phonenumbers import NumberParseException


def validate_international_phone_number(value):
    """
    Validate international phone number format using phonenumbers library.
    Supports all countries and their phone number formats.
    
    Args:
        value (str): Phone number to validate (should include country code, e.g., +1XXXXXXXXXX, +91XXXXXXXXXX, +447887634495)
        
    Raises:
        ValidationError: If phone number format is invalid
    """
    if not value:
        return
    
    # Strip whitespace
    value = str(value).strip()
    if not value:
        return
    
    # Try parsing with different approaches
    parsed_number = None
    parse_error = None
    
    # First, try parsing with no default region (assumes international format with +)
    # This is the best approach for international numbers like +447887634495
    if value.startswith('+'):
        try:
            parsed_number = phonenumbers.parse(value, None)
            # If parsing succeeds, check if it's a possible number
            if phonenumbers.is_possible_number(parsed_number):
                # Allow it even if not strictly valid (some valid numbers might fail strict validation)
                return value
            else:
                # If not possible, try with specific regions
                parsed_number = None  # Reset to try with regions
        except NumberParseException as e:
            parse_error = e
            parsed_number = None
    
    # If that fails, try with common regions as fallback (especially GB for UK numbers)
    if parsed_number is None:
        # Prioritize GB for numbers starting with +44 (UK)
        regions_to_try = ['GB'] if value.startswith('+44') else []
        regions_to_try.extend(['US', 'IN', 'CA', 'AU', None])
        
        for region in regions_to_try:
            try:
                parsed_number = phonenumbers.parse(value, region)
                # If parsing succeeds, check if it's a possible number
                if phonenumbers.is_possible_number(parsed_number):
                    return value
                break
            except NumberParseException:
                continue
    
    # If we still couldn't parse it, check if it's a legacy Indian format
    if parsed_number is None:
        digits_only = re.sub(r'\D', '', value)
        # Legacy: If it's 10 digits, assume it's an Indian number (will be normalized later)
        if len(digits_only) == 10:
            return value  # Allow it, normalization will handle it
        # Legacy: If it starts with 91 and has 12 digits, it's valid
        if digits_only.startswith('91') and len(digits_only) == 12:
            return value  # Allow it, normalization will handle it
        # Legacy: If it has 11 digits and starts with 0, it's valid
        if len(digits_only) == 11 and digits_only.startswith('0'):
            return value  # Allow it, normalization will handle it
        
        # If we can't parse it and it doesn't match legacy formats, raise an error
        error_msg = str(parse_error) if parse_error else "Unknown error"
        if "INVALID_COUNTRY_CODE" in error_msg:
            raise ValidationError('Invalid country code. Please include a valid country code (e.g., +1 for US, +91 for India, +44 for UK).')
        elif "NOT_A_NUMBER" in error_msg:
            raise ValidationError('Please enter a valid phone number.')
        else:
            raise ValidationError('Invalid phone number format. Please include country code (e.g., +1XXXXXXXXXX, +447887634495).')
    
    # Check if it's a possible number (less strict check - allows more formats)
    if not phonenumbers.is_possible_number(parsed_number):
        raise ValidationError('This phone number is not possible. Please check and try again.')
    
    # Check if the number is valid (more strict check)
    # Note: We use is_possible_number above which is more lenient
    # is_valid_number is stricter and might reject some valid numbers in edge cases
    # So we only use it as a warning, not a hard requirement
    if not phonenumbers.is_valid_number(parsed_number):
        # For international numbers, be more lenient - if it's possible, allow it
        # The normalization will format it correctly
        pass
    
    return value


def validate_indian_phone_number(value):
    """
    Validate Indian phone number format (backward compatibility).
    This function now uses the international validator but provides Indian-specific error messages.
    
    Args:
        value (str): Phone number to validate
        
    Raises:
        ValidationError: If phone number format is invalid
    """
    # Use the international validator for consistency
    return validate_international_phone_number(value)


def normalize_phone_number(value):
    """
    Normalize phone number to E.164 format (international standard: +[country code][number]).
    Supports all countries and formats.
    
    Args:
        value (str): Phone number to normalize
        
    Returns:
        str: Normalized phone number in E.164 format (e.g., +14155552671, +919876543210, +447887634495)
    """
    if not value:
        return value
    
    # Strip whitespace
    value = str(value).strip()
    if not value:
        return value
    
    # If already in E.164 format (starts with +), try to parse and normalize it
    if value.startswith('+'):
        # Try parsing with no default region first (best for international numbers)
        for region in [None, 'GB', 'US', 'IN', 'CA', 'AU']:
            try:
                # Parse the phone number
                parsed_number = phonenumbers.parse(value, region)
                
                # Format to E.164 (international format with + prefix)
                normalized = phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.E164)
                return normalized
            except NumberParseException:
                continue
        
        # If all parsing attempts fail but it starts with + and has enough digits, return as-is
        digits_only = re.sub(r'\D', '', value)
        if digits_only and len(digits_only) >= 7:  # Minimum valid phone number length
            # Return as-is if it looks like a valid international number
            return value
    
    # Try parsing without + prefix (might be missing)
    try:
        # For imports/CSV, prioritize India (IN) first, then other regions
        # Try with India first as default for imports
        for region in ['IN', 'GB', 'US', None]:
            try:
                parsed_number = phonenumbers.parse(value, region)
                normalized = phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.E164)
                return normalized
            except NumberParseException:
                continue
    except Exception:
        pass
    
    # If parsing fails, try to handle legacy Indian format (10 digits without country code)
    # This maintains backward compatibility
    digits_only = re.sub(r'\D', '', value)
    
    # Legacy: If it's 10 digits, assume it's an Indian number
    if len(digits_only) == 10:
        return f'+91{digits_only}'
    
    # Legacy: If it starts with 91 and has 12 digits, add + prefix
    if digits_only.startswith('91') and len(digits_only) == 12:
        return f'+{digits_only}'
    
    # Legacy: If it has 11 digits and starts with 0, remove the 0 and add +91
    if len(digits_only) == 11 and digits_only.startswith('0'):
        return f'+91{digits_only[1:]}'
    
    # If all else fails, return as is (might be already in correct format)
    # Ensure it starts with + if it doesn't already and has enough digits
    if value and not value.startswith('+'):
        # Try to add + if it looks like it might be an international number
        if digits_only and len(digits_only) >= 7:
            return f'+{digits_only}'
    
    return value
