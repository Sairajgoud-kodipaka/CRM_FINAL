"use client";

import React, { useState, useEffect } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
}

export function PhoneInputComponent({
  value,
  onChange,
  placeholder = "Enter phone number",
  className,
  required = false,
  disabled = false,
  error = false,
}: PhoneInputProps) {
  const [validationError, setValidationError] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(true);

  // Validate phone number to ensure exactly 10 digits (excluding country code)
  const validatePhoneNumber = (phoneValue: string) => {
    if (!phoneValue) {
      setValidationError("");
      setIsValid(true);
      return;
    }

    // For international phone numbers, we need to extract the national number
    // Remove the country code (usually starts with + and has 1-3 digits)
    let nationalNumber = phoneValue;
    
    // If it starts with +, remove the country code part
    if (phoneValue.startsWith('+')) {
      // Find the first space or extract after the country code
      const spaceIndex = phoneValue.indexOf(' ');
      if (spaceIndex !== -1) {
        nationalNumber = phoneValue.substring(spaceIndex + 1);
      } else {
        // If no space, assume country code is 1-3 digits
        const match = phoneValue.match(/^\+\d{1,3}(.+)$/);
        if (match) {
          nationalNumber = match[1];
        }
      }
    }
    
    // Remove all non-digit characters from the national number
    const digitsOnly = nationalNumber.replace(/\D/g, '');
    
    // Check if it has exactly 10 digits
    if (digitsOnly.length === 10) {
      setValidationError("");
      setIsValid(true);
    } else if (digitsOnly.length < 10) {
      setValidationError("Phone number must have exactly 10 digits");
      setIsValid(false);
    } else {
      setValidationError("Phone number cannot exceed 10 digits");
      setIsValid(false);
    }
  };

  // Validate on value change
  useEffect(() => {
    validatePhoneNumber(value);
  }, [value]);

  // Handle phone number change with validation
  const handlePhoneChange = (val: string | undefined) => {
    const phoneValue = val || "";
    onChange(phoneValue);
    validatePhoneNumber(phoneValue);
  };

  return (
    <div className="relative">
      <PhoneInput
        international
        defaultCountry="IN"
        value={value}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          (error || !isValid) && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        required={required}
      />
      {!isValid && validationError && (
        <p className="text-sm text-red-500 mt-1">{validationError}</p>
      )}
    </div>
  );
}
