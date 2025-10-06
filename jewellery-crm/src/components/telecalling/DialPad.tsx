// Simplified Dial Pad Component
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Phone, Delete, ArrowLeft } from 'lucide-react';

interface DialPadProps {
  phoneNumber: string;
  onPhoneNumberChange: (number: string) => void;
  onCall: () => void;
  onClear: () => void;
  onBackspace: () => void;
  isCalling?: boolean;
  disabled?: boolean;
}

export function DialPad({
  phoneNumber,
  onPhoneNumberChange,
  onCall,
  onClear,
  onBackspace,
  isCalling = false,
  disabled = false
}: DialPadProps) {
  const dialPadNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ];

  const handleNumberClick = (number: string) => {
    if (!disabled) {
      onPhoneNumberChange(phoneNumber + number);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    const key = e.key;
    if (key === 'Backspace') {
      onBackspace();
    } else if (key === 'Enter') {
      onCall();
    } else if (/[0-9*#]/.test(key)) {
      handleNumberClick(key);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 text-center">Dial Pad</h3>
        
        {/* Phone Number Display */}
        <div className="text-center">
          <Input
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter phone number"
            className="text-center text-lg font-mono h-12"
            disabled={disabled}
          />
        </div>

        {/* Dial Pad Grid */}
        <div className="grid grid-cols-3 gap-3">
          {dialPadNumbers.map((row, rowIndex) =>
            row.map((number) => (
              <Button
                key={number}
                variant="outline"
                size="lg"
                onClick={() => handleNumberClick(number)}
                disabled={disabled}
                className="h-12 text-lg font-semibold hover:bg-gray-50"
              >
                {number}
              </Button>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackspace}
            disabled={disabled || phoneNumber.length === 0}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            disabled={disabled}
            className="flex items-center space-x-2"
          >
            <Delete className="w-4 h-4" />
            <span>Clear</span>
          </Button>
        </div>

        {/* Call Button */}
        <div className="flex justify-center">
          <Button
            onClick={onCall}
            disabled={disabled || phoneNumber.length === 0 || isCalling}
            className={`w-full h-12 text-lg font-semibold ${
              isCalling 
                ? 'bg-orange-600 hover:bg-orange-700' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            <Phone className="w-5 h-5 mr-2" />
            {isCalling ? 'Calling...' : 'Call'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

