"use client";

import React, { useState, useRef } from "react";
import PhoneInput from "react-phone-number-input";
import { parsePhoneNumber } from "libphonenumber-js";
import type { Country } from "react-phone-number-input";
import { cn } from "@/lib/utils";
import "react-phone-number-input/style.css";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  defaultCountry?: Country;
}

export function PhoneInputComponent({
  value,
  onChange,
  placeholder,
  className,
  required = false,
  disabled = false,
  error = false,
  onKeyDown,
  defaultCountry = "IN",
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(defaultCountry || "IN");
  const previousValueRef = useRef<string>("");

  // Handle phone number change with length validation
  const handlePhoneChange = (phoneValue: string | undefined) => {
    const newValue = phoneValue || "";
    
    // If empty, allow it
    if (!newValue) {
      previousValueRef.current = newValue;
      onChange(newValue);
      return;
    }

    // 1. General limit: Maximum 20 characters total (including +, spaces, etc.)
    if (newValue.length > 20) {
      // Don't update - keep previous valid value
      return;
    }

    // Get total digits (including country code)
    const digitsOnly = newValue.replace(/\D/g, '');
    
    // 2. Special validation for Indian numbers: +91 followed by exactly 10 digits
    const isIndianNumber = newValue.startsWith('+91') || 
                          (selectedCountry === 'IN' && newValue.startsWith('+')) ||
                          (digitsOnly.startsWith('91') && digitsOnly.length >= 12);
    
    if (isIndianNumber) {
      // Extract all digits
      const allDigits = digitsOnly;
      
      // Check if it starts with 91 (Indian country code)
      if (allDigits.startsWith('91')) {
        // Get digits after 91 (should be exactly 10)
        const nationalDigits = allDigits.substring(2);
        
        // For Indian numbers, restrict to exactly 10 digits after 91
        if (nationalDigits.length > 10) {
          // Truncate to exactly 10 digits after 91
          const truncated = '+91' + nationalDigits.substring(0, 10);
          previousValueRef.current = truncated;
          onChange(truncated);
          return;
        }
        
        // Ensure format is +91 followed by 10 digits
        if (nationalDigits.length === 10) {
          const formatted = '+91' + nationalDigits;
          previousValueRef.current = formatted;
          onChange(formatted);
          return;
        }
      } else if (allDigits.length === 10 && (selectedCountry === 'IN' || defaultCountry === 'IN')) {
        // If 10 digits without country code and India is selected, add +91
        const formatted = '+91' + allDigits;
        previousValueRef.current = formatted;
        onChange(formatted);
        return;
      }
    }
    
    // 3. Country-specific max digit limits (total digits including country code)
    const countryMaxDigits: Record<string, number> = {
      'IN': 12, // India: 91 (2) + 10 (number) = 12 digits total
      'US': 11, // United States: 1 (1) + 10 (number) = 11 digits total
      'GB': 13, // United Kingdom: 44 (2) + 10-11 (number) = 12-13 digits total
      'CA': 11, // Canada: 1 (1) + 10 (number) = 11 digits total
      'AU': 12, // Australia: 61 (2) + 9-10 (number) = 11-12 digits total
    };

    // Get max digits for selected country or use default (15 is E.164 max)
    const country = selectedCountry || defaultCountry || "IN";
    const maxDigits = countryMaxDigits[country] || 15;
    
    // Restrict if exceeds country-specific max digits
    if (digitsOnly.length > maxDigits) {
      // Don't update - keep previous valid value
      return;
    }

    // Update the value
    previousValueRef.current = newValue;
    onChange(newValue);

    // Try to parse to update country if possible
    if (newValue) {
      try {
        const phoneNumber = parsePhoneNumber(newValue);
        if (phoneNumber?.country) {
          setSelectedCountry(phoneNumber.country as Country);
        }
      } catch (e) {
        // Ignore parsing errors for partial input
      }
    }
  };

  // Handle country change
  const handleCountryChange = (country: Country | undefined) => {
    setSelectedCountry(country);
    
    // If there's a value, re-validate it for the new country
    if (value) {
      try {
        const phoneNumber = parsePhoneNumber(value);
        if (phoneNumber && phoneNumber.country !== country) {
          // Country changed, might need to adjust the number
          // For now, just update the country
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  };

  // Handle paste event to clean and format pasted phone numbers
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    // Get pasted text
    const pastedText = e.clipboardData.getData('text');
    
    if (!pastedText) return;

    // Clean the pasted text: remove all non-digit characters except +
    let cleanedText = pastedText.trim();
    
    // Extract all digits and + sign
    const digitsAndPlus = cleanedText.replace(/[^\d+]/g, '');
    
    if (!digitsAndPlus) return;

    // Determine if we need to add country code
    let formattedNumber = digitsAndPlus;
    const hasPlus = digitsAndPlus.startsWith('+');
    const digitsOnly = digitsAndPlus.replace(/\D/g, '');
    
    if (!hasPlus) {
      // No + sign, try to detect country code or use default
      if (digitsOnly.length === 10) {
        // 10 digits - assume Indian number, add +91
        formattedNumber = '+91' + digitsOnly;
      } else if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
        // 12 digits starting with 91 - Indian number with country code
        formattedNumber = '+' + digitsOnly;
      } else if (digitsOnly.startsWith('1') && digitsOnly.length === 11) {
        // 11 digits starting with 1 - US/Canada number
        formattedNumber = '+' + digitsOnly;
      } else if (digitsOnly.startsWith('44') && digitsOnly.length >= 12) {
        // UK number
        formattedNumber = '+' + digitsOnly;
      } else if (digitsOnly.length > 10) {
        // More than 10 digits, likely has country code
        formattedNumber = '+' + digitsOnly;
      } else {
        // Use selected country's code or default to India
        const countryCodeMap: Record<string, string> = {
          'IN': '91',
          'US': '1',
          'GB': '44',
          'CA': '1',
          'AU': '61',
        };
        const countryCode = selectedCountry ? (countryCodeMap[selectedCountry] || '91') : '91';
        formattedNumber = '+' + countryCode + digitsOnly;
      }
    }

    // Validate the cleaned number length
    const finalDigitsOnly = formattedNumber.replace(/\D/g, '');
    
    // Country-specific max digit limits
    const countryMaxDigits: Record<string, number> = {
      'IN': 12, // India: 91 (country) + 10 (number) = 12 digits total
      'US': 11, // United States: 1 (country) + 10 (number) = 11 digits total
      'GB': 13, // United Kingdom: 44 (country) + 10-11 (number) = 13-14 digits total
      'CA': 11, // Canada: 1 (country) + 10 (number) = 11 digits total
      'AU': 12, // Australia: 61 (country) + 9 (number) = 12 digits total
    };

    // Get max digits for selected country or use default
    const country = selectedCountry || defaultCountry || "IN";
    const maxDigits = countryMaxDigits[country] || 15;
    
    // If exceeds max, truncate to max digits (keep the + and country code)
    if (finalDigitsOnly.length > maxDigits) {
      // Keep + and country code, truncate the rest
      const countryCodeLength = selectedCountry === 'US' || selectedCountry === 'CA' ? 1 : 
                                selectedCountry === 'GB' || selectedCountry === 'IN' ? 2 : 3;
      const maxNationalDigits = maxDigits - countryCodeLength;
      const nationalDigits = finalDigitsOnly.substring(countryCodeLength);
      if (nationalDigits.length > maxNationalDigits) {
        formattedNumber = '+' + finalDigitsOnly.substring(0, maxDigits);
      }
    }

    // Try to parse and format the number properly
    try {
      const phoneNumber = parsePhoneNumber(formattedNumber);
      if (phoneNumber) {
        // Format to E.164 format (international standard)
        formattedNumber = phoneNumber.format('E.164');
        
        // Update country if detected
        if (phoneNumber.country) {
          setSelectedCountry(phoneNumber.country as Country);
        }
      }
    } catch (e) {
      // If parsing fails, use the cleaned number as is
      // The library will handle it in handlePhoneChange
    }

    // Update the value
    handlePhoneChange(formattedNumber);
  };

  // Handle key down events and restrict invalid input
  const handleKeyDownWrapper = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow navigation and control keys
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Tab' ||
      e.key === 'Enter' ||
      e.ctrlKey ||
      e.metaKey
    ) {
      if (onKeyDown) {
        onKeyDown(e);
      }
      return;
    }

    // Restrict non-digit characters (except + which is handled by the library)
    if (e.key.length === 1 && !/[\d+]/.test(e.key)) {
      e.preventDefault();
      return;
    }

    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  // Get country-specific max length for the input
  // Note: react-phone-number-input shows only the national number in the input field
  // So maxLength should be for the national number part only, not the full international format
  const getMaxLength = (): number => {
    const country = selectedCountry || defaultCountry || "IN";
    
    const countryMaxLengths: Record<string, number> = {
      'IN': 10, // India: 10 digits (national number)
      'US': 10, // United States: 10 digits (national number)
      'GB': 11, // United Kingdom: 10-11 digits (national number)
      'CA': 10, // Canada: 10 digits (national number)
      'AU': 10, // Australia: 10 digits (national number)
    };
    
    // Return max length for national number (the library handles country code separately)
    return countryMaxLengths[country] || 15;
  };

  return (
    <div className="space-y-2 w-full">
      {/* Phone input field with country selector and flag */}
      <div className="relative w-full">
        <PhoneInput
          international
          defaultCountry={defaultCountry}
          value={value}
          onChange={handlePhoneChange}
          onCountryChange={handleCountryChange}
          placeholder={placeholder || "Enter phone number"}
          disabled={disabled}
          required={required}
          limitMaxLength={true}
          className={cn(
            "phone-input-custom",
            error && "phone-input-error",
            className
          )}
          numberInputProps={{
            className: cn(
              "flex-1 h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
              "placeholder:text-gray-400 placeholder:font-medium",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
              error && "border-red-500 focus:ring-red-500 focus:border-red-500"
            ),
            onKeyDown: handleKeyDownWrapper,
            onPaste: handlePaste,
            type: "tel",
          }}
        />
      </div>
    </div>
  );
}
