"use client";

import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

interface WeightDropdownProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function WeightDropdown({
  label,
  value,
  onChange,
  className = ""
}: WeightDropdownProps) {
  const [unit, setUnit] = useState<'g' | 'kg'>('g');
  const [weightValue, setWeightValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  // Predefined weight options based on unit
  const gramOptions = [
    '0.5', '1', '2', '3', '5', '10', '15', '20', '25', '30', '50', '100', '150', '200', '250', '300', '500', '750', '1000'
  ];

  const kgOptions = [
    '0.1', '0.2', '0.5', '1', '1.5', '2', '2.5', '3', '4', '5', '7.5', '10', '15', '20', '25', '50', '100'
  ];

  const currentOptions = unit === 'g' ? gramOptions : kgOptions;

  // Convert value to display format
  useEffect(() => {
    if (value > 0) {
      if (unit === 'kg') {
        setWeightValue((value / 1000).toString());
      } else {
        setWeightValue(value.toString());
      }
    }
  }, [value, unit]);

  const handleSelect = (selectedValue: string) => {
    const numValue = parseFloat(selectedValue);
    if (!isNaN(numValue)) {
      if (unit === 'kg') {
        onChange(numValue * 1000); // Convert kg to grams
      } else {
        onChange(numValue); // Keep in grams
      }
      setIsOpen(false);
    }
  };

  const handleAddCustom = () => {
    if (customValue.trim()) {
      const numValue = parseFloat(customValue);
      if (!isNaN(numValue)) {
        if (unit === 'kg') {
          onChange(numValue * 1000); // Convert kg to grams
        } else {
          onChange(numValue); // Keep in grams
        }
        setIsOpen(false);
        setIsAddingCustom(false);
        setCustomValue('');
      }
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

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setWeightValue(inputValue);

    if (inputValue.trim()) {
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue)) {
        if (unit === 'kg') {
          onChange(numValue * 1000); // Convert kg to grams
        } else {
          onChange(numValue); // Keep in grams
        }
      }
    } else {
      onChange(0);
    }
  };

  const handleUnitChange = (newUnit: 'g' | 'kg') => {
    setUnit(newUnit);
    // Convert current value to new unit
    if (value > 0) {
      if (newUnit === 'kg') {
        setWeightValue((value / 1000).toString());
      } else {
        setWeightValue(value.toString());
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="weight">{label}</Label>

      {/* Unit Selection */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleUnitChange('g')}
          className={`px-3 py-2 text-sm rounded-md border ${
            unit === 'g'
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          g
        </button>
        <button
          type="button"
          onClick={() => handleUnitChange('kg')}
          className={`px-3 py-2 text-sm rounded-md border ${
            unit === 'kg'
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          kg
        </button>
      </div>

      {/* Weight Input and Dropdown */}
      <div className="relative">
        <div className="flex gap-2">
          <Input
            id="weight"
            value={weightValue}
            onChange={handleWeightChange}
            placeholder="0.00"
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
            {currentOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
              >
                {option} {unit}
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
                  Add custom weight
                </button>
              ) : (
                <div className="p-2">
                  <div className="flex gap-2">
                    <Input
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={`Enter custom weight in ${unit}`}
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

      <p className="text-xs text-gray-500">
        Current unit: {unit} (stored as grams in database)
      </p>
    </div>
  );
}
