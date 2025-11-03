"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function PhoneInputComponent({
  value,
  onChange,
  placeholder = "9876543210",
  className,
  required = false,
  disabled = false,
  error = false,
  onKeyDown,
}: PhoneInputProps) {
  const [validationError, setValidationError] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(true);

  // Extract mobile number from full value (remove +91 prefix)
  const mobileNumber = value.startsWith('+91') ? value.substring(3) : value;

  // Strict Indian phone number validation - exactly 10 digits
  const validateIndianPhoneNumber = (mobileValue: string) => {
    if (!mobileValue) {
      setValidationError("");
      setIsValid(true);
      return;
    }

    // Remove all non-digit characters
    const digitsOnly = mobileValue.replace(/\D/g, '');

    // Strict validation: exactly 10 digits, no more, no less
    if (digitsOnly.length === 10) {
      // Additional validation: Indian mobile numbers start with 6, 7, 8, or 9
      const firstDigit = digitsOnly.charAt(0);
      if (['6', '7', '8', '9'].includes(firstDigit)) {
        setValidationError("");
        setIsValid(true);
      } else {
        setValidationError("Indian mobile numbers start with 6, 7, 8, or 9");
        setIsValid(false);
      }
    } else if (digitsOnly.length < 10) {
      setValidationError("Mobile number must have exactly 10 digits");
      setIsValid(false);
    } else {
      setValidationError("Mobile number cannot exceed 10 digits");
      setIsValid(false);
    }
  };

  // Validate on value change
  useEffect(() => {
    validateIndianPhoneNumber(mobileNumber);
  }, [mobileNumber]);

  // Handle mobile number change with strict validation
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Remove all non-digit characters
    const digitsOnly = inputValue.replace(/\D/g, '');

    // Enforce exactly 10 digits maximum
    if (digitsOnly.length <= 10) {
      // Concatenate +91 prefix with mobile number
      const fullValue = digitsOnly.length > 0 ? `+91${digitsOnly}` : '';
      onChange(fullValue);
    }
    // If more than 10 digits, ignore the input (enforced by maxLength)
  };

  return (
    <div className="space-y-2 w-full">
      {/* Phone input field with integrated +91 prefix */}
      <div className="relative flex w-full max-w-full overflow-hidden">
        {/* +91 prefix badge */}
        <div className="inline-flex items-center justify-center px-2 py-2 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-300 border-r-0 rounded-l-md min-w-[36px] flex-shrink-0">
          +91
        </div>

        {/* Mobile number input */}
        <input
          type="tel"
          value={mobileNumber}
          onChange={handleMobileChange}
          onKeyDown={onKeyDown}
          maxLength={10}
          pattern="\d{10}"
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            "flex-1 h-10 rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm min-w-0 w-full",
            "placeholder:text-gray-400 placeholder:font-medium",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
            (error || !isValid) && "border-red-500 focus:ring-red-500 focus:border-red-500",
            className
          )}
        />
      </div>

      {/* Validation error */}
      {!isValid && validationError && (
        <p className="text-sm text-red-600 font-medium flex items-center gap-2">
          <span className="text-red-500 text-lg">⚠</span>
          {validationError}
        </p>
      )}


    </div>
  );
}
