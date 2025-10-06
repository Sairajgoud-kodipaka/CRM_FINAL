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
  AGE_RANGES,
  PRODUCT_SUBTYPES,
  GOLD_RANGES,
  DIAMOND_RANGES,
  MATERIAL_TYPES,
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
  addToPipeline: boolean;
  nextFollowUpDate: string;
  nextFollowUpTime: string;
  summaryNotes: string;
  
  // High Priority Fields - Pipeline & Purchase Management
  pipelineStage: string;
  budgetRange: string;
  appointmentType: string;
  
  // Customer Classification & Assignment
  customerType: string;
  
  // New Critical Fields
  ageOfEndUser: string;
  productSubtype: string;
  goldRange: string;
  diamondRange: string;
  ageingPercentage: string;
  
  // Material Selection Fields
  materialType: string;
  materialWeight: number;
  materialValue: number;
  materialUnit: string;
}

interface ProductInterest {
  products: { product: string; revenue: string }[];
  preferences: {
    designSelected: boolean;
    wantsDiscount: boolean;
    checkingOthers: boolean;
    lessVariety: boolean;
    purchased: boolean;
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
    addToPipeline: false,
    nextFollowUpDate: "",
    nextFollowUpTime: "10:00",
    summaryNotes: "",
    
    // High Priority Fields - Pipeline & Purchase Management
    pipelineStage: "interested",
    budgetRange: "0-50000",
    appointmentType: "In-Person",
    
    // Customer Classification & Assignment
    customerType: "individual",
    
    // New Critical Fields
    ageOfEndUser: "",
    productSubtype: "",
    goldRange: "",
    diamondRange: "",
    ageingPercentage: "",
    
    // Material Selection Fields
    materialType: "",
    materialWeight: 0,
    materialValue: 0,
    materialUnit: "g",
  });

  // State for field locking (autofill enforcement)
  const [lockedFields, setLockedFields] = useState<Set<string>>(new Set());
  
  // State for API data
  const [salesPersons, setSalesPersons] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for products data
  const [products, setProducts] = useState<any[]>([]);
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
          purchased: false,
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
    
    // Sales person validation - required for all roles
    if (!formData.salesPerson) {
      errors.push("Sales Person is required");
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
    
    if (!formData.materialType) {
      errors.push("Material Type is required");
    }
    
    // Validate material-specific fields
    if (formData.materialType) {
      if (['GOLD JEWELLERY', 'SILVER JEWELLERY', 'PLATINUM JEWELLERY'].includes(formData.materialType)) {
        if (!formData.materialWeight || formData.materialWeight <= 0) {
          errors.push(`${formData.materialType} weight is required and must be greater than 0`);
        }
      } else {
        if (!formData.materialValue || formData.materialValue <= 0) {
          errors.push(`${formData.materialType} value is required and must be greater than 0`);
        }
      }
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
        assignedToUserId: 0, // Will be set based on selection
        assignedToName: formData.salesPerson,
        assignmentType: (user?.role === 'manager' ? 'manager' : 'admin') as 'self' | 'manager' | 'admin',
        assignmentScope: (user?.role === 'manager' ? 'team' : 
                         user?.role === 'business_admin' ? 'tenant' : 'global') as 'self' | 'team' | 'tenant' | 'global',
        timestamp: new Date().toISOString(),
        overrideReason: 'Manual assignment',
        teamViolation: false, // Will be checked for managers
        // Enhanced audit metadata for compliance
        userTenant: user?.tenant || null,
        userStore: user?.store || null,
        assignmentMethod: 'manual',
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
        sales_person: formData.salesPerson,
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
        
        // New Critical Fields
        age_of_end_user: formData.ageOfEndUser,
        product_subtype: formData.productSubtype,
        gold_range: formData.goldRange,
        diamond_range: formData.diamondRange,
        ageing_percentage: cleanStringField(formData.ageingPercentage),
        
        // Material Selection Fields
        material_type: formData.materialType,
        material_weight: formData.materialWeight,
        material_value: formData.materialValue,
        material_unit: formData.materialUnit,
        
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
          description: `Customer added successfully! Assigned to ${assignmentAudit.assignedToName}.`,
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
          addToPipeline: false,
          nextFollowUpDate: "",
          nextFollowUpTime: "10:00",
          summaryNotes: "",
          
          // High Priority Fields - Pipeline & Purchase Management
          pipelineStage: "interested",
          budgetRange: "0-50000",
          appointmentType: "In-Person",
          
          // Customer Classification & Assignment
          customerType: "individual",
          
          // New Critical Fields
          ageOfEndUser: "",
          productSubtype: "",
          goldRange: "",
          diamondRange: "",
          ageingPercentage: "",
          
          // Material Selection Fields
          materialType: "",
          materialWeight: 0,
          materialValue: 0,
          materialUnit: "g",
        });
        setInterests([{
          products: [{ product: "", revenue: "" }],
          preferences: {
            designSelected: false,
            wantsDiscount: false,
            checkingOthers: false,
            lessVariety: false,
            purchased: false,
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
      // Always fetch fresh data when modal opens
      console.log('🔄 Modal opened, fetching fresh data...');
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
  }, [open, user]);

  // Load salesperson options when user changes
  useEffect(() => {
    console.log('🔄 useEffect triggered for loadSalesPersonOptions');
    console.log('🔄 User in useEffect:', user);
    if (!user) {
      console.log('❌ No user in useEffect, returning');
      return;
    }
    
    // Load salesperson options based on role
    console.log('🔄 Calling loadSalesPersonOptions...');
    loadSalesPersonOptions();
  }, [user]);

  // Monitor salesPersons state changes
  useEffect(() => {
    if (salesPersons.length > 0) {
      console.log('✅ Sales persons loaded:', salesPersons.length, 'options');
    }
  }, [salesPersons]);

  const loadSalesPersonOptions = async () => {
    if (!user) {
      console.log('❌ No user found, cannot load salesperson options');
      return;
    }
    
    try {
      let options: any[] = [];
      let apiResponse: any = null;
      
      console.log('🔍 DEBUG: Starting loadSalesPersonOptions');
      console.log('🔍 DEBUG: User:', user);
      console.log('🔍 DEBUG: User ID:', user.id);
      console.log('🔍 DEBUG: User Role:', user.role);
      console.log('🔍 DEBUG: User object keys:', Object.keys(user));
      
      // Implement deterministic dropdown logic based on role
      if (user.role === 'manager') {
        // Manager: Only their specific team members
        console.log('👥 Manager: Loading specific team members...');
        console.log('🔍 DEBUG: Calling apiService.getTeamMembers with manager ID:', user.id);
        
        console.log('🔍 DEBUG: About to call apiService.getTeamMembers()');
        try {
          apiResponse = await apiService.getTeamMembers(user.id || 0);
          console.log('🔍 DEBUG: API call completed successfully');
        } catch (error) {
          console.error('🔍 DEBUG: API call failed with error:', error);
          apiResponse = null;
        }
        
        console.log('🔍 DEBUG: Raw API Response:', apiResponse);
        console.log('🔍 DEBUG: API Response success:', apiResponse?.success);
        console.log('🔍 DEBUG: API Response data:', apiResponse?.data);
        console.log('🔍 DEBUG: API Response data type:', typeof apiResponse?.data);
        console.log('🔍 DEBUG: API Response data is array:', Array.isArray(apiResponse?.data));
        
        if (apiResponse?.success && apiResponse.data) {
          // Handle manager-specific team members response
          if (apiResponse.data.users && Array.isArray(apiResponse.data.users)) {
            options = apiResponse.data.users;
            console.log(`✅ Loaded ${options.length} specific team members for manager`);
            console.log('🔍 DEBUG: Manager-specific team members:', options);
            console.log('🔍 DEBUG: Manager name:', apiResponse.data.manager_name);
            console.log('🔍 DEBUG: Access level:', apiResponse.data.access_level);
          } else {
            console.log('❌ Manager-specific API response format unexpected');
            console.log('❌ Data structure:', apiResponse.data);
          }
        } else {
          console.log('❌ Manager-specific API Response validation failed');
          console.log('❌ Success:', apiResponse?.success);
          console.log('❌ Data:', apiResponse?.data);
          
          // Fallback to general team members list if manager-specific fails
          console.log('🔄 Falling back to general team members list...');
          try {
            const fallbackResponse = await apiService.listTeamMembers();
            if (fallbackResponse?.success && fallbackResponse.data) {
              if (Array.isArray(fallbackResponse.data)) {
                options = fallbackResponse.data;
              } else if (typeof fallbackResponse.data === 'object' && fallbackResponse.data !== null && 'results' in fallbackResponse.data && Array.isArray((fallbackResponse.data as any).results)) {
                options = (fallbackResponse.data as any).results;
              }
              console.log(`✅ Fallback loaded ${options.length} team members`);
            }
          } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
          }
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
      } else if (['inhouse_sales', 'tele_calling'].includes(user.role)) {
        // Sales Users: Load all sales users in their tenant or globally
        console.log(`👤 ${user.role}: Loading sales users...`);
        
        // Try to get tenant sales users first
        if (user.tenant) {
          console.log('🏢 Trying tenant sales users first...');
          apiResponse = await safeApiCall(() => apiService.getTenantSalesUsers(user.tenant || 0));
          if (apiResponse?.success && apiResponse.data?.users) {
            options = apiResponse.data.users;
            console.log(`✅ Loaded ${options.length} sales users from tenant`);
          }
        }
        
        // If no tenant data or no tenant, try global sales users
        if (options.length === 0) {
          console.log('🌐 Trying global sales users...');
          apiResponse = await safeApiCall(() => apiService.getAllSalesUsers());
          if (apiResponse?.success && apiResponse.data?.users) {
            options = apiResponse.data.users;
            console.log(`✅ Loaded ${options.length} sales users globally`);
          }
        }
      }
      
      // For managers, use all team members (not just sales users)
      let finalOptions = options;
      
      if (user.role === 'manager') {
        // For managers, use all team members as they are the manager's team
        console.log('👥 Manager: Using all team members as salesperson options');
        finalOptions = options;
      } else {
        // For other roles, filter to only include sales users
        finalOptions = options.filter((u: any) => 
          ['inhouse_sales', 'tele_calling'].includes(u.role)
        );
      }
      
      console.log('🔍 DEBUG: Final options after filtering:', finalOptions);
      
      if (finalOptions.length > 0) {
        // Use real API options
        let names: string[];
        if (user.role === 'manager') {
          // Manager-specific endpoint returns users with 'name' field
          names = finalOptions.map((u: any) => u.name || u.username || `User ${u.id}`);
        } else {
          // Other endpoints return users with 'first_name' and 'last_name' fields
          names = finalOptions.map((u: any) => u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || `User ${u.id}`);
        }
        console.log('🔍 DEBUG: About to set salesPersons with names:', names);
        setSalesPersons(names);
        console.log(`✅ Set ${finalOptions.length} salesperson options:`, names);
        console.log('🔍 DEBUG: salesPersons state should now be updated');
      } else {
        // If no sales users found from API, provide fallback options
        if (['inhouse_sales', 'tele_calling'].includes(user.role)) {
          // For sales users, include themselves and some default options
          const fallbackOptions = [
            user.name || 'Current User',
            'Sales Person 1',
            'Sales Person 2', 
            'Sales Person 3'
          ];
          setSalesPersons(fallbackOptions);
          console.log('✅ Added fallback options for sales user:', fallbackOptions);
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
      }
      
      // Log the role-based assignment scope
      console.log(`🎯 Role-based assignment scope: ${user.role}`);
      console.log(`📊 Available options: ${finalOptions.length} sales users`);
      
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
      // Use authenticated API to get products for the current user's tenant
      const response = await apiService.getProducts();
      console.log('📦 Products API Response:', response);
      if (response.success && response.data) {
        // Handle paginated response from Django REST Framework
        const productsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data as { results?: any[]; data?: any[] }).results || (response.data as { results?: any[]; data?: any[] }).data || [];
        setProducts(productsData);
        console.log('✅ Products loaded successfully:', productsData.length, 'products');
        console.log('📋 First product:', productsData[0]);
      } else {
        console.error('❌ Failed to load products:', response);
        setProducts([]);
      }
    } catch (error) {
      console.error('💥 Error loading products:', error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
      console.log('🏁 loadProducts completed');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiService.getCategories();
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
          purchased: false,
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

        {/* Basic Customer Information */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="font-semibold mb-3 text-lg">👤 Basic Information</div>
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
              <label className="block text-sm font-medium mb-1">Age of End User</label>
              <Select 
                value={formData.ageOfEndUser} 
                onValueChange={(value) => handleInputChange('ageOfEndUser', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Age Range" />
                </SelectTrigger>
                <SelectContent>
                  {AGE_RANGES.map((age) => (
                    <SelectItem key={age} value={age}>
                      {age} years
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="font-semibold mb-3 text-lg">📍 Address</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
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

        {/* Sales Information */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="font-semibold mb-3 text-lg">💼 Sales Information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sales Person *</label>
              <Select 
                value={formData.salesPerson} 
                onValueChange={(value) => handleInputChange('salesPerson', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Sales Person" />
                </SelectTrigger>
                <SelectContent>
                  {salesPersons.map((person, index) => (
                    <SelectItem key={`${person}-${index}`} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-1 text-xs text-gray-500">
                {user?.role === 'manager' ? '👥 Your team members only' :
                 user?.role === 'business_admin' ? '🏢 Tenant sales team' :
                 user?.role === 'platform_admin' ? '🌐 All sales users' :
                 '👤 Available sales team'}
              </div>
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
          </div>
        </div>



        {/* Product Interest */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="font-semibold mb-3 text-lg">💎 Product Interest</div>
          
          {/* Product Selection */}
              <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Select Product *</label>
                <Select 
                  onValueChange={(productId) => {
                    const selectedProduct = products.find(p => p.id.toString() === productId);
                    if (selectedProduct) {
                      setSelectedProduct(selectedProduct);
                      
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
                      }
                      
                  // Auto-populate the first interest item
                      setInterests(prev => {
                        const copy = [...prev];
                    if (copy[0] && copy[0].products.length > 0) {
                      copy[0].products[0].product = selectedProduct.id.toString();
                          const productPrice = selectedProduct.selling_price || selectedProduct.price || 0;
                      copy[0].products[0].revenue = productPrice.toString();
                    } else if (copy[0]) {
                      copy[0].products = [{
                            product: selectedProduct.id.toString(),
                            revenue: (selectedProduct.selling_price || selectedProduct.price || 0).toString()
                          }];
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
                <SelectValue placeholder={productsLoading ? "Loading products..." : "Select Product"} />
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
              </div>

          {/* Product Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <label className="block text-sm font-medium mb-1">Product Type *</label>
                <Select 
                  value={formData.productType} 
                  onValueChange={(value) => handleInputChange('productType', value)}
                  disabled={!formData.productType}
                >
                  <SelectTrigger>
                  <SelectValue placeholder={formData.productType ? formData.productType : "Auto-filled from product"} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.productType ? (
                      <SelectItem value={formData.productType}>
                        {formData.productType}
                      </SelectItem>
                    ) : (
                      <SelectItem value="no-product-selected" disabled>
                      Select a product first
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                </div>
            <div>
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
            <div>
              <label className="block text-sm font-medium mb-1">Material Type *</label>
                <Select 
                value={formData.materialType} 
                onValueChange={(value) => handleInputChange('materialType', value)}
                >
                  <SelectTrigger>
                  <SelectValue placeholder="Select Material Type" />
                  </SelectTrigger>
                  <SelectContent>
                  {MATERIAL_TYPES.map((material) => (
                    <SelectItem key={material} value={material}>
                      {material}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </div>
            <div>
              <label className="block text-sm font-medium mb-1">Product Subtype</label>
                <Select 
                value={formData.productSubtype} 
                onValueChange={(value) => handleInputChange('productSubtype', value)}
                >
                  <SelectTrigger>
                  <SelectValue placeholder="Select Subtype" />
                  </SelectTrigger>
                  <SelectContent>
                  {PRODUCT_SUBTYPES.map((subtype) => (
                    <SelectItem key={subtype} value={subtype}>
                      {subtype}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </div>
              </div>

          {/* Material Weight/Value */}
              {formData.materialType && (
                <div className="mb-4">
                  {['GOLD JEWELLERY', 'SILVER JEWELLERY', 'PLATINUM JEWELLERY'].includes(formData.materialType) ? (
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Weight:</label>
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={formData.materialWeight || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, materialWeight: parseFloat(e.target.value) || 0 }))}
                          className="w-32"
                        />
                        <Select 
                          value={formData.materialUnit} 
                          onValueChange={(value) => handleInputChange('materialUnit', value)}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="g">g</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="oz">oz</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                  ) : (
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Value:</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                          <Input
                            type="number"
                            placeholder="0"
                            value={formData.materialValue || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, materialValue: parseFloat(e.target.value) || 0 }))}
                            className="w-40 pl-8"
                          />
                        </div>
                        <span className="text-sm text-gray-500">rupees</span>
                    </div>
                  )}
                </div>
              )}

          {/* Revenue Opportunity */}
              <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Expected Revenue (₹) *</label>
                        <Input
                          placeholder="e.g., 50000" 
              value={interests[0]?.products[0]?.revenue || ''}
                          onChange={(e) => {
                            setInterests(prev => {
                              const copy = [...prev];
                  if (copy[0] && copy[0].products[0]) {
                    copy[0].products[0].revenue = e.target.value;
                  }
                              return copy;
                            });
                          }}
              className="w-48"
                        />
                      </div>
              
          {/* Product Interests */}
          <div className="border rounded p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">Product Interests</div>
              <Button variant="outline" size="sm" onClick={addInterest}>+ Add Interest</Button>
            </div>
            
            {interests.map((interest, idx) => {
              if (!interest || !interest.preferences) {
                return null;
              }
              
              return (
                <div key={idx} className="border rounded p-3 mb-3 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium text-sm">Interest #{idx + 1}</div>
                    {interests.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          setInterests(prev => prev.filter((_, i) => i !== idx));
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  {/* Product Selection for this interest */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Product</label>
                    <Select
                      value={interest.products[0]?.product || ''}
                      onValueChange={(value) => {
                        setInterests(prev => {
                          const copy = [...prev];
                          if (!copy[idx].products[0]) {
                            copy[idx].products[0] = { product: "", revenue: "" };
                          }
                          copy[idx].products[0].product = value;
                          
                          // Auto-populate revenue if product is selected
                          const selectedProduct = products.find(p => p.id.toString() === value);
                          if (selectedProduct) {
                            const productPrice = selectedProduct.selling_price || selectedProduct.price || 0;
                            copy[idx].products[0].revenue = productPrice.toString();
                          }
                          return copy;
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name} - ₹{product.selling_price?.toLocaleString('en-IN') || 'Price N/A'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Revenue for this interest */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Expected Revenue (₹)</label>
                    <Input
                      placeholder="e.g., 50000" 
                      value={interest.products[0]?.revenue || ''}
                      onChange={(e) => {
                        setInterests(prev => {
                          const copy = [...prev];
                          if (!copy[idx].products[0]) {
                            copy[idx].products[0] = { product: "", revenue: "" };
                          }
                          copy[idx].products[0].revenue = e.target.value;
                          return copy;
                        });
                      }}
                      className="w-48"
                    />
                  </div>
                  
                  {/* Customer Preferences for this interest */}
                  <div className="grid grid-cols-2 gap-2">
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
                              purchased: false,
                              other: "",
                            };
                            }
                            copy[idx].preferences.designSelected = checked as boolean;
                            return copy;
                          });
                        }}
                      /> 
                      Design Selected
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
                              purchased: false,
                              other: "",
                            };
                            }
                            copy[idx].preferences.wantsDiscount = checked as boolean;
                            return copy;
                          });
                        }}
                      /> 
                      Wants Discount
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
                              purchased: false,
                              other: "",
                            };
                            }
                            copy[idx].preferences.checkingOthers = checked as boolean;
                            return copy;
                          });
                        }}
                      /> 
                      Checking Others
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
                                purchased: false,
                                other: "",
                              };
                            }
                            copy[idx].preferences.lessVariety = checked as boolean;
                            return copy;
                          });
                        }}
                      /> 
                      Less Variety
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox 
                        checked={interest.preferences?.purchased || false}
                        onCheckedChange={(checked) => {
                          setInterests(prev => {
                            const copy = [...prev];
                            if (!copy[idx].preferences) {
                              copy[idx].preferences = {
                                designSelected: false,
                                wantsDiscount: false,
                                checkingOthers: false,
                                lessVariety: false,
                                purchased: false,
                                other: "",
                              };
                            }
                            copy[idx].preferences.purchased = checked as boolean;
                            return copy;
                          });
                        }}
                      /> 
                      Purchased
                    </label>
                  </div>
                  
                  <Input 
                    placeholder="Other preferences for this interest..." 
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
                              purchased: false,
                              other: "",
                            };
                        }
                        copy[idx].preferences.other = e.target.value;
                        return copy;
                      });
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Sales Pipeline Section */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="font-semibold mb-3 text-lg">🚀 Sales Pipeline</div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">📈</span>
                </div>
                <div>
                  <div className="font-medium text-blue-900">Add to Sales Pipeline</div>
                  <div className="text-sm text-blue-700">Track this customer's journey and follow-up progress</div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    addToPipeline: !prev.addToPipeline
                  }));
                }}
                className={`${
                  formData.addToPipeline 
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                    : 'border-blue-300 text-blue-600 hover:bg-blue-50'
                } transition-colors`}
              >
                {formData.addToPipeline ? '✓ Added to Pipeline' : '+ Add to Pipeline'}
              </Button>
            </div>
            {formData.addToPipeline && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2 text-green-700">
                  <span className="text-sm">✓</span>
                  <span className="text-sm font-medium">Customer will be added to the sales pipeline for tracking and follow-up management</span>
                </div>
              </div>
            )}
          </div>
        </div>





        {/* Additional Information */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="font-semibold mb-3 text-lg">📝 Additional Information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Design Number</label>
              <Input 
                placeholder="e.g., DES-2024-001" 
                value={formData.designNumber}
                onChange={(e) => handleInputChange('designNumber', e.target.value)}
              />
              </div>
            <div>
              <label className="block text-sm font-medium mb-1">Next Follow-up Date</label>
              <Input 
                type="date" 
                value={formData.nextFollowUpDate}
                onChange={(e) => handleInputChange('nextFollowUpDate', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <Textarea 
                placeholder="Key discussion points, customer preferences, next steps..." 
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
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Customer...
              </>
            ) : (
              'Add Customer'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
