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
  WEIGHT_RANGES,
  getStateFromCity,
  getPincodeFromCatchment,
  getCatchmentAreasForCity,
  lockField,
  unlockField,
  isFieldLocked
} from "@/constants/indian-data";
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
  productType: string;
  style: string;
  weightRange: string;
  customerPreference: string;
  designNumber: string;
  nextFollowUpDate: string;
  nextFollowUpTime: string;
  summaryNotes: string;
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
    productType: "",
    style: "",
    weightRange: "",
    customerPreference: "",
    designNumber: "",
    nextFollowUpDate: "",
    nextFollowUpTime: "10:00",
    summaryNotes: "",
  });

  // State for field locking (autofill enforcement)
  const [lockedFields, setLockedFields] = useState<Set<string>>(new Set());
  
  // State for API data
  const [salesPersons, setSalesPersons] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    
    if (formData.customerInterests.length === 0) {
      errors.push("At least one Customer Interest is required");
    }
    
    if (!formData.productType) {
      errors.push("Product Type is required");
    }
    
    if (!formData.style) {
      errors.push("Style is required");
    }
    
    if (!formData.weightRange) {
      errors.push("Weight Range is required");
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
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
      
      console.log('Submitting customer data:', { formData, autofillLogs });
      
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
      
      // Create assignment audit trail
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
        teamViolation: false // Will be checked for managers
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
        product_type: formData.productType,
        style: formData.style,
        weight_range: formData.weightRange,
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

      console.log('Sending customer data to API:', cleanedCustomerData);
      
      // Call API to create customer
      const response = await apiService.createClient(cleanedCustomerData);
      
      // Check if API call succeeded AND no business logic errors
      if (response.success && !response.errors && response.data) {
        console.log('Customer created successfully:', response.data);
        
        // Log assignment override for audit trail
        if (assignmentAudit.assignmentType !== 'self') {
          try {
            await apiService.logAssignmentOverride(assignmentAudit);
            console.log('Assignment override logged successfully');
          } catch (error) {
            console.error('Failed to log assignment override:', error);
          }
        }
        
        toast({
          title: "Success!",
          description: `Customer added successfully! ${assignmentAudit.assignmentType === 'self' ? 'Auto-assigned to you.' : `Assigned to ${assignmentAudit.assignedToName}.`}`,
          variant: "success",
        });
        
        // Call the callback with the created customer data
        onCustomerCreated(response.data);
        
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
          productType: "",
          style: "",
          weightRange: "",
          customerPreference: "",
          designNumber: "",
          nextFollowUpDate: "",
          nextFollowUpTime: "10:00",
          summaryNotes: "",
        });
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

  // Fetch sales persons when modal opens - OPTIMIZED
  useEffect(() => {
    if (open && user) {
      // Only fetch if we don't already have options
      if (salesPersons.length === 0 || salesPersons.includes('Sales Person 1')) {
        const fetchData = async () => {
          try {
            setLoading(true);
            console.log('Fetching data for AddCustomerModal...');
            
            // Load salesperson options based on role
            await loadSalesPersonOptions();
            
          } catch (error) {
            console.error('Error fetching data:', error);
            // Fallback to default options
            setSalesPersons(['Sales Person 1', 'Sales Person 2', 'Sales Person 3']);
          } finally {
            setLoading(false);
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
      
      switch (user.role) {
        case 'manager':
          // Load team members for managers
          const teamResponse = await apiService.getTeamMembers(user.id);
          if (teamResponse.success) {
            options = teamResponse.data.filter((u: any) => u.role === 'inhouse_sales');
          }
          break;
          
        case 'business_admin':
          // Load tenant sales users for business admins
          if (user.tenant) {
            const tenantResponse = await apiService.getTenantSalesUsers(user.tenant);
            if (tenantResponse.success) {
              options = tenantResponse.data.filter((u: any) => ['inhouse_sales', 'tele_calling'].includes(u.role));
            }
          }
          break;
          
        case 'platform_admin':
          // Load all sales users for platform admins
          const globalResponse = await apiService.getAllSalesUsers();
          if (globalResponse.success) {
            options = globalResponse.data;
          }
          break;
      }
      
      setSalesPersons(options.map((u: any) => u.name));
    } catch (error) {
      console.error('Failed to load salesperson options:', error);
      // Fallback to default options
      setSalesPersons(['Sales Person 1', 'Sales Person 2', 'Sales Person 3']);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Customer - Strict Dropdown Form</DialogTitle>
          <DialogDescription>
            Customer onboarding form with deterministic autofill and strict dropdown enforcement. 
            All fields except Street Address, Customer Preference, and Design Number must be selected from dropdowns.
          </DialogDescription>
          {loading && <div className="text-sm text-blue-600 mt-2">Loading data...</div>}
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
            <div>
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
                    👥 Select from your team members
                  </span>
                ) : user?.role === 'business_admin' ? (
                  <span className="flex items-center">
                    🏢 Select from tenant sales team
                  </span>
                ) : user?.role === 'platform_admin' ? (
                  <span className="flex items-center">
                    🌐 Select any sales user
                  </span>
                ) : (
                  <span className="flex items-center">
                    👤 Select sales person
                  </span>
                )}
              </div>
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

        {/* Product Preferences */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="font-semibold mb-2">Product Preferences</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer Interest * (Multi-select)</label>
              <div className="border rounded p-3 max-h-32 overflow-y-auto">
                {CUSTOMER_INTERESTS.map((interest) => (
                  <label key={interest} className="flex items-center gap-2 mb-2">
                    <Checkbox 
                      checked={formData.customerInterests.includes(interest)}
                      onCheckedChange={() => handleInterestToggle(interest)}
                    /> 
                    {interest}
                  </label>
                ))}
              </div>
              {formData.customerInterests.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {formData.customerInterests.map((interest) => (
                    <Badge key={interest} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Product Type *</label>
              <Select 
                value={formData.productType} 
                onValueChange={(value) => handleInputChange('productType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Product Type" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
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
              <label className="block text-sm font-medium mb-1">Weight Range *</label>
              <Select 
                value={formData.weightRange} 
                onValueChange={(value) => handleInputChange('weightRange', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Weight Range" />
                </SelectTrigger>
                <SelectContent>
                  {WEIGHT_RANGES.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
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