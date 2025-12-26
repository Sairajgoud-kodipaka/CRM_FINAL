"use client";
import React, { useState, useEffect } from "react";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ComboboxSelect } from "@/components/ui/combobox-select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PhoneInputComponent } from "@/components/ui/phone-input";
import { apiService } from "@/lib/api-service";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";
import {
  INDIAN_CITIES,
  INDIAN_STATES,
  INDIAN_CATCHMENT_AREAS,
  REASONS_FOR_VISIT,
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
import { Skeleton } from '@/components/ui/skeleton';
import { useFormNavigation } from "@/hooks/useFormNavigation";
import { uploadImageToCloudinary, isAllowedImageFile } from "@/lib/cloudinary-upload";

interface AddCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: any) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthDate: string;
  anniversaryDate: string;
  streetAddress: string;
  fullAddress: string;
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
  ageingPercentage: string;

  // Material Selection Fields
  materialType: string;
  materialWeight: number;
  materialValue: number;
  materialUnit: string;
}

interface ProductInterest {
  mainCategory: string;
  products: { product: string; revenue: string }[];
  designNumber?: string;
  images?: { url: string; thumbUrl: string }[];
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
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  // Single streamlined mode for faster data capture (always Quick Entry)
  const quickEntry = true;
  const [uploadedImage, setUploadedImage] = useState<{ url: string; thumbUrl: string } | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const firstNameInputRef = React.useRef<HTMLInputElement | null>(null);
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null);
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null);

  // Autofocus first field on open for smooth mobile flow
  useEffect(() => {
    if (open && isMobile) {
      setTimeout(() => firstNameInputRef.current?.focus(), 50);
    }
  }, [open, isMobile]);

  // Lightweight focus helper using data-field attributes
  const focusNext = (fieldId: string) => {
    if (!isMobile) return;
    const el = document.querySelector<HTMLElement>(`[data-field="${fieldId}"]`);
    if (el) {
      el.focus();
      // scroll into view for small screens
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Form state with strict typing
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    birthDate: "",
    anniversaryDate: "",
    streetAddress: "",
    fullAddress: "",
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
    selectedWeight: 3.5,
    weightUnit: "g",
    customerPreference: "",
    designNumber: "",
    addToPipeline: true,
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
    ageingPercentage: "",

    // Material Selection Fields
    materialType: "",
    materialWeight: 0,
    materialValue: 0,
    materialUnit: "g",
  });

  // State for field locking (autofill enforcement)
  const [lockedFields, setLockedFields] = useState<Set<string>>(new Set());

  // Form navigation setup (mobile quick-entry friendly order)
  const formFields = quickEntry && isMobile
    ? [
        { id: 'firstName', type: 'input' as const },
        { id: 'lastName', type: 'input' as const },
        { id: 'phone', type: 'phone' as const },
        { id: 'email', type: 'input' as const },
        { id: 'ageOfEndUser', type: 'select' as const },
        { id: 'streetAddress', type: 'input' as const },
        { id: 'city', type: 'select' as const },
        { id: 'state', type: 'select' as const },
        { id: 'catchmentArea', type: 'select' as const },
        { id: 'pincode', type: 'select' as const },
        { id: 'reasonForVisit', type: 'select' as const },
        { id: 'leadSource', type: 'select' as const },
        { id: 'summaryNotes', type: 'textarea' as const },
      ]
    : [
        { id: 'firstName', type: 'input' as const },
        { id: 'lastName', type: 'input' as const },
        { id: 'phone', type: 'phone' as const },
        { id: 'email', type: 'input' as const },
        { id: 'ageOfEndUser', type: 'select' as const },
        { id: 'streetAddress', type: 'input' as const },
        { id: 'city', type: 'select' as const },
        { id: 'state', type: 'select' as const },
        { id: 'catchmentArea', type: 'select' as const },
        { id: 'pincode', type: 'select' as const },
        { id: 'salesPerson', type: 'select' as const },
        { id: 'reasonForVisit', type: 'select' as const },
        { id: 'leadSource', type: 'select' as const },
        { id: 'selectedProduct', type: 'select' as const },
        { id: 'productType', type: 'select' as const },
        { id: 'style', type: 'select' as const },
        { id: 'materialType', type: 'select' as const },
        { id: 'expectedRevenue', type: 'input' as const },
        { id: 'designNumber', type: 'input' as const },
        { id: 'nextFollowUpDate', type: 'input' as const },
        { id: 'summaryNotes', type: 'textarea' as const },
      ];
  
  const { registerField, handleKeyDown, handleSelectKeyDown } = useFormNavigation(formFields);

  // State for API data
  const [salesPersons, setSalesPersons] = useState<string[]>([]);
  const [salesPersonOptions, setSalesPersonOptions] = useState<Array<{id: number, name: string, username: string}>>([]);
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
        mainCategory: "",
        products: [{ product: "", revenue: "" }],
        designNumber: "",
        images: [],
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
  // Mobile-friendly collapsible state per interest
  const [interestDetailsOpen, setInterestDetailsOpen] = useState<boolean[]>([false]);

  // State for existing customer check (by phone)
  const [existingPhoneCustomer, setExistingPhoneCustomer] = useState<{
    id: number;
    name: string;
    phone: string;
    status: string;
    email: string;
    total_visits: number;
    last_visit?: string;
    store_name?: string;
    store_id?: number;
    is_different_store?: boolean;
  } | null>(null);
  
  // State to track if we're updating an existing customer
  const [isUpdatingExistingCustomer, setIsUpdatingExistingCustomer] = useState(false);
  const [existingCustomerId, setExistingCustomerId] = useState<number | null>(null);
  const [existingCustomerFullData, setExistingCustomerFullData] = useState<Client | null>(null);
  
  // State for existing customer check (by email)
  const [existingCustomerInfo, setExistingCustomerInfo] = useState<{
    name: string;
    phone: string;
    status: string;
    email: string;
  } | null>(null);
  
  // Loading state for phone check
  const [checkingPhone, setCheckingPhone] = useState(false);

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

  // Check if customer exists by phone number
  const checkPhoneExists = async (phone: string) => {
    // International phone numbers should have at least 8 digits (country code + number)
    // Minimum length check: at least 8 characters (e.g., +1234567)
    if (!phone || phone.replace(/\D/g, '').length < 8) {
      setExistingPhoneCustomer(null);
      return;
    }

    try {
      setCheckingPhone(true);
      const response = await apiService.checkPhoneExists(phone);
      if (response.success && response.data?.exists) {
        setExistingPhoneCustomer({
          id: response.data.customer!.id,
          name: response.data.customer!.name,
          phone: response.data.customer!.phone,
          status: response.data.customer!.status,
          email: response.data.customer!.email,
          total_visits: response.data.customer!.total_visits,
          last_visit: response.data.customer!.last_visit,
          store_name: response.data.customer!.store_name,
          store_id: response.data.customer!.store_id,
          is_different_store: response.data.is_different_store || false
        });
      } else {
        setExistingPhoneCustomer(null);
      }
    } catch (error) {
      // Silently fail - don't block user from continuing
      setExistingPhoneCustomer(null);
    } finally {
      setCheckingPhone(false);
    }
  };
  
  // Check if customer exists by email
  const checkCustomerExists = async (email: string) => {
    if (!email) return null;

    try {
      // This would need to be implemented in the API service
      // For now, we'll just return null
      return null;
    } catch (error) {

      return null;
    }
  };
  
  // Use existing customer info - fetch full customer data and load into form
  const useExistingCustomer = async () => {
    if (!existingPhoneCustomer) return;
    
    try {
      setLoading(true);
      // Fetch full customer data - use crossStore=true to bypass store filtering
      const response = await apiService.getClient(existingPhoneCustomer.id.toString(), false, true);
      
      console.log('🔍 useExistingCustomer - API Response:', response);
      
      if (!response.success) {
        console.error('❌ useExistingCustomer - Response not successful:', response);
        throw new Error(response.errors?.message || response.errors || 'Failed to fetch customer data');
      }
      
      if (response.success && response.data) {
        const customer = response.data;
        console.log('🔍 useExistingCustomer - Customer Data:', customer);
        
        if (!customer || !customer.id) {
          console.error('❌ useExistingCustomer - Invalid customer data:', customer);
          throw new Error('Invalid customer data received from server');
        }
        
        setExistingCustomerFullData(customer);
        setExistingCustomerId(customer.id || null);
        setIsUpdatingExistingCustomer(true);
        
        // Load all customer data into form
        const formatDateForInput = (dateString?: string | null): string => {
          if (!dateString) return "";
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "";
            return date.toISOString().split("T")[0];
          } catch {
            return "";
          }
        };
        
        // Map customer interests to form interests
        const mapInterests = (customerInterests: any[]): typeof interests => {
          if (!Array.isArray(customerInterests) || customerInterests.length === 0) {
            return [createEmptyInterest()];
          }
          
          // Group interests by category
          const categoryMap = new Map<string, typeof interests[0]>();
          
          customerInterests.forEach((interest: any) => {
            const categoryName = interest.category?.name || interest.category || "";
            const productId = interest.product?.id?.toString() || interest.product || "";
            const revenue = interest.revenue || "0";
            const designNumber = interest.designNumber || "";
            const images = interest.images || [];
            const preferences = interest.preferences || {};
            
            if (categoryName && productId) {
              if (categoryMap.has(categoryName)) {
                const existing = categoryMap.get(categoryName)!;
                existing.products.push({ product: productId, revenue: String(revenue) });
              } else {
                categoryMap.set(categoryName, {
                  mainCategory: categoryName,
                  products: [{ product: productId, revenue: String(revenue) }],
                  designNumber: designNumber,
                  images: images,
                  preferences: preferences,
                });
              }
            }
          });
          
          const mapped = Array.from(categoryMap.values());
          return mapped.length > 0 ? mapped : [createEmptyInterest()];
        };
        
        setFormData({
          firstName: customer.first_name || "",
          lastName: customer.last_name || "",
          phone: customer.phone || "",
          email: customer.email || "",
          birthDate: formatDateForInput(customer.date_of_birth),
          anniversaryDate: formatDateForInput(customer.anniversary_date),
          streetAddress: customer.address || "",
          fullAddress: customer.full_address || "",
          city: customer.city || "",
          state: customer.state || "",
          country: customer.country || "India",
          catchmentArea: customer.catchment_area || "",
          pincode: customer.pincode || "",
          salesPerson: customer.sales_person || "",
          reasonForVisit: customer.reason_for_visit || "",
          customerStatus: customer.customer_status || customer.status || "",
          leadSource: customer.lead_source || "",
          savingScheme: customer.saving_scheme || "Inactive",
          customerInterests: Array.isArray((customer as any).customer_interests_simple)
            ? (customer as any).customer_interests_simple
            : [],
          productType: customer.product_type || "",
          style: customer.style || "",
          selectedWeight: typeof customer.material_weight === "number" && customer.material_weight > 0
            ? customer.material_weight
            : 3.5,
          weightUnit: (customer as any).material_unit || "g",
          customerPreference: customer.customer_preference || "",
          designNumber: customer.design_number || "",
          addToPipeline: true,
          nextFollowUpDate: formatDateForInput(customer.next_follow_up),
          nextFollowUpTime: customer.next_follow_up_time || "10:00",
          summaryNotes: customer.summary_notes || "",
          pipelineStage: (customer as any).pipeline_stage || "interested",
          budgetRange: customer.budget_range || "0-50000",
          appointmentType: "In-Person",
          customerType: customer.customer_type || "individual",
          ageOfEndUser: customer.age_of_end_user || "",
          productSubtype: customer.product_subtype || "",
          ageingPercentage: (customer as any).ageing_percentage || "",
          materialType: customer.material_type || "",
          materialWeight: typeof customer.material_weight === "number" ? customer.material_weight : 0,
          materialValue: typeof customer.material_value === "number" ? customer.material_value : 0,
          materialUnit: (customer as any).material_unit || "g",
        });
        
        // Load existing interests
        const existingInterests = mapInterests((customer as any).customer_interests || []);
        setInterests(existingInterests.length > 0 ? existingInterests : [createEmptyInterest()]);
        
        console.log('✅ useExistingCustomer - Form data set:', formData);
        console.log('✅ useExistingCustomer - Interests set:', existingInterests);
        
        toast({
          title: "Existing Customer Loaded",
          description: `Loaded customer: ${customer.full_name || existingPhoneCustomer.name}. You can add new interests and update information.`,
          variant: "default",
        });
      } else {
        console.error('❌ useExistingCustomer - No data in response:', response);
        throw new Error('No customer data received from server');
      }
    } catch (error: any) {
      console.error('❌ useExistingCustomer - Error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load customer data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Ensure selectedWeight is always a number
  useEffect(() => {
    if (typeof formData.selectedWeight !== 'number' || isNaN(formData.selectedWeight)) {

      setFormData(prev => ({
        ...prev,
        selectedWeight: Number(prev.selectedWeight) || 3.5
      }));
    }
  }, [formData.selectedWeight]);

  // Check for duplicate phone when phone number is complete
  useEffect(() => {
    if (formData.phone && formData.phone.length >= 10) {
      const timeoutId = setTimeout(() => {
        checkPhoneExists(formData.phone);
      }, 1000); // Wait 1 second after user stops typing
      return () => clearTimeout(timeoutId);
    }
    // Clear existing customer when phone is cleared
    if (!formData.phone || formData.phone.length < 10) {
      setExistingPhoneCustomer(null);
    }
  }, [formData.phone]);

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

      // Minimal UX: avoid toast spam on type-ahead selections
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

      // Minimal UX: avoid toast spam on type-ahead selections
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

      // Minimal UX: avoid toast spam on type-ahead selections
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

  // Validate form before submission - only required fields (marked with *) are mandatoryw
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Required fields marked with "*"
    if (!formData.firstName || formData.firstName.trim() === '') {
      errors.push("First Name is required");
    }

    if (!formData.phone || formData.phone.trim() === '') {
      errors.push("Phone Number is required");
    }

    if (!formData.city || formData.city.trim() === '') {
      errors.push("City is required");
    }

    if (!formData.state || formData.state.trim() === '') {
      errors.push("State is required");
    }

    if (!formData.catchmentArea || formData.catchmentArea.trim() === '') {
      errors.push("Catchment Area is required");
    }

    // Pincode is optional

    if (!formData.salesPerson || formData.salesPerson.trim() === '') {
      errors.push("Sales Person is required");
    }

    if (!formData.reasonForVisit || formData.reasonForVisit.trim() === '') {
      errors.push("Reason for Visit is required");
    }

    if (!formData.leadSource || formData.leadSource.trim() === '') {
      errors.push("Lead Source is required");
    }

    // Validate product via interests block
    const firstInterestProductId = interests?.[0]?.products?.[0]?.product;
    if (!firstInterestProductId || String(firstInterestProductId).trim() === '') {
      errors.push("Select Product is required");
    }

    // Product type can come from global field or the first interest category
    const effectiveProductType = (formData.productType || '').trim() || (interests?.[0]?.mainCategory || '').trim();
    if (!effectiveProductType) {
      errors.push("Product Type is required");
    }

    // Expected revenue is optional; if absent we won't auto-create a pipeline with value

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Auto-create sales pipeline entry when customer is created
  const createAutoPipelineEntry = async (customerData: any) => {
    try {


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

      // Do not infer value from budget; keep zero unless user provided explicit revenue
      // If there's no explicit revenue, we will skip creating a pipeline entry

      // Create pipeline regardless; if no explicit value, keep it as 0
      const pipelineData = {
        title: `${`${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Customer'} - ${formData.productType || 'Jewelry'}`,
        client_id: customerData.id,
        stage: pipelineStage,
        probability: probability,
        expected_value: expectedValue,
        notes: `Auto-created pipeline entry for new customer. Lead source: ${formData.leadSource || 'Unknown'}. Customer status: ${formData.customerStatus || 'Unknown'}.`,
        next_action: formData.nextFollowUpDate ? `Follow up on ${formData.nextFollowUpDate}` : 'Schedule follow-up call',
        next_action_date: formData.nextFollowUpDate ? new Date(formData.nextFollowUpDate).toISOString() : undefined
      };



      // Call API to create pipeline
      const pipelineResponse = await apiService.createSalesPipeline(pipelineData);

      if (pipelineResponse.success) {

      } else {

      }

    } catch (error) {

      throw error; // Re-throw to be caught by the calling function
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Ensure selectedWeight is a valid number before submission
      if (typeof formData.selectedWeight !== 'number' || isNaN(formData.selectedWeight)) {

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

          return undefined;
        }
      };

      // Clean string fields; convert empty strings to null for optional fields
      const cleanStringField = (value: string, opts?: { undefinedIfEmpty?: boolean; nullIfEmpty?: boolean }) => {
        const v = value && value.trim() ? value.trim() : '';
        if (!v && opts?.undefinedIfEmpty) return undefined as unknown as string;
        if (!v && opts?.nullIfEmpty) return null as unknown as string;
        return v;
      };

      // Helper to convert empty strings to null for optional fields
      const emptyToNull = (value: string | undefined): string | null => {
        if (value === undefined || value === null) return null;
        if (typeof value === 'string' && value.trim() === '') return null;
        return value;
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
      // Required fields (marked with *) are always included
      // Optional fields are converted to null if empty
      const customerData = {
        // Required fields
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        country: formData.country || 'India',
        catchment_area: formData.catchmentArea,
        pincode: emptyToNull(formData.pincode) as string | null,
        sales_person: formData.salesPerson,
        sales_person_id: (() => {
          // Find the selected salesperson's ID from the options
          const selectedOption = salesPersonOptions.find(option => {
            return option.name === formData.salesPerson;
          });
          const salesPersonId = selectedOption ? selectedOption.id : null;
          return salesPersonId;
        })(),
        reason_for_visit: formData.reasonForVisit,
        lead_source: formData.leadSource,
        product_type: (formData.productType || interests?.[0]?.mainCategory || ''),

        // Optional fields - convert empty strings to null
        address: emptyToNull(formData.streetAddress) as string | null,
        full_address: emptyToNull(formData.fullAddress) as string | null,
        date_of_birth: formatDateForAPI(formData.birthDate),
        anniversary_date: formatDateForAPI(formData.anniversaryDate),
        customer_status: emptyToNull(formData.customerStatus) as string | null,
        saving_scheme: formData.savingScheme || 'Inactive',
        customer_interests: formData.customerInterests.length > 0 ? formData.customerInterests : [],
        // Normalize interests for backend: coerce revenue to number-like string and drop empties
        customer_interests_input: (() => {
          const filteredInterests = interests
            .filter(interest => {
              // Only include interests that have a category and at least one product with a product name
              const hasCategory = interest.mainCategory && interest.mainCategory.trim() !== '';
              const hasProducts = interest.products && interest.products.length > 0;
              const hasProductNames = interest.products.some(p => p.product && p.product.trim() !== '');
              return hasCategory && hasProducts && hasProductNames;
            })
          .map((interest) => {
              const normalizedProducts = (interest.products || [])
                .filter(p => p.product && p.product.trim() !== '') // Filter out empty products
                .map(p => ({
              product: p.product,
              revenue: String(parseFloat(p.revenue || '0') || 0)
            }));
            return {
              category: interest.mainCategory,
              products: normalizedProducts,
              designNumber: interest.designNumber || "",
              images: interest.images || [],
              preferences: interest.preferences || {}
            };
          })
          // Keep interests even when revenue is 0; only drop if there are no products at all
          .filter(it => Array.isArray(it.products) && it.products.length > 0)
            .map(it => JSON.stringify(it))
            .filter(jsonStr => {
              // Double-check: parse and verify the interest has valid data
              try {
                const parsed = JSON.parse(jsonStr);
                return parsed.category && parsed.products && parsed.products.length > 0;
              } catch {
                return false;
              }
            });
          
          // Always return an array (empty if no valid interests) so backend knows to process it
          return filteredInterests.length > 0 ? filteredInterests : [];
        })(),

        style: emptyToNull(formData.style) as string | null,
        customer_preference: emptyToNull(formData.customerPreference) as string | null,
        design_number: emptyToNull(formData.designNumber) as string | null,
        next_follow_up: formatDateForAPI(formData.nextFollowUpDate),
        next_follow_up_time: formData.nextFollowUpTime || null,
        summary_notes: emptyToNull(formData.summaryNotes) as string | null,

        // New Critical Fields - optional
        age_of_end_user: emptyToNull(formData.ageOfEndUser) as string | null,
        ageing_percentage: emptyToNull(formData.ageingPercentage) as string | null,

        // Material Selection Fields - optional
        material_type: emptyToNull(formData.materialType) as string | null,
        material_weight: formData.materialWeight && formData.materialWeight > 0 ? formData.materialWeight : null,
        material_value: formData.materialValue && formData.materialValue > 0 ? formData.materialValue : null,
        material_unit: formData.materialUnit || null,

        autofill_audit_trail: autofillLogs, // Include audit trail
        assignment_audit: assignmentAudit, // Include assignment audit
        // Email - optional, only include if not empty
        ...(formData.email && formData.email.trim() ? { email: formData.email.trim() } : {}),
      };



      // Remove undefined values but keep null values (null indicates optional fields that are empty)
      const cleanedCustomerData = Object.fromEntries(
        Object.entries(customerData).filter(([_, value]) => value !== undefined)
      );

      // Log customer interests for debugging
      const interestsInput = cleanedCustomerData.customer_interests_input;
      console.log('🔍 AddCustomerModal - Submitting customer interests:', {
        customer_interests_input: interestsInput,
        customer_interests_input_length: Array.isArray(interestsInput) ? interestsInput.length : 0,
        raw_interests: interests
      });

              // Sending customer data to API

      // Check if we're updating an existing customer
      let response;
      if (isUpdatingExistingCustomer && existingCustomerId) {
        // Update existing customer - use crossStore=true to bypass store filtering
        console.log('🔍 AddCustomerModal - Updating existing customer:', existingCustomerId, 'crossStore: true');
        response = await apiService.updateClient(existingCustomerId.toString(), cleanedCustomerData, true);
        console.log('🔍 AddCustomerModal - Update response:', response);
      } else {
        // Create new customer
        response = await apiService.createClient(cleanedCustomerData);
      }

      // Check if API call succeeded AND no business logic errors
      if (response.success && !response.errors && response.data) {
        // Customer created successfully

        // Log assignment override for audit trail
        if (assignmentAudit.assignmentType !== 'self') {
          try {
            await apiService.logAssignmentOverride(assignmentAudit);
          } catch (error) {

          }
        }

        // Auto-create sales pipeline entry
        // For existing customers, create a NEW pipeline entry for this visit
        // For new customers, create pipeline entry as usual
        try {
          if (isUpdatingExistingCustomer) {
            // ALWAYS create new pipeline entry for cross-store visits to track store and sales rep
            // This ensures proper store association for interests
            const newInterestsRevenue = interests
              .filter(i => i.mainCategory && i.products?.[0]?.product)
              .reduce((sum, i) => {
                const revenue = parseFloat(i.products[0]?.revenue || "0") || 0;
                return sum + revenue;
              }, 0);
            
            const newInterestsCount = interests.filter(i => i.mainCategory).length;
            
            // Always create pipeline entry for cross-store updates (even if revenue is 0)
            // This is critical for store tracking
            await apiService.createSalesPipeline({
              title: `Store Visit - ${new Date().toLocaleDateString()}`,
              client_id: existingCustomerId!,
              stage: formData.pipelineStage || "interested",
              expected_value: newInterestsRevenue,
              probability: 20,
              notes: `New visit - ${newInterestsCount} product interest${newInterestsCount !== 1 ? 's' : ''} added`,
            } as any); // Type assertion needed because TypeScript interface doesn't include client_id
          } else {
            // New customer - create pipeline as usual
            await createAutoPipelineEntry(response.data);
          }
        } catch (error) {
          // Don't fail the customer creation/update if pipeline creation fails
        }

        toast({
          title: "Success!",
          description: isUpdatingExistingCustomer 
            ? `Customer updated successfully! New interests added. Assigned to ${assignmentAudit.assignedToName}.`
            : `Customer added successfully! Assigned to ${assignmentAudit.assignedToName}.`,
          variant: "success",
        });

        // Call the callback with the created customer data
        if (typeof onCustomerCreated === 'function') {
          // If updating existing customer, fetch full customer data using cross-store endpoint
          if (isUpdatingExistingCustomer && existingCustomerId) {
            try {
              const updatedCustomerResponse = await apiService.getClient(existingCustomerId.toString(), false, true);
              if (updatedCustomerResponse.success && updatedCustomerResponse.data) {
                onCustomerCreated(updatedCustomerResponse.data);
              } else {
                onCustomerCreated(response.data);
              }
            } catch (error) {
              console.error('Error fetching updated customer:', error);
              onCustomerCreated(response.data);
            }
          } else {
            onCustomerCreated(response.data);
          }
        }

        // Reset update mode
        setIsUpdatingExistingCustomer(false);
        setExistingCustomerId(null);
        setExistingCustomerFullData(null);
        setExistingPhoneCustomer(null);
        
        onClose();
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          birthDate: "",
          anniversaryDate: "",
          streetAddress: "",
          fullAddress: "",
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
          selectedWeight: 3.5,
          weightUnit: "g",
          customerPreference: "",
          designNumber: "",
          addToPipeline: true,
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
          ageingPercentage: "",

          // Material Selection Fields
          materialType: "",
          materialWeight: 0,
          materialValue: 0,
          materialUnit: "g",
        });
        setInterests([{
          mainCategory: "",
          products: [{ product: "", revenue: "" }],
          designNumber: "",
          images: [],
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

      return fallbackValue;
    }
  };

  // Fetch sales persons when modal opens - OPTIMIZED
  useEffect(() => {
    if (open && user) {
      // Always fetch fresh data when modal opens

        const fetchData = async () => {
          try {
            setLoading(true);


            // Load salesperson options based on role

            await loadSalesPersonOptions();


            // Load products

            await loadProducts();


          // Load categories

          await loadCategories();


          } catch (error) {

            // Fallback to default options
            setSalesPersons(['Sales Person 1', 'Sales Person 2', 'Sales Person 3']);
          } finally {
            setLoading(false);

          }
        };

        fetchData();
    }
  }, [open, user]);

  // Load salesperson options when user changes
  useEffect(() => {

    if (!user) {

      return;
    }

    // Load salesperson options based on role

    loadSalesPersonOptions();
  }, [user]);

  // Debug: Log categories when they change
  useEffect(() => {
    console.log('🔍 Categories state updated:', categories.length, 'categories:', categories);
  }, [categories]);

  // Monitor salesPersons state changes
  useEffect(() => {
    if (salesPersons.length > 0) {

    }
  }, [salesPersons]);

  const loadSalesPersonOptions = async () => {
    if (!user) {

      return;
    }

    try {


      // Use the new context-aware API method

      const apiResponse = await apiService.getSalesPersonsForContext();



      if (apiResponse?.success && apiResponse.data) {
        let options: any[] = [];

        // Handle different response formats
        if (Array.isArray(apiResponse.data)) {
          options = apiResponse.data;
        } else if (apiResponse.data && typeof apiResponse.data === 'object' && 'users' in apiResponse.data && Array.isArray((apiResponse.data as any).users)) {
          options = (apiResponse.data as any).users;
        } else if (apiResponse.data && typeof apiResponse.data === 'object' && 'results' in apiResponse.data && Array.isArray((apiResponse.data as any).results)) {
          options = (apiResponse.data as any).results;
        }



        if (options.length > 0) {
          // Filter to only include inhouse_sales role users (exclude tele_calling)
          const salesRoleUsers = options.filter((u: any) =>
            u.role === 'inhouse_sales'
          );



          // Create display names with clean formatting
          const names = salesRoleUsers.map((u: any) => {
            const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
            return fullName || u.username || 'Unknown User';
          });

          // Store both display names and user data
          setSalesPersons(names);
          setSalesPersonOptions(salesRoleUsers.map((u: any) => ({
            id: u.id,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'Unknown User',
            username: u.username
          })));


          // Show context info to user based on their role
          let contextMessage = '';
          if (user.role === 'platform_admin') {
            contextMessage = `Found ${names.length} salespersons across all tenants`;
          } else if (user.role === 'business_admin') {
            contextMessage = `Found ${names.length} salespersons in your tenant${user.tenant ? ` (${user.tenant})` : ''}`;
          } else if (user.role === 'manager') {
            contextMessage = `Found ${names.length} salespersons in your ${user.store ? `store (${user.store})` : 'tenant'}`;
          } else if (['inhouse_sales', 'tele_calling', 'sales'].includes(user.role)) {
            contextMessage = `Found ${names.length} salespersons in your ${user.store ? `store (${user.store})` : 'tenant'}`;
          }

          // Removed toast notification - no need to show this on every modal open
        } else {
          // No salespersons found
          setSalesPersons([]);


          let noSalesMessage = '';
          if (user.role === 'platform_admin') {
            noSalesMessage = 'No salespersons found across all tenants.';
          } else if (user.role === 'business_admin') {
            noSalesMessage = `No salespersons found in your tenant${user.tenant ? ` (${user.tenant})` : ''}.`;
          } else if (user.role === 'manager') {
            noSalesMessage = `No salespersons found in your ${user.store ? `store (${user.store})` : 'tenant'}.`;
          } else {
            noSalesMessage = 'No salespersons available for assignment.';
          }

          // Removed toast notification - no need to show this on every modal open
        }
      } else {


        // Fallback for sales users - they can see all salespersons in their store
        if (['inhouse_sales', 'tele_calling', 'sales'].includes(user.role)) {
          const selfOption = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Current User';
          setSalesPersons([selfOption]);

        } else {
          setSalesPersons([]);


          // Removed toast notification - no need to show this on every modal open
        }
      }

    } catch (error) {


      // Fallback for sales users
      if (['inhouse_sales', 'tele_calling', 'sales'].includes(user.role)) {
        const selfOption = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Current User';
        setSalesPersons([selfOption]);

      } else {
        setSalesPersons([]);


        // Removed toast notification - no need to show this on every modal open
      }
    }
  };

  const loadProducts = async () => {

    try {
      setProductsLoading(true);

      // Use authenticated API to get products for the current user's tenant
      const response = await apiService.getProducts();

      if (response.success && response.data) {
        // Handle paginated response from Django REST Framework
        const productsData = Array.isArray(response.data)
          ? response.data
          : (response.data as { results?: any[]; data?: any[] }).results || (response.data as { results?: any[]; data?: any[] }).data || [];
        setProducts(productsData);

      } else {

        setProducts([]);
      }
    } catch (error) {

      setProducts([]);
    } finally {
      setProductsLoading(false);

    }
  };

  const loadCategories = async () => {
    try {
      console.log('🔍 loadCategories - Fetching categories...');
      const response = await apiService.getCategories();
      console.log('🔍 loadCategories - Full API Response:', JSON.stringify(response, null, 2));
      
      // Handle different response structures
      let categoriesData: any[] = [];
      
      // Check if response is successful (even if data is empty array)
      if (response && (response.success === true || response.success === undefined)) {
        // Response might be direct array or wrapped
        if (Array.isArray(response)) {
          categoriesData = response;
        } else if (response.data !== undefined && response.data !== null) {
          // response.data exists (even if it's an empty array)
          if (Array.isArray(response.data)) {
            categoriesData = response.data;
          } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
            categoriesData = response.data.results;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            categoriesData = response.data.data;
          }
        }
      }
      
      console.log('🔍 loadCategories - Extracted Categories Data:', categoriesData);
      console.log('🔍 loadCategories - Categories count:', categoriesData.length);
      console.log('🔍 loadCategories - Is array?', Array.isArray(categoriesData));
      
      // Always set categories (even if empty, we'll use fallback)
      if (categoriesData.length > 0) {
        setCategories(categoriesData);
        console.log('✅ loadCategories - Categories set successfully:', categoriesData.length, 'categories');
      } else {
        console.warn('⚠️ loadCategories - No categories found in response (empty array), using fallback');
        // Fallback to sample categories if API returns empty
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
        console.log('✅ loadCategories - Fallback categories set:', fallbackCategories.length, 'categories');
      }
    } catch (error) {
      console.error('❌ loadCategories - Error:', error);
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
      console.log('✅ loadCategories - Fallback categories set after error');
    }
  };

  const addInterest = () => {

    const newInterest = {
        mainCategory: "",
        products: [{ product: "", revenue: "" }],
        designNumber: "",
        images: [],
        preferences: {
          designSelected: false,
          wantsDiscount: false,
          checkingOthers: false,
          lessVariety: false,
          purchased: false,
          other: "",
        },
      };

    setInterests(prev => {
      const newInterests = [...prev, newInterest];

      return newInterests;
    });
    setInterestDetailsOpen(prev => [...prev, false]);
  };

  const addProductToInterest = (idx: number) => {

    setInterests((prev) => {
      const copy = [...prev];
      const newProduct = { product: "", revenue: "" };
      copy[idx].products.push(newProduct);

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

  const handleInterestImageSelect = async (file: File) => {
    if (!isAllowedImageFile(file)) {
      toast({ title: "Invalid image", description: "Use JPG/PNG/WebP up to 5MB.", variant: "destructive" });
      return;
    }
    try {
      setImageUploading(true);
      const res = await uploadImageToCloudinary(file);
      setUploadedImage({ url: res.url, thumbUrl: res.thumbUrl });
    } catch (e:any) {
      toast({ title: "Upload failed", description: e?.message || "Could not upload image.", variant: "destructive" });
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onClose}
      title="Add New Customer"
      description="Create a new customer profile with detailed information"
      size={isMobile ? "full" : isTablet ? "lg" : "xl"}
      hideMobileNav={true}
      showCloseButton={true}
      className="bg-white"
      actions={
        <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Skeleton className="w-4 h-4 mr-2 rounded" />
                Creating...
              </>
            ) : (
              'Create Customer'
            )}
          </Button>
        </div>
      }
    >
        {/* Mode toggle removed for a single streamlined quick-entry experience */}
        
        {/* Update Mode Indicator */}
        {isUpdatingExistingCustomer && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-semibold">ℹ️ Updating Existing Customer</span>
              <span className="text-sm text-blue-700">
                ({existingCustomerFullData?.full_name || existingPhoneCustomer?.name})
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsUpdatingExistingCustomer(false);
                  setExistingCustomerId(null);
                  setExistingCustomerFullData(null);
                  setExistingPhoneCustomer(null);
                  // Reset form to initial state
                  setFormData({
                    firstName: "",
                    lastName: "",
                    phone: "",
                    email: "",
                    birthDate: "",
                    anniversaryDate: "",
                    streetAddress: "",
                    fullAddress: "",
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
                    selectedWeight: 3.5,
                    weightUnit: "g",
                    customerPreference: "",
                    designNumber: "",
                    addToPipeline: true,
                    nextFollowUpDate: "",
                    nextFollowUpTime: "10:00",
                    summaryNotes: "",
                    pipelineStage: "interested",
                    budgetRange: "0-50000",
                    appointmentType: "In-Person",
                    customerType: "individual",
                    ageOfEndUser: "",
                    productSubtype: "",
                    ageingPercentage: "",
                    materialType: "",
                    materialWeight: 0,
                    materialValue: 0,
                    materialUnit: "g",
                  });
                  setInterests([createEmptyInterest()]);
                }}
                className="ml-auto text-xs"
              >
                Cancel Update
              </Button>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              You can add new interests and update information. New interests will be added to this customer.
            </p>
          </div>
        )}

        {/* Basic Customer Information */}
        <div className={`border rounded-lg ${isMobile ? 'p-3' : 'p-4'} mb-4`}>
          <div className={`font-semibold ${isMobile ? 'mb-2 text-base' : 'mb-3 text-lg'}`}>👤 Basic Information</div>
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : isTablet ? 'md:grid-cols-2 gap-4' : 'md:grid-cols-2 gap-4'}`}>
            <div>
              <label className="block text-sm font-medium mb-1">First Name *</label>
              <Input
                data-field="firstName"
                ref={(el) => {
                  registerField('firstName', el);
                  firstNameInputRef.current = el;
                }}
                placeholder=""
                required
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'firstName')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <Input
                data-field="lastName"
                ref={(el) => registerField('lastName', el)}
                placeholder=""
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    focusNext('phone');
                  } else {
                    handleKeyDown(e, 'lastName');
                  }
                }}
              />
            </div>
            <div className="w-full overflow-hidden">
              <label className="block text-sm font-medium mb-1">Phone Number *</label>
              <PhoneInputComponent
                placeholder="Enter phone number"
                required
                value={formData.phone}
                onChange={(value) => {
                  // Don't allow phone change when updating existing customer
                  if (!isUpdatingExistingCustomer) {
                    handleInputChange('phone', value);
                    // Clear existing customer info when phone changes
                    setExistingPhoneCustomer(null);
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, 'phone')}
                disabled={checkingPhone || isUpdatingExistingCustomer}
                defaultCountry="IN"
              />
              {isUpdatingExistingCustomer && (
                <div className="mt-1 text-xs text-blue-600">
                  ℹ️ Phone number locked - updating existing customer
                </div>
              )}
              {checkingPhone && (
                <div className="mt-1 text-xs text-blue-600">Checking phone number...</div>
              )}
              {existingPhoneCustomer && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="font-medium text-amber-900 mb-2">
                    📞 Customer with this phone already exists
                  </div>
                  <div className="text-sm text-amber-800 space-y-1">
                    {existingPhoneCustomer.store_name && (
                      <div className="font-semibold text-amber-900 mb-1 pb-1 border-b border-amber-300">
                        🏪 Store: {existingPhoneCustomer.store_name}
                      </div>
                    )}
                    <div><strong>Name:</strong> {existingPhoneCustomer.name}</div>
                    <div><strong>Email:</strong> {existingPhoneCustomer.email}</div>
                    <div><strong>Status:</strong> {existingPhoneCustomer.status}</div>
                    <div><strong>Previous Visits:</strong> {existingPhoneCustomer.total_visits} visit(s)</div>
                    {existingPhoneCustomer.last_visit && (
                      <div><strong>Last Visit:</strong> {new Date(existingPhoneCustomer.last_visit).toLocaleDateString()}</div>
                    )}
                  </div>
                  {existingPhoneCustomer.is_different_store && (
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                      ℹ️ This customer belongs to a different store (<strong>{existingPhoneCustomer.store_name}</strong>). You can still add interests to this customer.
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={useExistingCustomer}
                      className="text-xs bg-blue-600 hover:bg-blue-700"
                    >
                      ✓ Use Existing Customer & Add Interests
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExistingPhoneCustomer(null)}
                      className="text-xs"
                    >
                      Create New Customer Instead
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-amber-700">
                    💡 Tip: Using existing customer will load their details and allow you to add new interests. A new pipeline entry will be created for this visit.
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                data-field="email"
                ref={(el) => registerField('email', el)}
                placeholder=""
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    focusNext('ageOfEndUser');
                  } else {
                    handleKeyDown(e, 'email');
                  }
                }}
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
                <SelectTrigger 
                  data-field="ageOfEndUser"
                  ref={(el) => registerField('ageOfEndUser', el)}
                  onKeyDown={(e) => handleSelectKeyDown(e, 'ageOfEndUser', false)}
                >
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

        {/* Address Information */}
        <div className="border rounded-lg p-4 mb-4 mt-4">
          <div className="font-semibold mb-3 text-lg">📍 Address</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!quickEntry && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Street Address</label>
              <Input
                ref={(el) => registerField('streetAddress', el)}
                data-field="streetAddress"
                placeholder="e.g., 123, Diamond Lane"
                value={formData.streetAddress}
                onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    focusNext('city');
                  } else {
                    handleKeyDown(e, 'streetAddress');
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can enter any address here
              </p>
            </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Full Address (Optional)</label>
              <Textarea
                placeholder="Enter complete full address including street, area, landmark, etc."
                value={formData.fullAddress}
                onChange={(e) => handleInputChange('fullAddress', e.target.value)}
                rows={3}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Complete address for delivery or reference
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City *</label>
              <ComboboxSelect
                // City selection auto-advances on mobile quick entry
                value={formData.city}
                onValueChange={(value) => {
                  handleCitySelection(value);
                  focusNext('state');
                }}
                options={INDIAN_CITIES}
                placeholder="Select City or type to search"
                customPlaceholder="Type city name"
                commitOnSelect
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State *</label>
              <ComboboxSelect
                value={formData.state}
                onValueChange={(value) => {
                  handleInputChange('state', value);
                  focusNext('catchmentArea');
                }}
                options={INDIAN_STATES}
                placeholder={isFieldLocked('state', lockedFields) ? "Auto-filled from City" : "Select State or type"}
                customPlaceholder="Type state name"
                disabled={isFieldLocked('state', lockedFields)}
                commitOnSelect
              />
              {isFieldLocked('state', lockedFields) && (
                <div className="text-xs text-blue-600 mt-1">
                  🔒 Auto-filled from selected city
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Catchment Area *</label>
              <ComboboxSelect
                value={formData.catchmentArea}
                onValueChange={(value) => {
                  handleCatchmentSelection(value);
                  focusNext('salesPerson');
                }}
                options={formData.city ? getCatchmentAreasForCity(formData.city) : []}
                placeholder={formData.city ? "Select Catchment Area or type" : "Select City First"}
                customPlaceholder="Type catchment area"
                disabled={!formData.city}
                commitOnSelect
              />
              {!formData.city && (
                <div className="text-xs text-gray-500 mt-1">
                  Select a city to see available catchment areas
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pincode</label>
              <ComboboxSelect
                value={formData.pincode}
                onValueChange={(value) => {
                  handleInputChange('pincode', value);
                  focusNext('reasonForVisit');
                }}
                options={(formData.catchmentArea && formData.pincode) ? [formData.pincode] : []}
                placeholder={isFieldLocked('pincode', lockedFields) ? "Auto-filled from Catchment (optional)" : "Enter or select Pincode (optional)"}
                customPlaceholder="Type pincode"
                disabled={isFieldLocked('pincode', lockedFields)}
                commitOnSelect
              />
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
                onValueChange={(value) => {
                  handleInputChange('salesPerson', value);
                  focusNext('reasonForVisit');
                }}
              >
                <SelectTrigger data-field="salesPerson">
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
                {user?.role === 'platform_admin' ? '🌐 All salespersons across all tenants' :
                 user?.role === 'business_admin' ? '🏢 All salespersons in your tenant' :
                 user?.role === 'manager' ? '👥 Salespersons in your store/tenant' :
                 user?.role === 'inhouse_sales' || user?.role === 'tele_calling' || user?.role === 'sales' ? '👥 All salespersons in your store' :
                 '👤 Available sales team'}
              </div>
            </div>
            {/* Customer Status removed per client request */}
            <div>
              <label className="block text-sm font-medium mb-1">Reason for Visit *</label>
              <ComboboxSelect
                value={formData.reasonForVisit}
                onValueChange={(value) => {
                  handleInputChange('reasonForVisit', value);
                  focusNext('leadSource');
                }}
                options={REASONS_FOR_VISIT}
                placeholder="Select Reason"
                customPlaceholder="Enter custom reason for visit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lead Source *</label>
              <ComboboxSelect
                value={formData.leadSource}
                onValueChange={(value) => {
                  handleInputChange('leadSource', value);
                }}
                options={LEAD_SOURCES}
                placeholder="Select Source"
                customPlaceholder="Enter custom lead source"
              />
        </div>

            {quickEntry && (
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                  <label className="block text-sm font-medium mb-1">Next Follow-up Date</label>
                        <Input
                    data-field="nextFollowUpDate"
                    type="date"
                    value={formData.nextFollowUpDate}
                    onChange={(e) => {
                      handleInputChange('nextFollowUpDate', e.target.value);
                      focusNext('nextFollowUpTime');
                    }}
                  />
                    </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Next Follow-up Time</label>
                          <Input
                    data-field="nextFollowUpTime"
                    type="time"
                    value={formData.nextFollowUpTime}
                    onChange={(e) => handleInputChange('nextFollowUpTime', e.target.value)}
                          />
                        </div>
                    </div>
                  )}
                </div>
                      </div>



          {/* Product Interests */}
          <div className={`border rounded-lg ${isMobile ? 'p-3' : 'p-4'} bg-gray-50`}>
            <div className={`${isMobile ? 'space-y-2' : 'flex items-center justify-between mb-4'}`}>
              <div className="font-medium text-base">Product Interests</div>
              <Button
                variant={isMobile ? 'default' : 'outline'}
                size={isMobile ? 'default' : 'sm'}
                onClick={addInterest}
                className={`${isMobile ? 'w-full' : 'text-sm'}`}
              >
                + Add Interest
              </Button>
            </div>

            {interests.map((interest, idx) => {
              if (!interest || !interest.preferences) {
                return null;
              }

              return (
                <div key={idx} className={`border rounded-lg ${isMobile ? 'p-3' : 'p-4'} mb-4 bg-white shadow-sm`}>
                  <div className={`${isMobile ? 'space-y-2' : 'flex items-center justify-between mb-4'}`}>
                    <div className="font-medium text-base">Interest #{idx + 1}</div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInterestDetailsOpen(prev => prev.map((o,i) => i===idx ? !o : o))}
                      >
                        {interestDetailsOpen[idx] ? 'Hide Details' : 'Show Details'}
                      </Button>
                      {interests.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 text-sm"
                          onClick={() => {
                            setInterests(prev => prev.filter((_, i) => i !== idx));
                            setInterestDetailsOpen(prev => prev.filter((_, i) => i !== idx));
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Category Selection for this interest */}
                  <div className={`${isMobile ? 'mb-3' : 'mb-4'}`}>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    {categories.length === 0 && (
                      <div className="text-xs text-gray-500 mb-1">Loading categories...</div>
                    )}
                    <Select
                      value={interest.mainCategory || ''}
                      onValueChange={(value) => {
                        console.log('🔍 Category selected:', value);
                        setInterests(prev => {
                          const copy = [...prev];
                          copy[idx].mainCategory = value;
                          // Clear product when category changes
                          if (copy[idx].products[0]) {
                            copy[idx].products[0].product = "";
                            copy[idx].products[0].revenue = "";
                          }
                          return copy;
                        });
                        // Also set global product type if not already set
                        setFormData(prev => ({ ...prev, productType: prev.productType || value }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Loading categories...
                          </div>
                        ) : (
                          categories.map((category) => (
                            <SelectItem key={category.id || category.name} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Product Selection for this interest */}
                  <div className={`${isMobile ? 'mb-3' : 'mb-4'}`}>
                    <label className="block text-sm font-medium mb-2">Product</label>
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
                            // Set product type from product category if not already set
                            const pt = selectedProduct.category_name || selectedProduct.category || selectedProduct.product_type || '';
                            if (pt) {
                              setFormData(prev => ({ ...prev, productType: prev.productType || pt }));
                            }
                          }
                          return copy;
                        });
                      }}
                      disabled={!interest.mainCategory}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={interest.mainCategory ? "Select Product" : "Select Category First"} />
                      </SelectTrigger>
                      <SelectContent>
                        {products
                          .filter((product) => {
                            // Filter products by selected category
                            if (!interest.mainCategory) return false;
                            // Match by category name or ID
                            const categoryName = product.category_name || product.category?.name || '';
                            const categoryId = product.category_id || product.category?.id;
                            return categoryName === interest.mainCategory || 
                                   (categoryId && categories.find(c => c.id === categoryId)?.name === interest.mainCategory);
                          })
                          .map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - ₹{product.selling_price?.toLocaleString('en-IN') || product.price?.toLocaleString('en-IN') || 'Price N/A'}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {!interest.mainCategory && (
                      <div className="text-xs text-blue-600 mt-1">
                        Please select a category first
                      </div>
                    )}
                  </div>

                  {interestDetailsOpen[idx] && (
                    <>
                      {/* Revenue for this interest */}
                      <div className={`${isMobile ? 'mb-3' : 'mb-4'}`}>
                        <label className="block text-sm font-medium mb-2">Expected Revenue (₹)</label>
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
                          className="w-full"
                        />
                      </div>

                      {/* Customer Preferences for this interest */}
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">Customer Preferences:</div>
                        <div className="space-y-2">
                      <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
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
                        <span className="text-sm">Design Selected</span>
                      </label>
                      <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
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
                        <span className="text-sm">Wants Discount</span>
                      </label>
                      <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
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
                        <span className="text-sm">Checking Others</span>
                      </label>
                      <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
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
                        <span className="text-sm">Less Variety</span>
                      </label>
                      <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
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
                        <span className="text-sm">Purchased</span>
                      </label>
                    </div>
                  </div>
                    </>
                  )}

                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Other Preferences</label>
                    <Input
                      placeholder="Other preferences for this interest..."
                      className="w-full"
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

                  {/* Design Number Field */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Design Number</label>
                    <Input
                      placeholder="Enter design number..."
                      className="w-full"
                      value={interest.designNumber || ""}
                      onChange={(e) => {
                        setInterests(prev => {
                          const copy = [...prev];
                          copy[idx].designNumber = e.target.value;
                          return copy;
                        });
                      }}
                    />
                  </div>

                  {/* Image Upload per Interest */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Product Images (Max 2)</label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        id={`interest-image-${idx}`}
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;
                          
                          // Limit to 2 images total per interest
                          const currentImages = interest.images || [];
                          const remainingSlots = 2 - currentImages.length;
                          if (remainingSlots <= 0) {
                            toast({
                              title: "Limit reached",
                              description: "Maximum 2 images per interest",
                              variant: "destructive"
                            });
                            return;
                          }
                          
                          const filesToUpload = files.slice(0, remainingSlots);
                          const newImages: { url: string; thumbUrl: string }[] = [];
                          
                          for (const file of filesToUpload) {
                            if (!isAllowedImageFile(file)) {
                              toast({
                                title: "Invalid image",
                                description: "Use JPG/PNG/WebP up to 5MB.",
                                variant: "destructive"
                              });
                              continue;
                            }
                            
                            try {
                              setImageUploading(true);
                              const res = await uploadImageToCloudinary(file);
                              newImages.push({ url: res.url, thumbUrl: res.thumbUrl });
                            } catch (e: any) {
                              toast({
                                title: "Upload failed",
                                description: e?.message || "Could not upload image.",
                                variant: "destructive"
                              });
                            }
                          }
                          
                          if (newImages.length > 0) {
                            setInterests(prev => {
                              const copy = [...prev];
                              copy[idx].images = [...(copy[idx].images || []), ...newImages];
                              return copy;
                            });
                          }
                          
                          setImageUploading(false);
                          // Reset input
                          e.target.value = '';
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById(`interest-image-${idx}`)?.click()}
                        disabled={imageUploading || (interest.images?.length || 0) >= 2}
                        className="w-full"
                      >
                        {imageUploading ? "Uploading..." : (interest.images?.length || 0) >= 2 ? "Max 2 images" : "Choose Images"}
                      </Button>
                      
                      {/* Show uploaded images preview */}
                      {interest.images && interest.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {interest.images.map((img, imgIdx) => (
                            <div key={imgIdx} className="relative">
                              <img
                                src={img.thumbUrl || img.url}
                                alt={`Product image ${imgIdx + 1}`}
                                className="w-full h-24 object-cover rounded border"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute top-1 right-1 bg-red-500 text-white hover:bg-red-600 h-6 w-6 p-0"
                                onClick={() => {
                                  setInterests(prev => {
                                    const copy = [...prev];
                                    copy[idx].images = copy[idx].images?.filter((_, i) => i !== imgIdx) || [];
                                    return copy;
                                  });
                                }}
                              >
                                ×
                              </Button>
                              {interest.designNumber && (
                                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                  {interest.designNumber}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

       





        {/* Additional Information (always visible, trimmed for quick flow) */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="font-semibold mb-3 text-lg">📝 Additional Information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Design Number</label>
              <Input
                data-field="designNumber"
                placeholder=""
                value={formData.designNumber}
                onChange={(e) => handleInputChange('designNumber', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    focusNext('summaryNotes');
                  }
                }}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <Textarea
                data-field="summaryNotes"
                placeholder="Key discussion points, customer preferences, next steps..."
                rows={3}
                value={formData.summaryNotes}
                onChange={(e) => handleInputChange('summaryNotes', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Autofill Audit Trail */}
        
    </ResponsiveDialog>
  );
}
