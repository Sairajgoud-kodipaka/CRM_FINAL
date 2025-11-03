"use client";
import { useCallback, useRef } from 'react';

export interface FormField {
  id: string;
  type: 'input' | 'select' | 'textarea' | 'phone' | 'checkbox';
  ref?: React.RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement>;
}

export function useFormNavigation(fields: FormField[]) {
  const fieldRefs = useRef<Map<string, HTMLElement>>(new Map());

  const registerField = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      fieldRefs.current.set(id, element);
    } else {
      fieldRefs.current.delete(id);
    }
  }, []);

  const focusField = useCallback((fieldId: string) => {
    const element = fieldRefs.current.get(fieldId);
    if (element) {
      // Handle different types of elements
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.focus();
      } else if (element.getAttribute('role') === 'combobox') {
        // For Select components, trigger click to open dropdown
        element.click();
      } else {
        // For other elements, try to find focusable child
        const focusable = element.querySelector('input, textarea, button, [tabindex]') as HTMLElement;
        if (focusable) {
          focusable.focus();
        }
      }
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentFieldId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      const currentIndex = fields.findIndex(field => field.id === currentFieldId);
      if (currentIndex >= 0 && currentIndex < fields.length - 1) {
        const nextField = fields[currentIndex + 1];
        
        // Small delay to ensure current field processing is complete
        setTimeout(() => {
          focusField(nextField.id);
        }, 50);
      }
    }
  }, [fields, focusField]);

  const handleSelectKeyDown = useCallback((e: React.KeyboardEvent, currentFieldId: string, isOpen: boolean) => {
    // For Select components, only move to next field if dropdown is closed and Enter is pressed
    if (e.key === 'Enter' && !isOpen) {
      e.preventDefault();
      
      const currentIndex = fields.findIndex(field => field.id === currentFieldId);
      if (currentIndex >= 0 && currentIndex < fields.length - 1) {
        const nextField = fields[currentIndex + 1];
        
        setTimeout(() => {
          focusField(nextField.id);
        }, 100);
      }
    }
  }, [fields, focusField]);

  return {
    registerField,
    focusField,
    handleKeyDown,
    handleSelectKeyDown
  };
}

