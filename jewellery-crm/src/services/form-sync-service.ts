/**
 * Form Field Synchronization Service
 * 
 * This service handles data synchronization between related forms
 * ensuring consistency and proper field mapping across the application
 */

import {
  CustomerFormData,
  ProductFormData,
  DealFormData,
  AppointmentFormData,
  FormFieldMapping,
  FormSyncConfig
} from '@/types/form-models';

// ============================================================================
// FORM FIELD MAPPING CONFIGURATIONS
// ============================================================================

export const FORM_SYNC_CONFIGS: Record<string, FormSyncConfig[]> = {
  // Customer form syncs to other forms
  'customer': [
    {
      sourceForm: 'customer',
      targetForms: ['deal', 'appointment', 'escalation'],
      fieldMappings: [
        { sourceField: 'first_name', targetField: 'customer_name', transform: (val) => val },
        { sourceField: 'last_name', targetField: 'customer_name', transform: (val, prev) => `${prev || ''} ${val}`.trim() },
        { sourceField: 'phone', targetField: 'customer_phone' },
        { sourceField: 'email', targetField: 'customer_email' },
        { sourceField: 'id', targetField: 'client' },
        { sourceField: 'id', targetField: 'customer_id' },
        { sourceField: 'address', targetField: 'location' },
        { sourceField: 'city', targetField: 'location', transform: (val, prev) => `${prev || ''}, ${val}`.trim() },
        { sourceField: 'reason_for_visit', targetField: 'purpose' },
        { sourceField: 'summary_notes', targetField: 'notes' },
        { sourceField: 'next_follow_up', targetField: 'next_action_date' },
        { sourceField: 'pipeline_stage', targetField: 'stage' },
        { sourceField: 'budget_range', targetField: 'expected_value', transform: (val) => val.replace('-', ' - ₹') },
      ]
    }
  ],
  
  // Deal form syncs to customer form
  'deal': [
    {
      sourceForm: 'deal',
      targetForms: ['customer'],
      fieldMappings: [
        { sourceField: 'stage', targetField: 'pipeline_stage' },
        { sourceField: 'expected_value', targetField: 'budget_range' },
        { sourceField: 'next_action', targetField: 'next_follow_up' },
        { sourceField: 'next_action_date', targetField: 'next_follow_up_date' },
        { sourceField: 'notes', targetField: 'summary_notes' },
        { sourceField: 'probability', targetField: 'customer_status', transform: (val) => {
          const prob = parseInt(val);
          if (prob >= 80) return 'customer';
          if (prob >= 50) return 'prospect';
          return 'lead';
        }},
      ]
    }
  ],
  
  // Appointment form syncs to customer form
  'appointment': [
    {
      sourceForm: 'appointment',
      targetForms: ['customer'],
      fieldMappings: [
        { sourceField: 'purpose', targetField: 'reason_for_visit' },
        { sourceField: 'notes', targetField: 'summary_notes' },
        { sourceField: 'date', targetField: 'next_follow_up_date' },
        { sourceField: 'time', targetField: 'next_follow_up_time' },
        { sourceField: 'location', targetField: 'address' },
        { sourceField: 'status', targetField: 'customer_status', transform: (val) => {
          if (val === 'completed') return 'customer';
          if (val === 'scheduled') return 'prospect';
          return 'lead';
        }},
      ]
    }
  ]
};

// ============================================================================
// FORM SYNCHRONIZATION SERVICE
// ============================================================================

export class FormSyncService {
  private static instance: FormSyncService;
  private syncListeners: Map<string, ((data: any) => void)[]> = new Map();

  static getInstance(): FormSyncService {
    if (!FormSyncService.instance) {
      FormSyncService.instance = new FormSyncService();
    }
    return FormSyncService.instance;
  }

  /**
   * Sync form data from source to target forms
   */
  syncFormData(
    sourceFormType: string,
    sourceData: any,
    targetFormTypes: string[],
    excludeFields: string[] = []
  ): Record<string, any> {
    const syncResults: Record<string, any> = {};
    
    const configs = FORM_SYNC_CONFIGS[sourceFormType] || [];
    
    configs.forEach(config => {
      if (targetFormTypes.includes(config.sourceForm)) {
        config.targetForms.forEach(targetForm => {
          if (!targetFormTypes.includes(targetForm)) return;
          
          const mappedData = this.mapFields(
            sourceData,
            config.fieldMappings,
            excludeFields
          );
          
          syncResults[targetForm] = mappedData;
        });
      }
    });
    
    return syncResults;
  }

  /**
   * Map fields from source to target using field mappings
   */
  private mapFields(
    sourceData: any,
    fieldMappings: FormFieldMapping[],
    excludeFields: string[]
  ): any {
    const mappedData: any = {};
    
    fieldMappings.forEach(mapping => {
      if (excludeFields.includes(mapping.targetField)) return;
      
      const sourceValue = sourceData[mapping.sourceField];
      if (sourceValue === undefined || sourceValue === null) return;
      
      let targetValue = sourceValue;
      
      // Apply transformation if provided
      if (mapping.transform) {
        targetValue = mapping.transform(sourceValue, mappedData[mapping.targetField]);
      }
      
      // Handle field combination (e.g., first_name + last_name = customer_name)
      if (mappedData[mapping.targetField]) {
        mappedData[mapping.targetField] = targetValue;
      } else {
        mappedData[mapping.targetField] = targetValue;
      }
    });
    
    return mappedData;
  }

  /**
   * Subscribe to form sync events
   */
  subscribe(formType: string, callback: (data: any) => void): () => void {
    if (!this.syncListeners.has(formType)) {
      this.syncListeners.set(formType, []);
    }
    
    this.syncListeners.get(formType)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.syncListeners.get(formType);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Notify subscribers of form sync events
   */
  notify(formType: string, data: any): void {
    const listeners = this.syncListeners.get(formType);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Get field mappings for a specific form type
   */
  getFieldMappings(formType: string): FormFieldMapping[] {
    const configs = FORM_SYNC_CONFIGS[formType] || [];
    return configs.flatMap(config => config.fieldMappings);
  }

  /**
   * Validate field consistency across forms
   */
  validateFieldConsistency(
    formType: string,
    fieldName: string,
    value: any,
    relatedForms: string[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Get field mappings for this form type
    const mappings = this.getFieldMappings(formType);
    const relevantMappings = mappings.filter(m => m.sourceField === fieldName);
    
    // Check if field value is consistent with related forms
    relevantMappings.forEach(mapping => {
      if (relatedForms.includes(mapping.targetField.split('_')[0])) {
        // Add validation logic here
        // For now, just basic validation
        if (mapping.required && (!value || value.toString().trim() === '')) {
          errors.push(`${mapping.targetField} is required`);
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// ============================================================================
// FORM FIELD VALIDATION UTILITIES
// ============================================================================

export const FORM_VALIDATION_RULES = {
  customer: {
    first_name: { required: true, minLength: 2, maxLength: 50 },
    last_name: { required: false, maxLength: 50 },
    email: { required: false, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    phone: { required: true, pattern: /^\+?[1-9]\d{1,14}$/ },
    city: { required: false, maxLength: 100 },
    state: { required: false, maxLength: 100 },
    reason_for_visit: { required: false, maxLength: 200 },
    lead_source: { required: false, maxLength: 100 },
    summary_notes: { required: false, maxLength: 1000 },
  },
  
  product: {
    name: { required: true, minLength: 3, maxLength: 200 },
    sku: { required: true, minLength: 3, maxLength: 50 },
    price: { required: true, min: 0 },
    quantity: { required: true, min: 0 },
    category: { required: true },
    material: { required: false, maxLength: 100 },
    color: { required: false, maxLength: 50 },
  },
  
  deal: {
    title: { required: true, minLength: 3, maxLength: 200 },
    client: { required: true },
    expected_value: { required: true, min: 0 },
    probability: { required: true, min: 0, max: 100 },
    stage: { required: true },
    expected_close_date: { required: true },
  },
  
  appointment: {
    client: { required: true },
    date: { required: true },
    time: { required: true },
    purpose: { required: true, maxLength: 200 },
    location: { required: false, maxLength: 200 },
    duration: { required: true, min: 15, max: 480 }, // 15 minutes to 8 hours
  }
};

// ============================================================================
// FORM DATA TRANSFORMATION UTILITIES
// ============================================================================

export const FORM_TRANSFORMERS = {
  // Customer form transformers
  customer: {
    fullName: (data: CustomerFormData) => `${data.first_name} ${data.last_name}`.trim(),
    location: (data: CustomerFormData) => {
      const parts = [data.address, data.city, data.state].filter(Boolean);
      return parts.join(', ');
    },
    budgetRange: (data: CustomerFormData) => {
      if (data.budget_range) {
        return data.budget_range.replace('-', ' - ₹');
      }
      return '';
    }
  },
  
  // Deal form transformers
  deal: {
    customerName: (data: DealFormData) => data.customer_name || '',
    customerPhone: (data: DealFormData) => data.customer_phone || '',
    customerEmail: (data: DealFormData) => data.customer_email || '',
  },
  
  // Appointment form transformers
  appointment: {
    customerName: (data: AppointmentFormData) => data.customer_name || '',
    customerPhone: (data: AppointmentFormData) => data.customer_phone || '',
    customerEmail: (data: AppointmentFormData) => data.customer_email || '',
    durationText: (data: AppointmentFormData) => {
      const hours = Math.floor(data.duration / 60);
      const minutes = data.duration % 60;
      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else {
        return `${minutes}m`;
      }
    }
  }
};

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export const formSyncService = FormSyncService.getInstance();

// All exports are done individually above
