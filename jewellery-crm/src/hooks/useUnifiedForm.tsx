/**
 * Unified Form Hook
 * 
 * This hook provides consistent form management across all form types
 * with built-in validation, synchronization, and state management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { formSyncService, FORM_VALIDATION_RULES, FORM_TRANSFORMERS } from '@/services/form-sync-service';
import {
  CustomerFormData,
  ProductFormData,
  DealFormData,
  AppointmentFormData,
  FormState,
  FormValidationRule
} from '@/types/form-models';

// ============================================================================
// FORM HOOK CONFIGURATION
// ============================================================================

export interface FormHookConfig<T> {
  formType: string;
  initialData: T;
  validationRules?: FormValidationRule[];
  syncWithForms?: string[];
  excludeSyncFields?: string[];
  onSync?: (data: T) => void;
  onSubmit?: (data: T) => Promise<void>;
  onReset?: () => void;
}

// ============================================================================
// FORM HOOK RETURN TYPE
// ============================================================================

export interface FormHookReturn<T> {
  // Form state
  formData: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  
  // Form actions
  setField: (field: keyof T, value: any) => void;
  setFields: (fields: Partial<T>) => void;
  setError: (field: keyof T, error: string) => void;
  setTouched: (field: keyof T, touched: boolean) => void;
  validateField: (field: keyof T) => boolean;
  validateForm: () => boolean;
  resetForm: () => void;
  submitForm: () => Promise<void>;
  
  // Sync actions
  syncToForms: (targetForms: string[]) => void;
  syncFromForm: (sourceFormType: string, sourceData: any) => void;
  
  // Computed fields
  computedFields: Record<string, any>;
}

// ============================================================================
// UNIFIED FORM HOOK
// ============================================================================

export function useUnifiedForm<T extends Record<string, any>>(
  config: FormHookConfig<T>
): FormHookReturn<T> {
  const {
    formType,
    initialData,
    validationRules = [],
    syncWithForms = [],
    excludeSyncFields = [],
    onSync,
    onSubmit,
    onReset
  } = config;

  // Form state
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Get validation rules for this form type
  const formValidationRules = useMemo(() => {
    const rules = FORM_VALIDATION_RULES[formType] || {};
    return Object.entries(rules).map(([field, rule]) => ({
      field,
      ...rule
    }));
  }, [formType]);

  // All validation rules (form-specific + custom)
  const allValidationRules = useMemo(() => [
    ...formValidationRules,
    ...validationRules
  ], [formValidationRules, validationRules]);

  // Computed fields
  const computedFields = useMemo(() => {
    const transformers = FORM_TRANSFORMERS[formType] || {};
    const computed: Record<string, any> = {};
    
    Object.entries(transformers).forEach(([field, transformer]) => {
      computed[field] = transformer(formData);
    });
    
    return computed;
  }, [formType, formData]);

  // Form validation
  const validateField = useCallback((field: keyof T): boolean => {
    const fieldRules = allValidationRules.filter(rule => rule.field === field);
    if (fieldRules.length === 0) return true;

    const value = formData[field];
    const fieldErrors: string[] = [];

    fieldRules.forEach(rule => {
      // Required validation
      if (rule.required && (!value || value.toString().trim() === '')) {
        fieldErrors.push(`${field} is required`);
      }

      // Length validation
      if (value && typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          fieldErrors.push(`${field} must be at least ${rule.minLength} characters`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          fieldErrors.push(`${field} must be no more than ${rule.maxLength} characters`);
        }
      }

      // Numeric validation
      if (value && typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          fieldErrors.push(`${field} must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && value > rule.max) {
          fieldErrors.push(`${field} must be no more than ${rule.max}`);
        }
      }

      // Pattern validation
      if (value && rule.pattern && !rule.pattern.test(value.toString())) {
        fieldErrors.push(`${field} format is invalid`);
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value);
        if (customResult !== true) {
          fieldErrors.push(typeof customResult === 'string' ? customResult : `${field} is invalid`);
        }
      }
    });

    const isValid = fieldErrors.length === 0;
    setErrors(prev => ({
      ...prev,
      [field]: fieldErrors[0] || ''
    }));

    return isValid;
  }, [formData, allValidationRules]);

  const validateForm = useCallback((): boolean => {
    const fields = Object.keys(formData) as (keyof T)[];
    const validationResults = fields.map(field => validateField(field));
    return validationResults.every(result => result);
  }, [formData, validateField]);

  // Form actions
  const setField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear error when field is updated
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));
  }, [errors]);

  const setFields = useCallback((fields: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...fields }));
    setIsDirty(true);
    
    // Clear errors for updated fields
    const updatedFields = Object.keys(fields);
    setErrors(prev => {
      const newErrors = { ...prev };
      updatedFields.forEach(field => {
        if (newErrors[field]) {
          newErrors[field] = '';
        }
      });
      return newErrors;
    });
    
    // Mark fields as touched
    setTouched(prev => {
      const newTouched = { ...prev };
      updatedFields.forEach(field => {
        newTouched[field] = true;
      });
      return newTouched;
    });
  }, []);

  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const setTouched = useCallback((field: keyof T, touched: boolean) => {
    setTouched(prev => ({ ...prev, [field]: touched }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
    setIsDirty(false);
    setIsSubmitting(false);
    onReset?.();
  }, [initialData, onReset]);

  const submitForm = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit?.(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit]);

  // Sync actions
  const syncToForms = useCallback((targetForms: string[]) => {
    const syncResults = formSyncService.syncFormData(
      formType,
      formData,
      targetForms,
      excludeSyncFields
    );
    
    Object.entries(syncResults).forEach(([targetForm, syncData]) => {
      formSyncService.notify(targetForm, syncData);
    });
    
    onSync?.(formData);
  }, [formType, formData, excludeSyncFields, onSync]);

  const syncFromForm = useCallback((sourceFormType: string, sourceData: any) => {
    const syncResults = formSyncService.syncFormData(
      sourceFormType,
      sourceData,
      [formType],
      excludeSyncFields
    );
    
    if (syncResults[formType]) {
      setFields(syncResults[formType]);
    }
  }, [formType, excludeSyncFields, setFields]);

  // Subscribe to sync events
  useEffect(() => {
    const unsubscribe = formSyncService.subscribe(formType, (syncData: any) => {
      setFields(syncData);
    });

    return unsubscribe;
  }, [formType, setFields]);

  // Form validity
  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error) && 
           Object.keys(formData).length > 0;
  }, [errors, formData]);

  return {
    // Form state
    formData,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    
    // Form actions
    setField,
    setFields,
    setError,
    setTouched,
    validateField,
    validateForm,
    resetForm,
    submitForm,
    
    // Sync actions
    syncToForms,
    syncFromForm,
    
    // Computed fields
    computedFields
  };
}

// ============================================================================
// SPECIALIZED FORM HOOKS
// ============================================================================

export function useCustomerForm(initialData: CustomerFormData, config?: Partial<FormHookConfig<CustomerFormData>>) {
  return useUnifiedForm<CustomerFormData>({
    formType: 'customer',
    initialData,
    syncWithForms: ['deal', 'appointment', 'escalation'],
    ...config
  });
}

export function useProductForm(initialData: ProductFormData, config?: Partial<FormHookConfig<ProductFormData>>) {
  return useUnifiedForm<ProductFormData>({
    formType: 'product',
    initialData,
    ...config
  });
}

export function useDealForm(initialData: DealFormData, config?: Partial<FormHookConfig<DealFormData>>) {
  return useUnifiedForm<DealFormData>({
    formType: 'deal',
    initialData,
    syncWithForms: ['customer'],
    ...config
  });
}

export function useAppointmentForm(initialData: AppointmentFormData, config?: Partial<FormHookConfig<AppointmentFormData>>) {
  return useUnifiedForm<AppointmentFormData>({
    formType: 'appointment',
    initialData,
    syncWithForms: ['customer'],
    ...config
  });
}

// ============================================================================
// FORM FIELD COMPONENTS
// ============================================================================

export interface FormFieldProps<T> {
  field: keyof T;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'time' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  form: FormHookReturn<T>;
  className?: string;
}

export function FormField<T extends Record<string, any>>({
  field,
  label,
  type = 'text',
  placeholder,
  required = false,
  options = [],
  form,
  className = ''
}: FormFieldProps<T>) {
  const { formData, errors, touched, setField, setTouched } = form;
  const hasError = touched[field] && errors[field];
  
  const handleChange = (value: any) => {
    setField(field, value);
  };

  const handleBlur = () => {
    setTouched(field, true);
  };

  return (
    <div className={`form-field ${className}`}>
      <label className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {type === 'textarea' ? (
        <textarea
          value={formData[field] || ''}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full p-2 border rounded-md ${hasError ? 'border-red-500' : 'border-gray-300'}`}
        />
      ) : type === 'select' ? (
        <select
          value={formData[field] || ''}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className={`w-full p-2 border rounded-md ${hasError ? 'border-red-500' : 'border-gray-300'}`}
        >
          <option value="">Select {label}</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={formData[field] || ''}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full p-2 border rounded-md ${hasError ? 'border-red-500' : 'border-gray-300'}`}
        />
      )}
      
      {hasError && (
        <p className="text-red-500 text-sm mt-1">{errors[field]}</p>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

// All exports are done individually above
