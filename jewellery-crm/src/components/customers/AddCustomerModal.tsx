"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PhoneInputComponent } from "@/components/ui/phone-input";
import { apiService } from "@/lib/api-service";
import { 
  INDIAN_CITIES, 
  INDIAN_STATES, 
  INDIAN_CATCHMENT_AREAS,
  REASONS_FOR_VISIT,
  CUSTOMER_STATUSES,
  LEAD_SOURCES,
  SAVING_SCHEMES,
  CUSTOMER_INTERESTS,
  PRODUCT_TYPES,
  STYLES,
  PIPELINE_STAGES,
  BUDGET_RANGES,
  APPOINTMENT_TYPES,
  CUSTOMER_TYPES,
  getStateFromCity,
  getPincodeFromCatchment,
  getCatchmentAreasForCity,
  lockField,
  unlockField,
  isFieldLocked
} from "@/constants/indian-data";
import { Slider } from "@/components/ui/slider";
import { WeightRangeSlider } from "@/components/ui/weight-range-slider";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from 'lucide-react';

interface AddCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: any) => void;
}

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  birthDate: string;
  anniversaryDate: string;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  catchmentArea: string;
  pincode: string;
  salesPerson: string;
  reasonForVisit: string;
  customerStatus: string;
  leadSource: string;
  savingScheme: string;
  customerInterests: string[];

  customerPreferences: string;
  designSelected: string;
  wantsMoreDiscount: string;
  checkingOtherJewellers: string;
  letHimVisit: string;
  productType: string;
  style: string;

  selectedWeight: number;
  weightUnit: string;
  customerPreference: string;
  designNumber: string;
  nextFollowUpDate: string;
  nextFollowUpTime: string;
  summaryNotes: string;
  
  // High Priority Fields - Pipeline & Purchase Management
  pipelineStage: string;
  budgetRange: string;
  appointmentType: string;
  
  // Customer Classification & Assignment
  customerType: string;
}

interface ProductInterest {
  products: { product: string; revenue: string }[];
  preferences: {
    designSelected: boolean;
    wantsDiscount: boolean;
    checkingOthers: boolean;
    lessVariety: boolean;
    other: string;
  };
}

interface AutofillLog {
  fieldName: string;
  sourceDataset: string;
  timestamp: string;
  userId: string;
  originalValue: string;
  newValue: string;
}

export function AddCustomerModal({ open, onClose, onCustomerCreated }: AddCustomerModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Form state with strict typing
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    phone: "",
    email: "",
    birthDate: "",
    anniversaryDate: "",
    streetAddress: "",
    city: "",
    state: "",
    country: "India",
    catchmentArea: "",
    pincode: "",
    salesPerson: "",
    reasonForVisit: "",
    customerStatus: "",
    leadSource: "",
    savingScheme: "Inactive",
    customerInterests: [],

    customerPreferences: "",
    designSelected: "Modern",
    wantsMoreDiscount: "No",
    checkingOtherJewellers: "No",
    letHimVisit: "No",
    productType: "",
    style: "",
    selectedWeight: 3.5,
    weightUnit: "g",
    customerPreference: "",
    designNumber: "",
    nextFollowUpDate: "",
    nextFollowUpTime: "10:00",
    summaryNotes: "",
    
    // High Priority Fields - Pipeline & Purchase Management
    pipelineStage: "interested",
    budgetRange: "0-50000",
    appointmentType: "In-Person",
    
    // Customer Classification & Assignment
    customerType: "individual",
  });

  // State for field locking (autofill enforcement)
  const [lockedFields, setLockedFields] = useState<Set<string>>(new Set());
  
  // State for API data
  const [salesPersons, setSalesPersons] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for products data
  const [products, setProducts] = useState<any[]>([
    // Initial sample products to ensure field is always populated
    { id: 1, name: "Gold Chain Necklace", category: "Necklaces", price: 45000, weight: 3.5 },
    { id: 2, name: "Diamond Ring", category: "Rings", price: 75000, weight: 2.8 },
    { id: 3, name: "Pearl Earrings", category: "Earrings", price: 25000, weight: 1.2 },
    { id: 4, name: "Silver Bracelet", category: "Bracelets", price: 18000, weight: 4.0 },
    { id: 5, name: "Platinum Pendant", category: "Pendants", price: 95000, weight: 1.8 },
    { id: 6, name: "Ruby Necklace", category: "Necklaces", price: 65000, weight: 2.5 },
    { id: 7, name: "Emerald Ring", category: "Rings", price: 55000, weight: 3.2 },
    { id: 8, name: "Sapphire Earrings", category: "Earrings", price: 35000, weight: 1.5 }
  ]);
  const [productsLoading, setProductsLoading] = useState(false);
  
  // Debug: Log products state changes
  useEffect(() => {
    // Products state updated
  }, [products]);
  
  // Debug: Log when component renders
  useEffect(() => {
    // Component rendered
  });
  
  // State for categories data
  const [categories, setCategories] = useState<any[]>([]);
  
  // State for selected product
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // State for interests
      const [interests, setInterests] = useState<ProductInterest[]>([
      {
        products: [{ product: "", revenue: "" }],
        preferences: {
          designSelected: false,
          wantsDiscount: false,
          checkingOthers: false,
          lessVariety: false,
          other: "",
        },
      },
    ]);
  
  // State for existing customer check
  const [existingCustomerInfo, setExistingCustomerInfo] = useState<{
    name: string;
    phone: string;
    status: string;
    email: string;
  } | null>(null);

  // State for autofill audit trail
  const [autofillLogs, setAutofillLogs] = useState<AutofillLog[]>([]);

  // Role-based salesperson field configuration
  const ROLE_CONFIG = {
    'inhouse_sales': { fieldType: 'locked', dataScope: 'self', canOverride: false },
    'tele_calling': { fieldType: 'locked', dataScope: 'self', canOverride: false },
    'manager': { fieldType: 'dropdown', dataScope: 'team', canOverride: true },
    'business_admin': { fieldType: 'dropdown', dataScope: 'tenant', canOverride: true },
    'platform_admin': { fieldType: 'dropdown', dataScope: 'global', canOverride: true }
  };

  // Role-aware field state management
  const [fieldState, setFieldState] = useState<{
    type: 'locked' | 'dropdown';
    options: any[];
    value: string;
    locked: boolean;
  }>({ type: 'locked', options: [], value: '', locked: true });

  // Assignment audit trail
  const [assignmentAudit, setAssignmentAudit] = useState<{
    assignedByUserId: number;
    assignedByRole: string;
    assignedToUserId: number;
    assignedToName: string;
    assignmentType: 'self' | 'manager' | 'admin';
    assignmentScope: 'self' | 'team' | 'tenant' | 'global';
    timestamp: string;
    overrideReason?: string;
    teamViolation?: boolean;
  } | null>(null);

  // Helper function to suggest alternative emails
  const suggestAlternativeEmails = (email: string) => {
    const [base, domain] = email.split('@');
    if (!domain) return [];
    
    return [
      `${base}1@${domain}`,
      `${base}2@${domain}`,
      `${base}_new@${domain}`,
      `${base}2024@${domain}`
    ];
  };

  // Check if customer exists before submitting
  const checkCustomerExists = async (email: string) => {
    if (!email) return null;
    
    try {
      // This would need to be implemented in the API service
      // For now, we'll just return null
      return null;
    } catch (error) {
      console.error('Error checking customer existence:', error);
      return null;
    }
  };

  // Ensure selectedWeight is always a number
  useEffect(() => {
    if (typeof formData.selectedWeight !== 'number' || isNaN(formData.selectedWeight)) {
      console.warn('Invalid selectedWeight detected, fixing:', formData.selectedWeight);
      setFormData(prev => ({
        ...prev,
        selectedWeight: Number(prev.selectedWeight) || 3.5
      }));
    }
  }, [formData.selectedWeight]);

  // Deterministic autofill logic for City -> State with contextual catchment filtering
  const handleCitySelection = (city: string) => {
    const state = getStateFromCity(city);
    
    if (state) {
      setFormData(prev => ({ 
        ...prev, 
        city, 
        state,
        // Clear catchment area and pincode when city changes
        catchmentArea: "",
        pincode: ""
      }));
      
      // Lock the state field after autofill
      setLockedFields(prev => lockField('state', prev));
      
      // Unlock catchment area and pincode fields for new selection
      setLockedFields(prev => unlockField('catchmentArea', unlockField('pincode', prev)));
      
      // Log the autofill action
      const autofillLog: AutofillLog = {
        fieldName: 'state',
        sourceDataset: 'CITY_STATE_MAP',
        timestamp: new Date().toISOString(),
        userId: 'current_user', // This should come from auth context
        originalValue: formData.state,
        newValue: state
      };
      setAutofillLogs(prev => [...prev, autofillLog]);
      
      // Log catchment area filtering
      const catchmentAreas = getCatchmentAreasForCity(city);
      const catchmentFilterLog: AutofillLog = {
        fieldName: 'catchmentArea',
        sourceDataset: 'CITY_CATCHMENT_MAP',
        timestamp: new Date().toISOString(),
        userId: 'current_user',
        originalValue: `${formData.catchmentArea} (previous selection)`,
        newValue: `${catchmentAreas.length} filtered options for ${city}`
      };
      setAutofillLogs(prev => [...prev, catchmentFilterLog]);
      
      toast({
        title: "City Selection Updated",
        description: `State set to ${state}. ${catchmentAreas.length} catchment areas available for ${city}.`,
        variant: "default",
      });
    } else {
      setFormData(prev => ({ 
        ...prev, 
        city, 
        state: "",
        catchmentArea: "",
        pincode: ""
      }));
      
      // Unlock state field if city doesn't have mapping
      setLockedFields(prev => unlockField('state', prev));
      
      toast({
        title: "City Selected",
        description: `City "${city}" selected. Please manually select state and catchment area.`,
        variant: "default",
      });
    }
  };

  // Deterministic autofill logic for Catchment Area -> Pincode
  const handleCatchmentSelection = (catchmentArea: string) => {
    const pincode = getPincodeFromCatchment(catchmentArea);
    if (pincode) {
      setFormData(prev => ({ ...prev, catchmentArea, pincode }));
      
      // Lock the pincode field after autofill
      setLockedFields(prev => lockField('pincode', prev));
      
      // Log the autofill action
      const autofillLog: AutofillLog = {
        fieldName: 'pincode',
        sourceDataset: 'CATCHMENT_PINCODE_MAP',
        timestamp: new Date().toISOString(),
        userId: 'current_user', // This should come from auth context
        originalValue: formData.pincode,
        newValue: pincode
      };
      setAutofillLogs(prev => [...prev, autofillLog]);
      
      toast({
        title: "Pincode Auto-filled",
        description: `Pincode automatically set to ${pincode} based on selected catchment area.`,
        variant: "default",
      });
    } else {
      setFormData(prev => ({ ...prev, catchmentArea, pincode: "" }));
      // Unlock pincode field if catchment area doesn't have mapping
      setLockedFields(prev => unlockField('pincode', prev));
    }
  };

  // Handle multi-select for customer interests
  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      customerInterests: prev.customerInterests.includes(interest)
        ? prev.customerInterests.filter(i => i !== interest)
        : [...prev.customerInterests, interest]
    }));
  };

  // Handle form input changes with validation
  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear existing customer info when email changes
    if (field === 'email') {
      setExistingCustomerInfo(null);
    }
  };

  // Validate form before submission
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!formData.fullName.trim()) {
      errors.push("Full Name is required");
    }
    
    if (!formData.phone.trim()) {
      errors.push("Phone Number is required");
    }
    
    if (!formData.city) {
      errors.push("City is required");
    }
    
    if (!formData.state) {
      errors.push("State is required");
    }
    
    if (!formData.catchmentArea) {
      errors.push("Catchment Area is required");
    }
    
    if (!formData.pincode) {
      errors.push("Pincode is required");
    }
    
    // Sales person validation - hybrid approach
    if (user?.role !== 'inhouse_sales' && user?.role !== 'tele_calling' && !formData.salesPerson) {
      errors.push("Sales Person is required for managers and admins");
    }
    
    if (!formData.reasonForVisit) {
      errors.push("Reason for Visit is required");
    }
    
    if (!formData.customerStatus) {
      errors.push("Customer Status is required");
    }
    
    if (!formData.leadSource) {
      errors.push("Lead Source is required");
    }
    
    if (!formData.savingScheme) {
      errors.push("Monthly Saving Scheme is required");
    }
    
    // Customer Interests validation removed - now handled by Product Interests structure
    
    if (!formData.productType) {
      errors.push("Product Type is required");
    }
    
    if (!formData.style) {
      errors.push("Style is required");
    }
    

    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Auto-create sales pipeline entry when customer is created
  const createAutoPipelineEntry = async (customerData: any) => {
    try {
      console.log('🚀 Creating auto pipeline entry for customer:', customerData);
      
      // Determine pipeline stage based on customer status and lead source
      let pipelineStage = 'interested'; // Default stage
      let probability = 20; // Default probability
      
      if (formData.leadSource === 'exhibition') {
        pipelineStage = 'exhibition';
        probability = 5;
      } else if (formData.leadSource === 'social_media') {
        pipelineStage = 'social_media';
        probability = 10;
      } else if (formData.customerStatus === 'lead') {
        pipelineStage = 'interested';
        probability = 20;
      } else if (formData.customerStatus === 'prospect') {
        pipelineStage = 'store_walkin';
        probability = 30;
      }
      
      // Calculate expected value from product interests
      let expectedValue = 0;
      if (interests && interests.length > 0) {
        expectedValue = interests.reduce((total, interest) => {
          const revenue = parseFloat(interest.products?.[0]?.revenue || '0') || 0;
          return total + revenue;
        }, 0);
      }
      
      // If no expected value from interests, use budget range
      if (expectedValue === 0 && formData.budgetRange) {
        const budgetRanges: { [key: string]: number } = {
          '0-50000': 25000,
          '50000-100000': 75000,
          '100000-200000': 150000,
          '200000-500000': 350000,
          '500000+': 750000
        };
        expectedValue = budgetRanges[formData.budgetRange] || 50000;
      }
      
      // Create pipeline data
      const pipelineData = {
        title: `${customerData.first_name} ${customerData.last_name} - ${formData.productType || 'Jewelry'}`,
        client_id: customerData.id,
        stage: pipelineStage,
        probability: probability,
        expected_value: expectedValue,
        notes: `Auto-created pipeline entry for new customer. Lead source: ${formData.leadSource || 'Unknown'}. Customer status: ${formData.customerStatus || 'Unknown'}.`,
        next_action: formData.nextFollowUpDate ? `Follow up on ${formData.nextFollowUpDate}` : 'Schedule follow-up call',
        next_action_date: formData.nextFollowUpDate ? new Date(formData.nextFollowUpDate).toISOString() : undefined
      };
      
      console.log('🎯 Creating pipeline with data:', pipelineData);
      
      // Call API to create pipeline
      const pipelineResponse = await apiService.createSalesPipeline(pipelineData);
      
      if (pipelineResponse.success) {
        console.log('✅ Auto pipeline entry created successfully:', pipelineResponse.data);
      } else {
        console.error('❌ Failed to create auto pipeline entry:', pipelineResponse);
      }
      
    } catch (error) {
      console.error('💥 Error creating auto pipeline entry:', error);
      throw error; // Re-throw to be caught by the calling function
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Ensure selectedWeight is a valid number before submission
      if (typeof formData.selectedWeight !== 'number' || isNaN(formData.selectedWeight)) {
        console.warn('Fixing invalid selectedWeight before submission:', formData.selectedWeight);
        setFormData(prev => ({
          ...prev,
          selectedWeight: Number(prev.selectedWeight) || 3.5
        }));
      }
      
      // Validate form
      const validation = validateForm();
      if (!validation.isValid) {
        toast({
          title: "Validation Error",
          description: `Please fix the following errors:\n${validation.errors.join('\n')}`,
          variant: "destructive",
        });
        return;
      }
      
              // Submitting customer data
      
      // Format dates properly for API
      const formatDateForAPI = (dateString: string) => {
        if (!dateString) return undefined;
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return undefined;
          return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
        } catch (error) {
          console.warn('Invalid date format:', dateString);
          return undefined;
        }
      };
      
      // Clean string fields - return empty string for empty values instead of undefined
      const cleanStringField = (value: string) => {
        return value && value.trim() ? value.trim() : '';
      };
      
      // Create assignment audit trail with enhanced tracking
      const assignmentAudit = {
        assignedByUserId: user?.id || 0,
        assignedByRole: user?.role || 'unknown',
        assignedToUserId: user?.role === 'inhouse_sales' || user?.role === 'tele_calling' ? user?.id || 0 : 0, // Will be set based on selection
        assignedToName: user?.role === 'inhouse_sales' || user?.role === 'tele_calling' ? user?.name || 'Auto-assigned' : formData.salesPerson,
        assignmentType: (user?.role === 'inhouse_sales' || user?.role === 'tele_calling' ? 'self' : 
                       user?.role === 'manager' ? 'manager' : 'admin') as 'self' | 'manager' | 'admin',
        assignmentScope: (user?.role === 'inhouse_sales' || user?.role === 'tele_calling' ? 'self' : 
                         user?.role === 'manager' ? 'team' : 
                         user?.role === 'business_admin' ? 'tenant' : 'global') as 'self' | 'team' | 'tenant' | 'global',
        timestamp: new Date().toISOString(),
        overrideReason: user?.role === 'inhouse_sales' || user?.role === 'tele_calling' ? undefined : 'Role-based override',
        teamViolation: false, // Will be checked for managers
        // Enhanced audit metadata for compliance
        userTenant: user?.tenant || null,
        userStore: user?.store || null,
        assignmentMethod: user?.role === 'inhouse_sales' || user?.role === 'tele_calling' ? 'automatic' : 'manual',
        availableOptions: salesPersons.length,
        roleBasedFiltering: true,
        complianceStatus: 'compliant'
      };

      // Prepare customer data
      const customerData = {
        first_name: formData.fullName.split(' ')[0] || formData.fullName,
        last_name: formData.fullName.split(' ').slice(1).join(' ') || '',
        email: cleanStringField(formData.email),
        phone: formData.phone,
        address: cleanStringField(formData.streetAddress),
        city: formData.city,
        state: formData.state,
        country: formData.country,
        date_of_birth: formatDateForAPI(formData.birthDate),
        anniversary_date: formatDateForAPI(formData.anniversaryDate),
        catchment_area: formData.catchmentArea,
        pincode: formData.pincode,
        sales_person: user?.role === 'inhouse_sales' || user?.role === 'tele_calling' ? user?.name : formData.salesPerson,
        reason_for_visit: formData.reasonForVisit,
        customer_status: formData.customerStatus,
        lead_source: formData.leadSource,
        saving_scheme: formData.savingScheme,
        customer_interests: formData.customerInterests,
        customer_interests_input: interests.map(interest => JSON.stringify(interest)),

        customer_preferences: cleanStringField(formData.customerPreferences),
        design_selected: formData.designSelected,
        wants_more_discount: formData.wantsMoreDiscount,
        checking_other_jewellers: formData.checkingOtherJewellers,
        let_him_visit: formData.letHimVisit,
        product_type: formData.productType,
        style: formData.style,

        customer_preference: cleanStringField(formData.customerPreference),
        design_number: cleanStringField(formData.designNumber),
        next_follow_up: formatDateForAPI(formData.nextFollowUpDate),
        next_follow_up_time: formData.nextFollowUpTime,
        summary_notes: cleanStringField(formData.summaryNotes),
        autofill_audit_trail: autofillLogs, // Include audit trail
        assignment_audit: assignmentAudit, // Include assignment audit
      };

      // Remove undefined values to avoid sending them to API
      const cleanedCustomerData = Object.fromEntries(
        Object.entries(customerData).filter(([_, value]) => value !== undefined)
      );

              // Sending customer data to API
      
      // Call API to create customer
      const response = await apiService.createClient(cleanedCustomerData);
      
      // Check if API call succeeded AND no business logic errors
      if (response.success && !response.errors && response.data) {
        // Customer created successfully
        
        // Log assignment override for audit trail
        if (assignmentAudit.assignmentType !== 'self') {
          try {
            await apiService.logAssignmentOverride(assignmentAudit);
          } catch (error) {
            console.error('Failed to log assignment override:', error);
          }
        }
        
        // Auto-create sales pipeline entry
        try {
          await createAutoPipelineEntry(response.data);
        } catch (error) {
          console.error('Failed to create auto pipeline entry:', error);
          // Don't fail the customer creation if pipeline creation fails
        }
        
        toast({
          title: "Success!",
          description: `Customer added successfully! ${assignmentAudit.assignmentType === 'self' ? 'Auto-assigned to you.' : `Assigned to ${assignmentAudit.assignedToName}.`}`,
          variant: "success",
        });
        
        // Call the callback with the created customer data
        if (typeof onCustomerCreated === 'function') {
          console.log('📞 Calling onCustomerCreated with data:', response.data);
          onCustomerCreated(response.data);
        } else {
          console.warn('onCustomerCreated callback not provided');
        }
        
        onClose();
        // Reset form
        setFormData({
          fullName: "",
          phone: "",
          email: "",
          birthDate: "",
          anniversaryDate: "",
          streetAddress: "",
          city: "",
          state: "",
          country: "India",
          catchmentArea: "",
          pincode: "",
          salesPerson: "",
          reasonForVisit: "",
          customerStatus: "",
          leadSource: "",
          savingScheme: "Inactive",
          customerInterests: [],
    
          customerPreferences: "",
          designSelected: "",
          wantsMoreDiscount: "",
          checkingOtherJewellers: "",
          letHimVisit: "",
          productType: "",
          style: "",
          selectedWeight: 3.5,
          weightUnit: "g",
          customerPreference: "",
          designNumber: "",
          nextFollowUpDate: "",
          nextFollowUpTime: "10:00",
          summaryNotes: "",
          
          // High Priority Fields - Pipeline & Purchase Management
          pipelineStage: "interested",
          budgetRange: "0-50000",
          appointmentType: "In-Person",
          
          // Customer Classification & Assignment
          customerType: "individual",
        });
        setInterests([{
          products: [{ product: "", revenue: "" }],
          preferences: {
            designSelected: false,
            wantsDiscount: false,
            checkingOthers: false,
            lessVariety: false,
            other: "",
          },
        }]);
        setLockedFields(new Set());
        setAutofillLogs([]);
      } else {
        console.error('Failed to create customer:', response);
        
        // Handle specific error cases
        if (response.errors && response.errors.email) {
          // Handle duplicate email error
          const emailError = response.errors.email[0];
          if (emailError.includes('already exists')) {
            toast({
              title: "Duplicate Customer",
              description: emailError,
              variant: "warning",
            });
          } else {
            toast({
              title: "Email Error",
              description: emailError,
              variant: "destructive",
            });
          }
        } else if (response.message) {
          toast({
            title: "Error",
            description: `Failed to add customer: ${response.message}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to add customer. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error('Error creating customer:', error);
      
      if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
        if (error.message.includes('email')) {
          const suggestions = suggestAlternativeEmails(formData.email);
          const suggestionText = suggestions.length > 0 ? `\n\nSuggested alternatives:\n${suggestions.slice(0, 2).join('\n')}` : '';
          toast({
            title: "Duplicate Customer",
            description: `A customer with this email address already exists. Please use a different email or update the existing customer.${suggestionText}`,
            variant: "warning",
          });
        } else {
          toast({
            title: "Duplicate Customer",
            description: "A customer with these details already exists. Please check your information and try again.",
            variant: "warning",
          });
        }
      } else if (error.message) {
        toast({
          title: "Error",
          description: `Error creating customer: ${error.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Error creating customer. Please check the console for details.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe API wrapper that prevents errors from breaking the UI
  const safeApiCall = async (apiCall: () => Promise<any>, fallbackValue: any = null) => {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      console.warn('API call failed, using fallback:', error);
      return fallbackValue;
    }
  };

  // Fetch sales persons when modal opens - OPTIMIZED
  useEffect(() => {
    if (open && user) {
      // Only fetch if we don't already have options
      if (salesPersons.length === 0 || salesPersons.includes('Sales Person 1')) {
        const fetchData = async () => {
          try {
            setLoading(true);
          console.log('🔄 Fetching data for AddCustomerModal...');
            
            // Load salesperson options based on role
          console.log('👥 Loading salesperson options...');
            await loadSalesPersonOptions();
          console.log('✅ Salesperson options loaded');
            
            // Load products
          console.log('📦 Loading products...');
            await loadProducts();
          console.log('✅ Products loading completed');
          
          // Load categories
          console.log('📂 Loading categories...');
          await loadCategories();
          console.log('✅ Categories loading completed');
            
          } catch (error) {
          console.error('💥 Error fetching data:', error);
            // Fallback to default options
            setSalesPersons(['Sales Person 1', 'Sales Person 2', 'Sales Person 3']);
          } finally {
            setLoading(false);
          console.log('🏁 fetchData completed');
          }
        };
        
        fetchData();
      }
    }
  }, [open, user, salesPersons.length]);

  // Role-aware salesperson field initialization
  useEffect(() => {
    if (!user) return;
    
    // Auto-fill salesPerson for sales users
    if (user.role === 'inhouse_sales' || user.role === 'tele_calling') {
      setFormData(prev => ({ ...prev, salesPerson: user.name }));
    }
    
    // Load salesperson options based on role
    loadSalesPersonOptions();
  }, [user]);

  const loadSalesPersonOptions = async () => {
    if (!user) return;
    
    try {
      let options: any[] = [];
      let apiResponse: any = null;
      
      console.log('🔍 DEBUG: Starting loadSalesPersonOptions');
      console.log('🔍 DEBUG: User:', user);
      console.log('🔍 DEBUG: User ID:', user.id);
      console.log('🔍 DEBUG: User Role:', user.role);
      
      // Implement deterministic dropdown logic based on role
      if (user.role === 'manager') {
        // Manager: Only their team members
        console.log('👥 Manager: Loading team members...');
        console.log('🔍 DEBUG: Calling apiService.getTeamMembers with ID:', user.id);
        
        apiResponse = await safeApiCall(() => apiService.getTeamMembers(user.id || 0));
        
        console.log('🔍 DEBUG: Raw API Response:', apiResponse);
        console.log('🔍 DEBUG: API Response success:', apiResponse?.success);
        console.log('🔍 DEBUG: API Response data:', apiResponse?.data);
        console.log('🔍 DEBUG: API Response data.users:', apiResponse?.data?.users);
        
        if (apiResponse?.success && apiResponse.data?.users) {
          options = apiResponse.data.users;
          console.log(`✅ Loaded ${options.length} team members for manager`);
          console.log('🔍 DEBUG: Options array:', options);
        } else {
          console.log('❌ API Response validation failed');
          console.log('❌ Success:', apiResponse?.success);
          console.log('❌ Data:', apiResponse?.data);
          console.log('❌ Users:', apiResponse?.data?.users);
        }
      } else if (user.role === 'business_admin' && user.tenant) {
        // Business Admin: All sales users in their tenant
        console.log('🏢 Business Admin: Loading tenant sales users...');
        apiResponse = await safeApiCall(() => apiService.getTenantSalesUsers(user.tenant || 0));
        if (apiResponse?.success && apiResponse.data?.users) {
          options = apiResponse.data.users;
          console.log(`✅ Loaded ${options.length} sales users in tenant`);
        }
      } else if (user.role === 'platform_admin') {
        // Platform Admin: All sales users globally
        console.log('🌐 Platform Admin: Loading all sales users...');
        apiResponse = await safeApiCall(() => apiService.getAllSalesUsers());
        if (apiResponse?.success && apiResponse.data?.users) {
          options = apiResponse.data.users;
          console.log(`✅ Loaded ${options.length} sales users globally`);
        }
      }
      
      // Filter options to only include sales users (not managers)
      const salesUserOptions = options.filter((u: any) => 
        ['inhouse_sales', 'tele_calling'].includes(u.role)
      );
      
      console.log('🔍 DEBUG: Filtered sales user options:', salesUserOptions);
      
      if (salesUserOptions.length > 0) {
        // Use real API options
        const names = salesUserOptions.map((u: any) => u.name || u.id);
        setSalesPersons(names);
        console.log(`✅ Set ${salesUserOptions.length} real salesperson options:`, names);
      } else {
        // No sales users found - show appropriate message
        setSalesPersons([]);
        console.log('⚠️ No sales users found for the current role/scope');
        
        // Show user-friendly message based on role
        if (user.role === 'manager') {
          toast({
            title: "No Team Members",
            description: "You don't have any sales team members assigned yet. Please contact your administrator.",
            variant: "warning",
          });
        } else if (user.role === 'business_admin') {
          toast({
            title: "No Sales Users",
            description: "No sales users found in your tenant. Please add sales users first.",
            variant: "warning",
          });
        }
      }
      
      // Log the role-based assignment scope
      console.log(`🎯 Role-based assignment scope: ${user.role}`);
      console.log(`📊 Available options: ${salesUserOptions.length} sales users`);
      
    } catch (error) {
      console.error('Salesperson options loading failed:', error);
      // Don't set hardcoded options - keep empty array
      setSalesPersons([]);
      
      // Show error message to user
      toast({
        title: "Failed to Load Sales Team",
        description: "Unable to load salesperson data. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const loadProducts = async () => {
    console.log('🚀 loadProducts function called');
    try {
      setProductsLoading(true);
      console.log('📡 Calling API for products...');
      // Use public API with tenant slug 'zinzuwadia' (ZINZUWADIA JEWELLERS) for now
      // This can be made dynamic later based on user's tenant
      const response = await apiService.getProducts({ tenantId: 'zinzuwadia' });
      console.log('📦 Products API Response:', response);
      if (response.success && response.data) {
        // Handle paginated response from Django REST Framework
        const products = (response.data as any).results || response.data;
        setProducts(products);
        console.log('✅ Products loaded successfully:', products.length, 'products');
        console.log('📋 First product:', products[0]);
      } else {
        console.error('❌ Failed to load products:', response);
        // Fallback to sample products if API fails
        const fallbackProducts = [
          { id: 1, name: "Gold Chain Necklace", category: "Necklaces", price: 45000, weight: 3.5 },
          { id: 2, name: "Diamond Ring", category: "Rings", price: 75000, weight: 2.8 },
          { id: 3, name: "Pearl Earrings", category: "Earrings", price: 25000, weight: 1.2 },
          { id: 4, name: "Silver Bracelet", category: "Bracelets", price: 18000, weight: 4.0 },
          { id: 5, name: "Platinum Pendant", category: "Pendants", price: 95000, weight: 1.8 },
          { id: 6, name: "Ruby Necklace", category: "Necklaces", price: 65000, weight: 2.5 },
          { id: 7, name: "Emerald Ring", category: "Rings", price: 55000, weight: 3.2 },
          { id: 8, name: "Sapphire Earrings", category: "Earrings", price: 35000, weight: 1.5 }
        ];
        setProducts(fallbackProducts);
        console.log('🔄 Using fallback products:', fallbackProducts.length, 'products');
      }
    } catch (error) {
      console.error('💥 Error loading products:', error);
      // Fallback to sample products if API fails
      const fallbackProducts = [
        { id: 1, name: "Gold Chain Necklace", category: "Necklaces", price: 45000, weight: 3.5 },
        { id: 2, name: "Diamond Ring", category: "Rings", price: 75000, weight: 2.8 },
        { id: 3, name: "Pearl Earrings", category: "Earrings", price: 25000, weight: 1.2 },
        { id: 4, name: "Silver Bracelet", category: "Bracelets", price: 18000, weight: 4.0 },
        { id: 5, name: "Platinum Pendant", category: "Pendants", price: 95000, weight: 1.8 },
        { id: 6, name: "Ruby Necklace", category: "Necklaces", price: 65000, weight: 2.5 },
        { id: 7, name: "Emerald Ring", category: "Rings", price: 55000, weight: 3.2 },
        { id: 8, name: "Sapphire Earrings", category: "Earrings", price: 35000, weight: 1.5 }
      ];
      setProducts(fallbackProducts);
      console.log('🔄 Using fallback products due to error:', fallbackProducts.length, 'products');
    } finally {
      setProductsLoading(false);
      console.log('🏁 loadProducts completed');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiService.getCategories({ tenantId: 'zinzuwadia' });
      if (response.success && response.data) {
        const categoriesData = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).results || (response.data as any).data || [];
        setCategories(categoriesData);
        console.log('✅ Categories loaded successfully:', categoriesData.length, 'categories');
      } else {
        console.error('❌ Failed to load categories:', response);
        // Fallback to sample categories if API fails
        const fallbackCategories = [
          { id: 1, name: "Necklaces" },
          { id: 2, name: "Rings" },
          { id: 3, name: "Earrings" },
          { id: 4, name: "Bracelets" },
          { id: 5, name: "Pendants" },
          { id: 6, name: "Chains" },
          { id: 7, name: "Bangles" },
          { id: 8, name: "Anklets" }
        ];
        setCategories(fallbackCategories);
        console.log('🔄 Using fallback categories:', fallbackCategories.length, 'categories');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to sample categories if API fails
      const fallbackCategories = [
        { id: 1, name: "Necklaces" },
        { id: 2, name: "Rings" },
        { id: 3, name: "Earrings" },
        { id: 4, name: "Bracelets" },
        { id: 5, name: "Pendants" },
        { id: 6, name: "Chains" },
        { id: 7, name: "Bangles" },
        { id: 8, name: "Anklets" }
      ];
      setCategories(fallbackCategories);
      console.log('🔄 Using fallback categories due to error:', fallbackCategories.length, 'categories');
    }
  };

  const addInterest = () => {
    console.log('➕ Adding new interest...');
    const newInterest = {
        products: [{ product: "", revenue: "" }],
        preferences: {
          designSelected: false,
          wantsDiscount: false,
          checkingOthers: false,
          lessVariety: false,
          other: "",
        },
    };
    console.log('🆕 New interest structure:', newInterest);
    setInterests(prev => {
      const newInterests = [...prev, newInterest];
      console.log('📊 Updated interests array:', newInterests);
      return newInterests;
    });
  };

  const addProductToInterest = (idx: number) => {
    console.log(`➕ Adding product to interest ${idx}`);
    setInterests((prev) => {
      const copy = [...prev];
      const newProduct = { product: "", revenue: "" };
      copy[idx].products.push(newProduct);
      console.log(`   Interest ${idx} now has ${copy[idx].products.length} products:`, copy[idx].products);
      return copy;
    });
  };

  const removeProductFromInterest = (interestIdx: number, productIdx: number) => {
    setInterests((prev) => {
      const copy = [...prev];
      copy[interestIdx].products.splice(productIdx, 1);
      return copy;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
                      <DialogTitle>Add New Customer</DialogTitle>

        </DialogHeader>

        {/* Customer Details */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="font-semibold mb-2">Customer Details</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name *</label>
              <Input 
                placeholder="e.g., Priya Sharma" 
                required 
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
              />
            </div>
            <div className="w-full overflow-hidden">
              <label className="block text-sm font-medium mb-1">Phone Number *</label>
              <PhoneInputComponent 
                placeholder="+91 98XXXXXX00" 
                required 
                value={formData.phone}
                onChange={(value) => handleInputChange('phone', value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input 
                placeholder="e.g., priya.sharma@example.com" 
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={async () => {
                  if (formData.email) {
                    const existing = await checkCustomerExists(formData.email);
                    setExistingCustomerInfo(existing);
                  }
                }}
              />
              {existingCustomerInfo && (
                <div className="mt-1 text-sm text-orange-600 bg-orange-50 p-2 rounded border">
                  <div className="font-medium">Customer already exists:</div>
                  <div>Name: {existingCustomerInfo.name}</div>
                  <div>Phone: {existingCustomerInfo.phone}</div>
                  <div>Status: {existingCustomerInfo.status}</div>
                  <div className="mt-1 text-xs">
                    Suggested alternatives: {suggestAlternativeEmails(formData.email).slice(0, 2).join(', ')}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Birth Date</label>
              <Input 
                type="date" 
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Anniversary Date</label>
              <Input 
                type="date" 
                value={formData.anniversaryDate}
                onChange={(e) => handleInputChange('anniversaryDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="font-semibold mb-2">Address Information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Street Address</label>
              <Input 
                placeholder="e.g., 123, Diamond Lane" 
                value={formData.streetAddress}
                onChange={(e) => handleInputChange('streetAddress', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City *</label>
              <Select 
                value={formData.city} 
                onValueChange={handleCitySelection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State *</label>
              <Select 
                value={formData.state} 
                onValueChange={(value) => handleInputChange('state', value)}
                disabled={isFieldLocked('state', lockedFields)}
              >
                <SelectTrigger className={isFieldLocked('state', lockedFields) ? 'bg-gray-100' : ''}>
                  <SelectValue placeholder={isFieldLocked('state', lockedFields) ? "Auto-filled from City" : "Select State"} />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isFieldLocked('state', lockedFields) && (
                <div className="text-xs text-blue-600 mt-1">
                  🔒 Auto-filled from selected city
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <Input value="India" disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Catchment Area *</label>
              <Select 
                value={formData.catchmentArea} 
                onValueChange={handleCatchmentSelection}
                disabled={!formData.city}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.city ? "Select Catchment Area" : "Select City First"} />
                </SelectTrigger>
                <SelectContent>
                  {formData.city ? (
                    getCatchmentAreasForCity(formData.city).map((area: string) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-city-selected" disabled>
                      Please select a city first
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {!formData.city && (
                <div className="text-xs text-gray-500 mt-1">
                  Select a city to see available catchment areas
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pincode *</label>
              <Select 
                value={formData.pincode} 
                onValueChange={(value) => handleInputChange('pincode', value)}
                disabled={isFieldLocked('pincode', lockedFields)}
              >
                <SelectTrigger className={isFieldLocked('pincode', lockedFields) ? 'bg-gray-100' : ''}>
                  <SelectValue placeholder={isFieldLocked('pincode', lockedFields) ? "Auto-filled from Catchment" : "Select Pincode"} />
                </SelectTrigger>
                <SelectContent>
                  {formData.catchmentArea && formData.pincode && (
                    <SelectItem key={formData.pincode} value={formData.pincode}>
                      {formData.pincode}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {isFieldLocked('pincode', lockedFields) && (
                <div className="text-xs text-blue-600 mt-1">
                  🔒 Auto-filled from selected catchment area
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sales & Lead Information */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="font-semibold mb-2">Sales & Lead Information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sales Person *</label>
              {user?.role === 'inhouse_sales' || user?.role === 'tele_calling' ? (
                // Auto-filled and locked for sales users
                <div className="relative">
                  <Input
                    value={user?.name || 'Auto-assigned'}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                    readOnly
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-400">🔒</span>
                  </div>
                </div>
              ) : (
                // Dropdown for managers and admins
                <Select 
                  value={formData.salesPerson} 
                  onValueChange={(value) => handleInputChange('salesPerson', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Sales Person" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesPersons.map((person) => (
                      <SelectItem key={person} value={person}>
                        {person}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Role context indicator */}
              <div className="mt-1 text-sm text-gray-500">
                {user?.role === 'inhouse_sales' || user?.role === 'tele_calling' ? (
                  <span className="flex items-center">
                    🔒 Auto-assigned to you (cannot be changed)
                  </span>
                ) : user?.role === 'manager' ? (
                  <span className="flex items-center">
                    👥 Select from your team members only
                  </span>
                ) : user?.role === 'business_admin' ? (
                  <span className="flex items-center">
                    🏢 Select from tenant sales team
                  </span>
                ) : user?.role === 'platform_admin' ? (
                  <span className="flex items-center">
                    🌐 Select any sales user globally
                  </span>
                ) : (
                  <span className="flex items-center">
                    👤 Select sales person
                  </span>
                )}
              </div>
              
              {/* Assignment scope info */}
              {user?.role !== 'inhouse_sales' && user?.role !== 'tele_calling' && (
                <div className="mt-1 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  <strong>Assignment Scope:</strong> {
                    user?.role === 'manager' ? 'Team Members Only' :
                    user?.role === 'business_admin' ? 'Tenant Sales Users' :
                    user?.role === 'platform_admin' ? 'Global Sales Users' :
                    'Limited Access'
                  }
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reason for Visit *</label>
              <Select 
                value={formData.reasonForVisit} 
                onValueChange={(value) => handleInputChange('reasonForVisit', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Reason" />
                </SelectTrigger>
                <SelectContent>
                  {REASONS_FOR_VISIT.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Customer Status *</label>
              <Select 
                value={formData.customerStatus} 
                onValueChange={(value) => handleInputChange('customerStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOMER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lead Source *</label>
              <Select 
                value={formData.leadSource} 
                onValueChange={(value) => handleInputChange('leadSource', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Saving Scheme *</label>
              <Select 
                value={formData.savingScheme} 
                onValueChange={(value) => handleInputChange('savingScheme', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  {SAVING_SCHEMES.map((scheme) => (
                    <SelectItem key={scheme} value={scheme}>
                      {scheme}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>



        {/* Customer Interests */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">Product Interests</div>
            <Button variant="outline" size="sm" onClick={addInterest}>+ Add Interest</Button>
          </div>
          {interests.map((interest, idx) => {
            // Safety check to ensure interest has the required structure
            if (!interest || !interest.preferences) {
              return null;
            }
            
            return (
            <div key={idx} className="border rounded p-3 mb-4">
              <div className="mb-2 font-medium">Interest Item #{idx + 1}</div>
              
              {/* Product Chosen Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Product Chosen</label>
                <Select 
                  onValueChange={(productId) => {
                    const selectedProduct = products.find(p => p.id.toString() === productId);
                    if (selectedProduct) {
                      console.log('Selected product:', selectedProduct);
                      
                      // Store the selected product for weight display
                      setSelectedProduct(selectedProduct);
                      
                      // Auto-adjust selected weight based on selected product weight
                      if (selectedProduct.weight) {
                        const baseWeight = Number(selectedProduct.weight) || 0;
                        const unit = formData.weightUnit;
                        
                        console.log(`Product weight before conversion:`, selectedProduct.weight, typeof selectedProduct.weight);
                        console.log(`Converted weight:`, baseWeight, typeof baseWeight);
                        
                        setFormData(prev => ({
                          ...prev,
                          selectedWeight: baseWeight
                        }));
                        
                        console.log(`Auto-adjusted selected weight: ${baseWeight}${unit}`);
                      }
                      
                      // Auto-populate Product Type based on category
                      let productType = '';
                      if (selectedProduct.category_name) {
                        productType = selectedProduct.category_name;
                      } else if (selectedProduct.category) {
                        productType = selectedProduct.category;
                      } else if (selectedProduct.product_type) {
                        productType = selectedProduct.product_type;
                      }
                      
                      if (productType) {
                        setFormData(prev => ({ ...prev, productType }));
                        console.log('Auto-populated Product Type:', productType);
                      }
                      
                      // Auto-populate the Product field and Revenue in the CURRENT interest item
                      setInterests(prev => {
                        const copy = [...prev];
                        // Update the current interest item (idx) instead of always the first one
                        if (copy[idx] && copy[idx].products.length > 0) {
                          // Update the first product in the current interest item
                          copy[idx].products[0].product = selectedProduct.id.toString();
                          // Auto-populate revenue with product price
                          const productPrice = selectedProduct.selling_price || selectedProduct.price || 0;
                          copy[idx].products[0].revenue = productPrice.toString();
                          console.log(`Auto-populated Product field in Interest Item #${idx + 1}:`, selectedProduct.name);
                          console.log(`Auto-populated Revenue field with price:`, productPrice);
                        } else if (copy[idx]) {
                          // If no products exist in this interest item, create one
                          copy[idx].products = [{
                            product: selectedProduct.id.toString(),
                            revenue: (selectedProduct.selling_price || selectedProduct.price || 0).toString()
                          }];
                          console.log(`Created new product in Interest Item #${idx + 1}:`, selectedProduct.name);
                        }
                        return copy;
                      });
                      
                      toast({
                        title: "Product Selected",
                        description: `${selectedProduct.name} - ₹${selectedProduct.selling_price?.toLocaleString('en-IN') || 'Price not available'}`,
                        variant: "default",
                      });
                    }
                  }}
                  disabled={productsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={productsLoading ? "Loading products..." : "Select Product with Price"} />
                  </SelectTrigger>
                  <SelectContent>
                    {productsLoading ? (
                      <SelectItem value="loading" disabled>Loading products...</SelectItem>
                    ) : products.length > 0 ? (
                      products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - ₹{product.selling_price?.toLocaleString('en-IN') || 'Price N/A'}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-products" disabled>No products available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-500 mt-1">
                  Select a product to auto-populate Product Type
                </div>
              </div>

              {/* Product Type Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Product Type *</label>
                <Select 
                  value={formData.productType} 
                  onValueChange={(value) => handleInputChange('productType', value)}
                  disabled={!formData.productType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.productType ? formData.productType : "Auto-populated from Product Chosen"} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.productType ? (
                      <SelectItem value={formData.productType}>
                        {formData.productType}
                      </SelectItem>
                    ) : (
                      <SelectItem value="no-product-selected" disabled>
                        Select a product first to see Product Type
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-500 mt-1">
                  {formData.productType 
                    ? `Product Type: ${formData.productType}` 
                    : "Product Type will be auto-populated when you select a product above"
                  }
                </div>
              </div>

              {/* Style Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Style *</label>
                <Select 
                  value={formData.style} 
                  onValueChange={(value) => handleInputChange('style', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Style" />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLES.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product Weight Display */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium">Product Weight</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Set selected weight to product weight when gear is clicked
                      if (selectedProduct?.weight) {
                        setFormData(prev => ({
                          ...prev,
                          selectedWeight: selectedProduct.weight
                        }));
                      }
                    }}
                    className="h-6 w-6 p-0 text-xs"
                    title="Customize weight range"
                  >
                    ⚙️
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-amber-600">⚖️</span>
                      <span className="text-sm font-medium text-amber-800">Selected Product Weight</span>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-amber-900">
                        {selectedProduct && selectedProduct.weight 
                          ? (() => {
                              const weight = Number(selectedProduct.weight) || 0;
                              const unit = formData.weightUnit;
                              const displayWeight = unit === 'kg' ? (weight / 1000).toFixed(3) : weight;
                              return `${displayWeight}${unit}`;
                            })()
                          : 'No product selected'
                        }
                      </div>
                      <div className="text-xs text-amber-700 mt-1">
                        This is the actual weight of the product you selected above
                      </div>
                      
                      {/* Selected Weight Display */}
                      <div className="mt-3 pt-3 border-t border-amber-200">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-xs text-amber-600">Customer's Selected Weight:</div>
                          {Number(formData.selectedWeight) !== 3.5 ? (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              Customized
                            </span>
                          ) : null}
                        </div>
                        <div className="text-sm font-medium text-amber-800">
                          {(Number(formData.selectedWeight) || 0).toFixed(1)}{formData.weightUnit}
                        </div>
                        <div className="text-xs text-amber-600 mt-1">
                          This is the exact weight the customer wants
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Unit Selector */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Display Unit:</label>
                    <Select 
                      value={formData.weightUnit} 
                      onValueChange={(value) => {
                        // Convert selected weight when unit changes
                        const oldUnit = formData.weightUnit;
                        const newUnit = value;
                        
                        let newSelectedWeight = Number(formData.selectedWeight) || 0;
                        
                        if (oldUnit === 'g' && newUnit === 'kg') {
                          // Convert from grams to kilograms
                          newSelectedWeight = newSelectedWeight / 1000;
                        } else if (oldUnit === 'kg' && newUnit === 'g') {
                          // Convert from kilograms to grams
                          newSelectedWeight = newSelectedWeight * 1000;
                        }
                        
                        setFormData(prev => ({ 
                          ...prev, 
                          weightUnit: value,
                          selectedWeight: newSelectedWeight
                        }));
                      }}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">Grams (g)</SelectItem>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Weight Slider */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">Custom Weight Selection</label>
                      <span className="text-xs text-gray-500">Click to customize</span>
                    </div>
                    <WeightRangeSlider
                      minWeight={0.1}
                      maxWeight={100}
                      currentWeight={Number(formData.selectedWeight) || 3.5}
                      onWeightChange={(weight) => {
                        setFormData(prev => ({
                          ...prev,
                          selectedWeight: Number(weight) || 0
                        }));
                      }}
                      unit={formData.weightUnit}
                      className="bg-gray-50 p-4 rounded-lg border"
                    />
                  </div>
                </div>
              </div>


              <>
                {interest.products.map((prod, pidx) => (
                    <div key={pidx} className="border rounded p-2 mb-2 flex flex-col md:flex-row gap-2 items-center">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1">Product</label>
                        <Select
                          value={prod.product}
                          onValueChange={(value) => {
                            console.log(`🎯 Product selected for interest ${idx}, product ${pidx}:`, value);
                            setInterests(prev => {
                              const copy = [...prev];
                              copy[idx].products[pidx].product = value;
                              console.log(`   Updated product ${pidx} in interest ${idx}:`, copy[idx].products[pidx]);
                              return copy;
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={loading ? "Loading products..." : `Select Product (${products.length} available)`} />
                          </SelectTrigger>

                          <SelectContent>
                            {loading ? (
                              <SelectItem value="loading-products" disabled>Loading products...</SelectItem>
                            ) : (
                              <>
                                {console.log(`DEBUG: SelectContent rendering. products.length: ${products.length}`)}
                                {products.length > 0 ? (
                                  products.map((product) => {
                                    const productValue = product.id?.toString() || product.name || `product-${product.id}`;
                                    const productName = product.name || `Product ${product.id}`;
                                    return (
                                      <SelectItem key={product.id} value={productValue}>
                                        {productName}
                                      </SelectItem>
                                    );
                                  })
                                ) : (
                                  <SelectItem value="no-products" disabled>No products available</SelectItem>
                                )}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1">Revenue Opportunity (₹)</label>
                        <Input
                          placeholder="e.g., 50000" 
                          value={prod.revenue}
                          onChange={(e) => {
                            console.log(`💰 Revenue entered for interest ${idx}, product ${pidx}:`, e.target.value);
                            setInterests(prev => {
                              const copy = [...prev];
                              copy[idx].products[pidx].revenue = e.target.value;
                              console.log(`   Updated revenue for product ${pidx} in interest ${idx}:`, copy[idx].products[pidx]);
                              return copy;
                            });
                          }}
                        />

                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="self-end text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeProductFromInterest(idx, pidx)}
                        type="button"
                      >
                        🗑️
                      </Button>
                    </div>
                  ))}
                  <Button variant="link" size="sm" className="text-orange-600" onClick={() => addProductToInterest(idx)}>
                    + Add Product to this Interest
                  </Button>
                </>
              
              {/* Customer Preferences */}
              <div className="border rounded p-3 mt-3">
                <div className="font-semibold mb-2">Customer Preferences</div>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2">
                    <Checkbox 
                      checked={interest.preferences?.designSelected || false}
                      onCheckedChange={(checked) => {
                        setInterests(prev => {
                          const copy = [...prev];
                          if (!copy[idx].preferences) {
                            copy[idx].preferences = {
                              designSelected: false,
                              wantsDiscount: false,
                              checkingOthers: false,
                              lessVariety: false,
                              other: "",
                            };
                          }
                          copy[idx].preferences.designSelected = checked as boolean;
                          return copy;
                        });
                        
                        // If design is selected, show notification
                        if (checked) {
                          toast({
                            title: "Design Selected! 🎉",
                            description: "Customer has selected a design. This will be reflected in the preferences.",
                            variant: "default",
                          });
                        }
                      }}
                    /> 
                    Design Selected?
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox 
                      checked={interest.preferences?.wantsDiscount || false}
                      onCheckedChange={(checked) => {
                        setInterests(prev => {
                          const copy = [...prev];
                          if (!copy[idx].preferences) {
                            copy[idx].preferences = {
                              designSelected: false,
                              wantsDiscount: false,
                              checkingOthers: false,
                              lessVariety: false,
                              other: "",
                            };
                          }
                          copy[idx].preferences.wantsDiscount = checked as boolean;
                          return copy;
                        });
                      }}
                    /> 
                    Wants More Discount
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox 
                      checked={interest.preferences?.checkingOthers || false}
                      onCheckedChange={(checked) => {
                        setInterests(prev => {
                          const copy = [...prev];
                          if (!copy[idx].preferences) {
                            copy[idx].preferences = {
                              designSelected: false,
                              wantsDiscount: false,
                              checkingOthers: false,
                              lessVariety: false,
                              other: "",
                            };
                          }
                          copy[idx].preferences.checkingOthers = checked as boolean;
                          return copy;
                        });
                      }}
                    /> 
                    Checking Other Jewellers
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox 
                      checked={interest.preferences?.lessVariety || false}
                      onCheckedChange={(checked) => {
                        setInterests(prev => {
                          const copy = [...prev];
                          if (!copy[idx].preferences) {
                            copy[idx].preferences = {
                              designSelected: false,
                              wantsDiscount: false,
                              checkingOthers: false,
                              lessVariety: false,
                              other: "",
                            };
                          }
                          copy[idx].preferences.lessVariety = checked as boolean;
                          return copy;
                        });
                      }}
                    /> 
                    Felt Less Variety
                  </label>
                  <Input 
                    placeholder="Other Preferences (if any)" 
                    className="mt-2"
                    value={interest.preferences?.other || ""}
                    onChange={(e) => {
                      setInterests(prev => {
                        const copy = [...prev];
                        if (!copy[idx].preferences) {
                          copy[idx].preferences = {
                            designSelected: false,
                            wantsDiscount: false,
                            checkingOthers: false,
                            lessVariety: false,
                            other: "",
                          };
                        }
                        copy[idx].preferences.other = e.target.value;
                        return copy;
                      });
                    }}
                  />
              </div>
                </div>
            </div>
          );
          })}
        </div>





        {/* Additional Information */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="font-semibold mb-2">Additional Information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer Preference</label>
              <Textarea 
                placeholder="Optional notes about customer preferences..." 
                rows={3}
                value={formData.customerPreference}
                onChange={(e) => handleInputChange('customerPreference', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Design Number</label>
              <Input 
                placeholder="e.g., DES-2024-001" 
                value={formData.designNumber}
                onChange={(e) => handleInputChange('designNumber', e.target.value)}
              />
              <div className="text-xs text-gray-500 mt-1">
                Alphanumeric code for inventory tracking
              </div>
            </div>
          </div>
        </div>

        {/* Follow-up & Summary */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="font-semibold mb-2">Follow-up & Summary</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Next Follow-up Date</label>
              <Input 
                type="date" 
                value={formData.nextFollowUpDate}
                onChange={(e) => handleInputChange('nextFollowUpDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Follow-up Time</label>
              <Input 
                type="time" 
                value={formData.nextFollowUpTime}
                onChange={(e) => handleInputChange('nextFollowUpTime', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Summary Notes of Visit</label>
              <Textarea 
                placeholder="Key discussion points, items shown, next steps..." 
                rows={3}
                value={formData.summaryNotes}
                onChange={(e) => handleInputChange('summaryNotes', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Autofill Audit Trail */}
        {autofillLogs.length > 0 && (
          <div className="border rounded-lg p-4 mb-4">
            <div className="font-semibold mb-2">🔒 Autofill Audit Trail</div>
            <div className="text-sm text-gray-600 mb-2">
              Fields automatically populated with verified Indian dataset values:
            </div>
            <div className="space-y-2">
              {autofillLogs.map((log, index) => (
                <div key={index} className="text-xs bg-blue-50 p-2 rounded border">
                  <span className="font-medium">{log.fieldName}:</span> {log.originalValue} → {log.newValue}
                  <br />
                  <span className="text-gray-500">
                    Source: {log.sourceDataset} | Time: {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-4 flex justify-end">
          <Button 
            className="btn-primary" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Customer...
              </>
            ) : (
              'Add Customer with Strict Validation'
            )}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
