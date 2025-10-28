"use client";

import React, { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

interface CustomDropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}

export function CustomDropdown({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = ""
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  const handleAddCustom = () => {
    if (customValue.trim()) {
      onChange(customValue.trim());
      setIsOpen(false);
      setIsAddingCustom(false);
      setCustomValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCustom();
    } else if (e.key === 'Escape') {
      setIsAddingCustom(false);
      setCustomValue('');
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={label.toLowerCase()}>{label}</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {value || placeholder}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
              >
                {option}
              </button>
            ))}

            {/* Add Custom Value Section */}
            <div className="border-t border-gray-200">
              {!isAddingCustom ? (
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(true)}
                  className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 focus:outline-none focus:bg-blue-50 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add custom {label.toLowerCase()}
                </button>
              ) : (
                <div className="p-2">
                  <div className="flex gap-2">
                    <Input
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={`Enter custom ${label.toLowerCase()}`}
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      type="button"
                      onClick={handleAddCustom}
                      size="sm"
                      className="px-3"
                    >
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Press Enter to add or Escape to cancel
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
