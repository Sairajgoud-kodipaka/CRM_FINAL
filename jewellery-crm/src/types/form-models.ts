/**
 * Unified Form Data Models
 *
 * This file contains standardized interfaces for all form types
 * ensuring consistency across the application and proper data synchronization
 */

// ============================================================================
// CORE FIELD INTERFACES
// ============================================================================

export interface CustomerCoreFields {
  // Basic Information
  first_name: string;
  last_name: string;
  email: string;
  phone: string;

  // Address Information
  address: string;
  city: string;
  state: string;
  country: string;
  catchment_area: string;
  pincode: string;

  // Demographics
  date_of_birth: string;
  anniversary_date: string;
  age_of_end_user: string;
  community: string;
  mother_tongue: string;

  // Business Information
  reason_for_visit: string;
  lead_source: string;
  saving_scheme: string;
  status: string;
  customer_type: string;

  // Assignment & Management
  assigned_to: string;
  sales_person: string;

  // Notes & Additional Info
  summary_notes: string;
  next_follow_up: string;
}

export interface ProductCoreFields {
  // Basic Information
  name: string;
  sku: string;
  description: string;
  category: string;

  // Pricing
  price: number;
  discount_percentage: number;
  price_after_discount: number;

  // Inventory Management
  quantity: number;
  min_quantity: number;
  max_quantity: number;

  // Physical Properties
  weight: number;
  dimensions: string;
  material: string;
  color: string;
  size: string;

  // Status & Features
  status: string;
  is_featured: boolean;
  is_bestseller: boolean;
}

export interface PipelineCoreFields {
  // Deal Information
  title: string;
  client: string; // Customer ID reference
  expected_value: string;
  probability: string;
  stage: string;
  expected_close_date: string;

  // Actions & Follow-up
  next_action: string;
  next_action_date: string;
  notes: string;

  // Computed Fields (from Customer)
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
}

export interface AppointmentCoreFields {
  // Basic Information
  client: string; // Customer ID reference
  date: string;
  time: string;
  duration: number;
  purpose: string;
  location: string;
  notes: string;

  // Status & Outcome
  status: string;
  outcome: string;

  // Computed Fields (from Customer)
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
}

export interface AnnouncementCoreFields {
  // Basic Information
  title: string;
  content: string;
  type: string;

  // Targeting
  target_audience: string;
  target_stores: string[];
  target_roles: string[];

  // Scheduling
  scheduled_at: string;
  expires_at: string;

  // Status
  status: string;
  priority: string;
}

export interface EscalationCoreFields {
  // Basic Information
  title: string;
  description: string;
  priority: string;
  status: string;

  // References
  customer_id: string;
  assigned_to: string;

  // Computed Fields (from Customer)
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
}

// ============================================================================
// FORM DATA INTERFACES (Extended with UI-specific fields)
// ============================================================================

export interface CustomerFormData extends CustomerCoreFields {
  // UI-specific computed fields
  fullName: string; // first_name + last_name

  // Interest & Preferences
  customer_interests: ProductInterest[];
  customer_preferences: string;
  design_selected: boolean;
  wants_discount: boolean;
  checking_others: boolean;

  // Pipeline Integration
  pipeline_stage: string;
  budget_range: string;
  appointment_type: string;

  // Material & Product Preferences
  product_type: string;
  style: string;
  material_type: string;
  material_weight: number;
  material_value: number;

  // Weight & Design
  selected_weight: number;
  weight_unit: string;
  design_number: string;

  // Follow-up
  add_to_pipeline: boolean;
  next_follow_up_date: string;
  next_follow_up_time: string;
}

export interface ProductFormData extends ProductCoreFields {
  // UI-specific fields
  main_image?: File;
  additional_images?: File[];
  show_quantity_details: boolean;
}

export interface DealFormData extends PipelineCoreFields {
  // UI-specific fields
  client_options: Array<{id: string, name: string}>;
}

export interface AppointmentFormData extends AppointmentCoreFields {
  // UI-specific fields
  client_options: Array<{id: string, name: string}>;
  reschedule_data?: {
    new_date: string;
    new_time: string;
    reason: string;
  };
  cancel_reason?: string;
}

// ============================================================================
// INTEREST & PREFERENCE INTERFACES
// ============================================================================

export interface ProductInterest {
  mainCategory: string;
  products: Array<{
    product: string;
    revenue: string;
  }>;
  preferences: {
    designSelected: boolean;
    wantsDiscount: boolean;
    checkingOthers: boolean;
    lessVariety: boolean;
    purchased: boolean;
    other: string;
  };
}

// ============================================================================
// FORM FIELD MAPPING UTILITIES
// ============================================================================

export interface FormFieldMapping {
  sourceField: string;
  targetField: string;
  transform?: (value: any) => any;
  required?: boolean;
}

export interface FormSyncConfig {
  sourceForm: string;
  targetForms: string[];
  fieldMappings: FormFieldMapping[];
}

// ============================================================================
// FORM VALIDATION INTERFACES
// ============================================================================

export interface FormValidationRule {
  field: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface FormValidationConfig {
  formType: string;
  rules: FormValidationRule[];
}

// ============================================================================
// FORM STATE INTERFACES
// ============================================================================

export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface FormAction<T> {
  type: 'SET_FIELD' | 'SET_ERRORS' | 'RESET_FORM' | 'SET_SUBMITTING';
  payload: Partial<T> | Record<string, string> | boolean;
}

// ============================================================================
// EXPORT ALL INTERFACES
// ============================================================================

// All exports are done individually above
