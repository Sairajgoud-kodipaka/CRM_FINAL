"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { Label } from './label';

interface DimensionsInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DimensionsInput({
  label,
  value,
  onChange,
  className = ""
}: DimensionsInputProps) {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const isInitialMount = useRef(true);

  // Parse existing value on mount
  useEffect(() => {
    if (isInitialMount.current && value) {
      const parts = value.split('x').map(part => part.trim());
      if (parts.length === 3) {
        setLength(parts[0]);
        setWidth(parts[1]);
        setHeight(parts[2]);
      }
      isInitialMount.current = false;
    }
  }, [value]);

  // Update parent when any dimension changes
  useEffect(() => {
    if (!isInitialMount.current) {
      if (length || width || height) {
        const dimensions = [length, width, height].filter(d => d.trim()).join(' x ');
        onChange(dimensions);
      } else {
        onChange('');
      }
    }
  }, [length, width, height]);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="dimensions">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id="length"
          value={length}
          onChange={(e) => setLength(e.target.value)}
          placeholder="L"
          className="text-center"
        />
        <span className="text-gray-500">×</span>
        <Input
          id="width"
          value={width}
          onChange={(e) => setWidth(e.target.value)}
          placeholder="W"
          className="text-center"
        />
        <span className="text-gray-500">×</span>
        <Input
          id="height"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          placeholder="H"
          className="text-center"
        />
        <span className="text-sm text-gray-500 ml-2">cm</span>
      </div>
      <p className="text-xs text-gray-500">
        Enter length, width, and height (e.g., 10 x 5 x 2)
      </p>
    </div>
  );
}
